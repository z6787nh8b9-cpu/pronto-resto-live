import { afterAll, describe, expect, it } from "vitest";
import { inArray } from "drizzle-orm";
import { restaurantOwners, restaurants } from "../drizzle/schema";
import { getDb } from "./db";
import { appRouter } from "./routers";

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const restaurantIds: number[] = [];
const ownerIds: number[] = [];

const adminCaller = appRouter.createCaller({
  adminAccount: { id: 1, email: "subscription-flow-admin@pronto.test" },
  restaurantOwner: null,
  user: null,
  req: { session: {} },
  res: {},
} as any);

async function createOwnedRestaurant(tier: "menu" | "pro" | "premium") {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const email = `subscription-flow-${tier}-${runId}@example.test`;
  const [ownerResult] = await db.insert(restaurantOwners).values({
    email,
    name: `Propriétaire formule ${tier}`,
    provider: "email",
    passwordHash: "test-only-hash",
  });
  const ownerId = Number(ownerResult.insertId);
  ownerIds.push(ownerId);
  const restaurant = await adminCaller.admin.createRestaurant({
    ownerId,
    name: `Établissement formule ${tier}`,
    slug: `subscription-flow-${tier}-${runId}`,
    subscriptionTier: tier,
    subscriptionStatus: "trial",
  });
  restaurantIds.push(restaurant.id);
  const ownerCaller = appRouter.createCaller({
    adminAccount: null,
    restaurantOwner: { id: ownerId, email },
    user: null,
    req: { session: {} },
    res: {},
  } as any);
  return { restaurant, ownerCaller };
}

afterAll(async () => {
  const db = await getDb();
  if (!db) return;
  if (restaurantIds.length) await db.delete(restaurants).where(inArray(restaurants.id, restaurantIds));
  if (ownerIds.length) await db.delete(restaurantOwners).where(inArray(restaurantOwners.id, ownerIds));
});

describe("parcours de droits par formule", () => {
  it("accorde les traductions dès Pro et réserve réservations et événements à Premium", async () => {
    const menu = await createOwnedRestaurant("menu");
    const pro = await createOwnedRestaurant("pro");
    const premium = await createOwnedRestaurant("premium");

    await expect(menu.ownerCaller.translations.getTranslationsForManagement({ restaurantId: menu.restaurant.id })).rejects.toThrow();
    await expect(menu.ownerCaller.events.getEvents({ restaurantId: menu.restaurant.id })).rejects.toThrow();
    await expect(menu.ownerCaller.reservations.getSettings({ restaurantId: menu.restaurant.id })).rejects.toThrow();

    await expect(pro.ownerCaller.translations.getTranslationsForManagement({ restaurantId: pro.restaurant.id })).resolves.toEqual([]);
    await expect(pro.ownerCaller.events.getEvents({ restaurantId: pro.restaurant.id })).rejects.toThrow();
    await expect(pro.ownerCaller.reservations.getSettings({ restaurantId: pro.restaurant.id })).rejects.toThrow();

    await expect(premium.ownerCaller.translations.getTranslationsForManagement({ restaurantId: premium.restaurant.id })).resolves.toEqual([]);
    await expect(premium.ownerCaller.events.getEvents({ restaurantId: premium.restaurant.id })).resolves.toEqual([]);
    await expect(premium.ownerCaller.reservations.getSettings({ restaurantId: premium.restaurant.id })).resolves.toBeNull();

    await expect(adminCaller.events.getEvents({ restaurantId: menu.restaurant.id })).resolves.toEqual([]);
    await expect(adminCaller.reservations.getSettings({ restaurantId: menu.restaurant.id })).resolves.toBeNull();
  });
});
