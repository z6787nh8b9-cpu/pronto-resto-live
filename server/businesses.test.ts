import { afterAll, describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { businessOnboarding, businesses, businessProfiles, mediaAssets } from "../drizzle/schema";

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

afterAll(async () => {
  const db = await getDb();
  if (!db) return;
  const [business] = await db.select().from(businesses).where(eq(businesses.slug, testSlug)).limit(1);
  if (!business) return;
  await db.delete(mediaAssets).where(eq(mediaAssets.businessId, business.id));
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
    expect(workspace.profile).toMatchObject({ displayName: "Studio de démonstration" });
  });

  it("refuses generic business creation from an anonymous caller", async () => {
    await expect(anonymousCaller.businesses.create({
      slug: `forbidden-${runId}`,
      name: "Accès refusé",
      vertical: "service",
    })).rejects.toBeInstanceOf(TRPCError);
  });

  it("never exposes a draft business catalog to an anonymous visitor", async () => {
    await expect(anonymousCaller.businesses.getPublicCatalogBySlug({ slug: testSlug }))
      .rejects.toBeInstanceOf(TRPCError);
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

  it("refuses profile, catalog and media mutations from a non-member owner", async () => {
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
      originalName: "private.png",
      mimeType: "image/png",
      sizeBytes: 8,
      storageKey: `tests/${runId}/private.png`,
      url: "https://example.test/private.png",
    });
    const assetId = Number(created[0].insertId);

    await expect(unrelatedOwnerCaller.businesses.updateProfile({ businessId: business.id, displayName: "Intrusion" })).rejects.toBeInstanceOf(TRPCError);
    await expect(unrelatedOwnerCaller.businesses.createCatalog({ businessId: business.id, slug: `intrusion-${runId}`, name: "Intrusion", type: "services" })).rejects.toBeInstanceOf(TRPCError);
    await expect(unrelatedOwnerCaller.businesses.listCatalogContent({ businessId: business.id, catalogId: 1 })).rejects.toBeInstanceOf(TRPCError);
    await expect(unrelatedOwnerCaller.businesses.archiveMedia({ businessId: business.id, assetId })).rejects.toBeInstanceOf(TRPCError);
  });

  it("archives a media record without exposing it in the active library", async () => {
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

    const [archived] = await db!.select().from(mediaAssets).where(eq(mediaAssets.id, assetId)).limit(1);
    expect(archived.archivedAt).toBeInstanceOf(Date);
  });

  it("exposes only published business identity to public visitors", async () => {
    const publicBusiness = await anonymousCaller.businesses.getPublicBySlug({ slug: "la-voile-rouge" });

    expect(publicBusiness).toMatchObject({ slug: "la-voile-rouge", vertical: "restaurant" });
    expect(publicBusiness).not.toHaveProperty("legacyRestaurantId");
    expect(publicBusiness).not.toHaveProperty("subscriptionStatus");
  });
});
