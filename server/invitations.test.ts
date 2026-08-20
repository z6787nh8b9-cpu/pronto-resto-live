/**
 * Invitation access-control tests.
 * These tests use explicit caller identities and clean their own data so the
 * production database never accumulates fixed test slugs.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { eq, inArray } from "drizzle-orm";
import { getDb } from "./db";
import { appRouter } from "./routers";
import { invitations, restaurants } from "../drizzle/schema";
import { hashOwnerInvitationToken } from "./owner-invitation-token";
import { claimRestaurantInvitation } from "./auth-config";

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

    expect(invitation.token).toMatch(/^[0-9a-f]{64}$/i);
    expect(invitation.invitationUrl).toContain(invitation.token);

    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const [stored] = await db.select().from(invitations).where(eq(invitations.id, Number(invitation.id))).limit(1);
    expect(stored?.tokenHash).toBe(hashOwnerInvitationToken(invitation.token));
    expect(stored).not.toHaveProperty("token");

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
      token: "0".repeat(64),
    });

    expect(result).toEqual({ valid: false, reason: "not_found" });
  });

  it("reports an expired invitation without mutating its persisted status from a public read", async () => {
    const restaurant = await createTestRestaurant("expired-view");
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const token = "a".repeat(64);
    const [created] = await db.insert(invitations).values({
      restaurantId: restaurant.id,
      tokenHash: hashOwnerInvitationToken(token),
      status: "pending",
      expiresAt: new Date(Date.now() - 60_000),
    });
    const invitationId = Number(created.insertId);

    await expect(anonymousCaller.invitations.getByToken({ token })).resolves.toEqual({ valid: false, reason: "expired" });
    const [stored] = await db.select({ status: invitations.status }).from(invitations).where(eq(invitations.id, invitationId)).limit(1);
    expect(stored?.status).toBe("pending");
  });

  it("allows only one concurrent owner to claim the same pending invitation", async () => {
    const restaurant = await createTestRestaurant("atomic-claim");
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const token = "b".repeat(64);
    await db.insert(invitations).values({
      restaurantId: restaurant.id,
      tokenHash: hashOwnerInvitationToken(token),
      status: "pending",
      expiresAt: new Date(Date.now() + 60_000),
    });

    const claims = await Promise.all([
      claimRestaurantInvitation(db, token, 900_001),
      claimRestaurantInvitation(db, token, 900_002),
    ]);
    expect(claims.filter((claim) => claim === restaurant.id)).toHaveLength(1);
    expect(claims.filter((claim) => claim === null)).toHaveLength(1);

    const [storedInvitation] = await db.select({ acceptedBy: invitations.acceptedBy, status: invitations.status })
      .from(invitations).where(eq(invitations.tokenHash, hashOwnerInvitationToken(token))).limit(1);
    const [storedRestaurant] = await db.select({ ownerId: restaurants.ownerId })
      .from(restaurants).where(eq(restaurants.id, restaurant.id)).limit(1);
    expect(storedInvitation?.status).toBe("accepted");
    expect(storedInvitation?.acceptedBy).toBe(storedRestaurant?.ownerId);
    expect([900_001, 900_002]).toContain(storedRestaurant?.ownerId);
  });
});
