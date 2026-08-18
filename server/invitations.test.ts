/**
 * Invitation access-control tests.
 * These tests use explicit caller identities and clean their own data so the
 * production database never accumulates fixed test slugs.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { inArray } from "drizzle-orm";
import { getDb } from "./db";
import { appRouter } from "./routers";
import { invitations, restaurants } from "../drizzle/schema";

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const createdRestaurantIds: number[] = [];

const adminContext = {
  adminAccount: { id: 1, email: "test-admin@pronto.local" },
  user: null,
  restaurantOwner: null,
  req: { session: {} },
  res: {},
} as any;

const anonymousContext = {
  adminAccount: null,
  user: null,
  restaurantOwner: null,
  req: { session: {} },
  res: {},
} as any;

const adminCaller = appRouter.createCaller(adminContext);
const anonymousCaller = appRouter.createCaller(anonymousContext);

async function createTestRestaurant(label: string) {
  const restaurant = await adminCaller.admin.createRestaurant({
    name: `Invitation test ${label}`,
    slug: `invitation-${label}-${runId}`,
    subscriptionTier: "menu",
    subscriptionStatus: "trial",
  });
  createdRestaurantIds.push(restaurant.id);
  return restaurant;
}

beforeAll(() => {
  expect(adminCaller).toBeDefined();
});

afterAll(async () => {
  if (!createdRestaurantIds.length) return;
  const db = await getDb();
  if (!db) return;

  await db.delete(invitations).where(inArray(invitations.restaurantId, createdRestaurantIds));
  await db.delete(restaurants).where(inArray(restaurants.id, createdRestaurantIds));
});

describe("Invitation access control", () => {
  it("refuses creation from an anonymous caller", async () => {
    await expect(
      anonymousCaller.invitations.create({ restaurantId: 1 }),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it("allows a platform administrator to create an expiring invitation", async () => {
    const restaurant = await createTestRestaurant("create");
    const invitation = await adminCaller.invitations.create({ restaurantId: restaurant.id });

    expect(invitation.token).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(invitation.invitationUrl).toContain(invitation.token);

    const expiresInHours = (new Date(invitation.expiresAt).getTime() - Date.now()) / 3_600_000;
    expect(expiresInHours).toBeGreaterThan(23.9);
    expect(expiresInHours).toBeLessThan(24.1);
  });

  it("returns only the public information needed to accept a valid invitation", async () => {
    const restaurant = await createTestRestaurant("public-view");
    const created = await adminCaller.invitations.create({ restaurantId: restaurant.id });

    const result = await anonymousCaller.invitations.getByToken({ token: created.token });

    expect(result.valid).toBe(true);
    expect(result.restaurant).toMatchObject({ name: restaurant.name, slug: restaurant.slug });
    expect(result.invitation).toMatchObject({ id: created.id, status: "pending" });
    expect(result.invitation).not.toHaveProperty("token");
    expect(result.invitation).not.toHaveProperty("acceptedBy");
  });

  it("refuses the global invitation listing from an anonymous caller", async () => {
    await expect(anonymousCaller.invitations.listAll()).rejects.toBeInstanceOf(TRPCError);
  });

  it("rejects an unknown public invitation token without exposing internal data", async () => {
    const result = await anonymousCaller.invitations.getByToken({
      token: "00000000-0000-0000-0000-000000000000",
    });

    expect(result).toEqual({ valid: false, reason: "not_found" });
  });
});
