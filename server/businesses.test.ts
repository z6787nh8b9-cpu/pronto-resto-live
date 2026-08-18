import { afterAll, describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { businesses, businessProfiles } from "../drizzle/schema";

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

  it("keeps workspace data private from a non-member owner", async () => {
    const [business] = await (await getDb())!
      .select()
      .from(businesses)
      .where(eq(businesses.slug, testSlug))
      .limit(1);

    await expect(unrelatedOwnerCaller.businesses.getWorkspace({ businessId: business.id })).rejects.toBeInstanceOf(TRPCError);
  });

  it("exposes only published business identity to public visitors", async () => {
    const publicBusiness = await anonymousCaller.businesses.getPublicBySlug({ slug: "la-voile-rouge" });

    expect(publicBusiness).toMatchObject({ slug: "la-voile-rouge", vertical: "restaurant" });
    expect(publicBusiness).not.toHaveProperty("legacyRestaurantId");
    expect(publicBusiness).not.toHaveProperty("subscriptionStatus");
  });
});
