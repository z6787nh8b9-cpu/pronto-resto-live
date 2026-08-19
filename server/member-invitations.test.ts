import { createHash } from "crypto";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { businessMemberInvitations, businessMembers, businessProfiles, businesses } from "../drizzle/schema";

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const testSlug = `member-invitation-${runId}`;
const ownerId = 920000 + Math.floor(Math.random() * 10_000);

function ownerCaller(id: number, email: string) {
  return appRouter.createCaller({
    adminAccount: null,
    user: null,
    restaurantOwner: { id, email },
    req: { session: {} },
    res: {},
  } as any);
}

const platformAdmin = appRouter.createCaller({
  adminAccount: { id: 1, email: "test-admin@pronto.local" },
  user: null,
  restaurantOwner: null,
  req: { session: {} },
  res: {},
} as any);

async function getTestBusiness() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable for member invitation test.");
  const [business] = await db.select().from(businesses).where(eq(businesses.slug, testSlug)).limit(1);
  if (!business) throw new Error("Member invitation test business was not created.");
  return { db, business };
}

beforeAll(async () => {
  const business = await platformAdmin.businesses.create({
    slug: testSlug,
    name: "Espace invitations sécurisé",
    vertical: "service",
    description: "Espace de test dédié aux invitations de membres.",
    subscriptionTier: "pro",
  });
  const db = await getDb();
  if (!db) throw new Error("Database unavailable for member invitation setup.");
  await db.insert(businessMembers).values({
    businessId: business.id,
    principalType: "restaurant_owner",
    principalId: ownerId,
    role: "owner",
    status: "active",
  });
});

afterAll(async () => {
  const db = await getDb();
  if (!db) return;
  const [business] = await db.select().from(businesses).where(eq(businesses.slug, testSlug)).limit(1);
  if (!business) return;
  await db.delete(businessMemberInvitations).where(eq(businessMemberInvitations.businessId, business.id));
  await db.delete(businessMembers).where(eq(businessMembers.businessId, business.id));
  await db.delete(businessProfiles).where(eq(businessProfiles.businessId, business.id));
  await db.delete(businesses).where(eq(businesses.id, business.id));
});

describe("Business member invitations", () => {
  it("lets an authorized owner create an invitation and returns only a raw token for delivery", async () => {
    const { business, db } = await getTestBusiness();
    const result = await ownerCaller(ownerId, "owner-invites@pronto.local").businesses.createMemberInvitation({
      businessId: business.id,
      email: "Collaborateur.Invite@Pronto.Local",
      role: "editor",
    });

    expect(result).toMatchObject({ expiresInDays: 7 });
    expect(result.token).toMatch(/^[a-f0-9]{64}$/i);
    const tokenHash = createHash("sha256").update(result.token).digest("hex");
    const [stored] = await db.select().from(businessMemberInvitations)
      .where(eq(businessMemberInvitations.tokenHash, tokenHash)).limit(1);
    expect(stored).toMatchObject({
      businessId: business.id,
      email: "collaborateur.invite@pronto.local",
      role: "editor",
      status: "pending",
    });
    expect(stored?.tokenHash).not.toBe(result.token);
  });

  it("accepts an invitation only for the matching authenticated email and consumes it", async () => {
    const { business, db } = await getTestBusiness();
    const targetEmail = "accepted-member@pronto.local";
    const targetOwnerId = ownerId + 1;
    const invite = await ownerCaller(ownerId, "owner-invites@pronto.local").businesses.createMemberInvitation({
      businessId: business.id,
      email: targetEmail,
      role: "publisher",
    });

    await expect(ownerCaller(targetOwnerId, "other-email@pronto.local").businesses.acceptMemberInvitation({ token: invite.token }))
      .rejects.toBeInstanceOf(TRPCError);

    const accepted = await ownerCaller(targetOwnerId, targetEmail).businesses.acceptMemberInvitation({ token: invite.token });
    expect(accepted).toEqual({ businessId: business.id, role: "publisher" });

    const [membership] = await db.select().from(businessMembers).where(and(
      eq(businessMembers.businessId, business.id),
      eq(businessMembers.principalType, "restaurant_owner"),
      eq(businessMembers.principalId, targetOwnerId),
    )).limit(1);
    expect(membership).toMatchObject({ role: "publisher", status: "active" });

    const tokenHash = createHash("sha256").update(invite.token).digest("hex");
    const [storedInvite] = await db.select().from(businessMemberInvitations)
      .where(eq(businessMemberInvitations.tokenHash, tokenHash)).limit(1);
    expect(storedInvite).toMatchObject({ status: "accepted", acceptedByPrincipalId: targetOwnerId });
    expect(storedInvite?.acceptedAt).toBeInstanceOf(Date);

    await expect(ownerCaller(targetOwnerId, targetEmail).businesses.acceptMemberInvitation({ token: invite.token }))
      .rejects.toBeInstanceOf(TRPCError);
  });

  it("rejects a token that is expired even when the authenticated email matches", async () => {
    const { business, db } = await getTestBusiness();
    const rawToken = "a".repeat(64);
    const expiredOwnerId = ownerId + 2;
    await db.insert(businessMemberInvitations).values({
      businessId: business.id,
      email: "expired-member@pronto.local",
      role: "analyst",
      tokenHash: createHash("sha256").update(rawToken).digest("hex"),
      invitedByPrincipalId: ownerId,
      expiresAt: new Date(Date.now() - 1_000),
    });

    await expect(ownerCaller(expiredOwnerId, "expired-member@pronto.local").businesses.acceptMemberInvitation({ token: rawToken }))
      .rejects.toBeInstanceOf(TRPCError);

    const [membership] = await db.select().from(businessMembers).where(and(
      eq(businessMembers.businessId, business.id),
      eq(businessMembers.principalType, "restaurant_owner"),
      eq(businessMembers.principalId, expiredOwnerId),
    )).limit(1);
    expect(membership).toBeUndefined();
  });
});
