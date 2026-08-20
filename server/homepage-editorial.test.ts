import { afterAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { restaurants } from "../drizzle/schema";
import { getDb } from "./db";
import { appRouter } from "./routers";

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const restaurantIds: number[] = [];
const ownerId = 810_000 + Math.floor(Math.random() * 10_000);

const ownerCaller = appRouter.createCaller({
  adminAccount: null,
  user: null,
  restaurantOwner: { id: ownerId, email: `homepage-owner-${runId}@example.test` },
  req: { session: {} },
  res: {},
} as any);

const publicCaller = appRouter.createCaller({ adminAccount: null, user: null, restaurantOwner: null, req: { session: {} }, res: {} } as any);

async function createRestaurant(tier: "menu" | "premium") {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const slug = `homepage-editorial-${tier}-${runId}-${restaurantIds.length}`;
  const [created] = await db.insert(restaurants).values({
    name: `Vitrine éditoriale ${tier}`,
    slug,
    ownerId,
    subscriptionTier: tier,
    subscriptionStatus: "trial",
    isActive: true,
  });
  const id = Number(created.insertId);
  restaurantIds.push(id);
  return { id, slug };
}

afterAll(async () => {
  if (!restaurantIds.length) return;
  const db = await getDb();
  if (db) await db.delete(restaurants).where(inArray(restaurants.id, restaurantIds));
});

describe("Premium homepage editorial content", () => {
  it("persists bounded Premium editorial content and exposes it to the active public vitrine", async () => {
    const restaurant = await createRestaurant("premium");
    await ownerCaller.restaurant.updateHomepageContent({
      restaurantId: restaurant.id,
      heroHeading: "Une signature locale",
      heroTagline: "Une expérience éditoriale claire.",
      aboutTitle: "Notre approche",
      aboutContent: "Un texte de présentation public, maîtrisé depuis le dashboard.",
    });

    await expect(publicCaller.public.getRestaurant({ slug: restaurant.slug })).resolves.toMatchObject({
      heroHeading: "Une signature locale",
      heroTagline: "Une expérience éditoriale claire.",
      aboutTitle: "Notre approche",
      aboutContent: "Un texte de présentation public, maîtrisé depuis le dashboard.",
    });
  });

  it("refuses homepage editorial changes from an owner whose establishment is below Premium", async () => {
    const restaurant = await createRestaurant("menu");
    await expect(ownerCaller.restaurant.updateHomepageContent({ restaurantId: restaurant.id, heroHeading: "Non autorisé" })).rejects.toThrow();
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const [stored] = await db.select({ heroHeading: restaurants.heroHeading }).from(restaurants).where(eq(restaurants.id, restaurant.id));
    expect(stored.heroHeading).toBeNull();
  });
});
