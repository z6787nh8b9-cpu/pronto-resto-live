import { afterAll, describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { businessMembers, businessOnboarding, businesses, businessProfiles, mediaAssets } from "../drizzle/schema";

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const testSlug = `business-test-${runId}`;

const adminCaller = appRouter.createCaller({
  adminAccount: { id: 1, email: "test-admin@pronto.local" },
  user: null,
  restaurantOwner: null,
  req: { session: {} },
  res: {},
} as any);

const anonymousCaller = appRouter.createCaller({
  adminAccount: null,
  user: null,
  restaurantOwner: null,
  req: { session: {} },
  res: {},
} as any);

const unrelatedOwnerCaller = appRouter.createCaller({
  adminAccount: null,
  user: null,
  restaurantOwner: { id: 999999, email: "unrelated@pronto.local" },
  req: { session: {} },
  res: {},
} as any);

const ownerCaller = appRouter.createCaller({
  adminAccount: null,
  user: null,
  restaurantOwner: { id: 777777, email: "owner@pronto.local" },
  req: { session: {} },
  res: {},
} as any);

afterAll(async () => {
  const db = await getDb();
  if (!db) return;
  const [business] = await db.select().from(businesses).where(eq(businesses.slug, testSlug)).limit(1);
  if (!business) return;
  await db.delete(mediaAssets).where(eq(mediaAssets.businessId, business.id));
  await db.delete(businessMembers).where(eq(businessMembers.businessId, business.id));
  await db.delete(businessOnboarding).where(eq(businessOnboarding.businessId, business.id));
  await db.delete(businessProfiles).where(eq(businessProfiles.businessId, business.id));
  await db.delete(businesses).where(eq(businesses.id, business.id));
});

describe("Generic business core", () => {
  it("lets a platform administrator create a draft business with a public profile", async () => {
    const business = await adminCaller.businesses.create({
      slug: testSlug,
      name: "Studio de démonstration",
      vertical: "beauty",
      description: "Une entreprise multi-secteurs de test.",
      subscriptionTier: "pro",
    });

    expect(business).toMatchObject({
      slug: testSlug,
      vertical: "beauty",
      status: "draft",
      subscriptionTier: "pro",
    });

    const workspace = await adminCaller.businesses.getWorkspace({ businessId: business.id });
    expect(workspace.business).toMatchObject({ vertical: "beauty" });
    expect(workspace.profile).toMatchObject({ displayName: "Studio de démonstration" });
  });

  it("refuses generic business creation from an anonymous caller", async () => {
    await expect(anonymousCaller.businesses.create({
      slug: `forbidden-${runId}`,
      name: "Accès refusé",
      vertical: "service",
    })).rejects.toBeInstanceOf(TRPCError);
  });

  it("keeps workspace data private from a non-member owner", async () => {
    const [business] = await (await getDb())!
      .select()
      .from(businesses)
      .where(eq(businesses.slug, testSlug))
      .limit(1);

    await expect(unrelatedOwnerCaller.businesses.getWorkspace({ businessId: business.id })).rejects.toBeInstanceOf(TRPCError);
  });

  it("persists onboarding only for an authorized enterprise workspace", async () => {
    const [business] = await (await getDb())!
      .select()
      .from(businesses)
      .where(eq(businesses.slug, testSlug))
      .limit(1);

    const onboarding = await adminCaller.businesses.updateOnboarding({
      businessId: business.id,
      industry: "beauty",
      primaryGoal: "Présenter des soins",
      completedSteps: ["business_type", "catalog"],
      status: "in_progress",
    });
    expect(onboarding).toMatchObject({ businessId: business.id, industry: "beauty", completedSteps: ["business_type", "catalog"] });
    await expect(unrelatedOwnerCaller.businesses.getOnboarding({ businessId: business.id })).rejects.toBeInstanceOf(TRPCError);
    await expect(unrelatedOwnerCaller.businesses.listMedia({ businessId: business.id })).rejects.toBeInstanceOf(TRPCError);
  });

  it("lets an owner manage non-owner members without exposing cross-business access", async () => {
    const db = await getDb();
    const [business] = await db!
      .select()
      .from(businesses)
      .where(eq(businesses.slug, testSlug))
      .limit(1);
    await db!.insert(businessMembers).values([
      { businessId: business.id, principalType: "restaurant_owner", principalId: 777777, role: "owner", status: "active" },
      { businessId: business.id, principalType: "restaurant_owner", principalId: 777778, role: "editor", status: "active" },
    ]);

    const members = await ownerCaller.businesses.listMembers({ businessId: business.id });
    const editor = members.find((member) => member.principalId === 777778);
    expect(editor).toMatchObject({ role: "editor", status: "active" });

    const updated = await ownerCaller.businesses.updateMember({
      businessId: business.id,
      memberId: editor!.id,
      role: "publisher",
      status: "suspended",
    });
    expect(updated).toMatchObject({ role: "publisher", status: "suspended" });
    await expect(unrelatedOwnerCaller.businesses.listMembers({ businessId: business.id })).rejects.toBeInstanceOf(TRPCError);
    await expect(unrelatedOwnerCaller.businesses.updateMember({ businessId: business.id, memberId: editor!.id, role: "analyst" })).rejects.toBeInstanceOf(TRPCError);
  });

  it("archives and restores a media record without exposing it to an unrelated owner", async () => {
    const db = await getDb();
    const [business] = await db!
      .select()
      .from(businesses)
      .where(eq(businesses.slug, testSlug))
      .limit(1);
    const created = await db!.insert(mediaAssets).values({
      businessId: business.id,
      uploadedByType: "admin",
      uploadedById: 1,
      originalName: "test.png",
      mimeType: "image/png",
      sizeBytes: 8,
      storageKey: `tests/${runId}/test.png`,
      url: "https://example.test/test.png",
    });
    const assetId = Number(created[0].insertId);

    await adminCaller.businesses.archiveMedia({ businessId: business.id, assetId });
    const activeAssets = await adminCaller.businesses.listMedia({ businessId: business.id });
    expect(activeAssets.find((asset) => asset.id === assetId)).toBeUndefined();

    const archivedAssets = await adminCaller.businesses.listArchivedMedia({ businessId: business.id });
    expect(archivedAssets.find((asset) => asset.id === assetId)).toMatchObject({ id: assetId });
    await expect(unrelatedOwnerCaller.businesses.restoreMedia({ businessId: business.id, assetId })).rejects.toBeInstanceOf(TRPCError);

    await adminCaller.businesses.restoreMedia({ businessId: business.id, assetId });
    const restoredAssets = await adminCaller.businesses.listMedia({ businessId: business.id });
    expect(restoredAssets.find((asset) => asset.id === assetId)).toMatchObject({ id: assetId });

    const [restored] = await db!.select().from(mediaAssets).where(eq(mediaAssets.id, assetId)).limit(1);
    expect(restored.archivedAt).toBeNull();
  });

  it("exposes only published business identity to public visitors", async () => {
    const publicBusiness = await anonymousCaller.businesses.getPublicBySlug({ slug: "la-voile-rouge" });

    expect(publicBusiness).toMatchObject({ slug: "la-voile-rouge", vertical: "restaurant" });
    expect(publicBusiness).not.toHaveProperty("legacyRestaurantId");
    expect(publicBusiness).not.toHaveProperty("subscriptionStatus");
  });
});
