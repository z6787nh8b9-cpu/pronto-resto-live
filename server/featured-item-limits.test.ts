import { afterAll, describe, expect, it } from "vitest";
import { inArray } from "drizzle-orm";
import { menuCategories, menuItems, restaurantOwners, restaurants } from "../drizzle/schema";
import { getDb } from "./db";
import { appRouter } from "./routers";

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const restaurantIds: number[] = [];
const ownerIds: number[] = [];
const adminCaller = appRouter.createCaller({
  adminAccount: { id: 1, email: "featured-limits@pronto.test" }, restaurantOwner: null, user: null, req: { session: {} }, res: {},
} as any);

async function createFixture(tier: "menu" | "pro" | "premium", itemCount: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [ownerResult] = await db.insert(restaurantOwners).values({
    email: `featured-${tier}-${runId}@example.test`, name: `Favoris ${tier}`, provider: "email", passwordHash: "test-only-hash",
  });
  const ownerId = Number(ownerResult.insertId);
  ownerIds.push(ownerId);
  const restaurant = await adminCaller.admin.createRestaurant({
    ownerId, name: `Favoris ${tier}`, slug: `featured-${tier}-${runId}`, subscriptionTier: tier, subscriptionStatus: "trial",
  });
  restaurantIds.push(restaurant.id);
  const [categoryResult] = await db.insert(menuCategories).values({ restaurantId: restaurant.id, name: "Spécialités", displayOrder: 0 });
  const categoryId = Number(categoryResult.insertId);
  const itemIds: number[] = [];
  for (let index = 0; index < itemCount; index += 1) {
    const [itemResult] = await db.insert(menuItems).values({ restaurantId: restaurant.id, categoryId, name: `Plat ${index + 1}`, price: "12.00", displayOrder: index });
    itemIds.push(Number(itemResult.insertId));
  }
  const ownerCaller = appRouter.createCaller({
    adminAccount: null, restaurantOwner: { id: ownerId, email: `featured-${tier}-${runId}@example.test` }, user: null, req: { session: {} }, res: {},
  } as any);
  return { ownerCaller, itemIds };
}

afterAll(async () => {
  const db = await getDb();
  if (!db) return;
  if (restaurantIds.length) {
    await db.delete(menuItems).where(inArray(menuItems.restaurantId, restaurantIds));
    await db.delete(menuCategories).where(inArray(menuCategories.restaurantId, restaurantIds));
    await db.delete(restaurants).where(inArray(restaurants.id, restaurantIds));
  }
  if (ownerIds.length) await db.delete(restaurantOwners).where(inArray(restaurantOwners.id, ownerIds));
});

describe("featured item subscription limits", () => {
  it.each([
    ["menu", 1],
    ["pro", 3],
    ["premium", 5],
  ] as const)("allows %s establishments to feature exactly %i items", async (tier, limit) => {
    const { ownerCaller, itemIds } = await createFixture(tier, limit + 1);
    for (const itemId of itemIds.slice(0, limit)) {
      await expect(ownerCaller.restaurant.updateMenuItem({ id: itemId, data: { isFeatured: true } })).resolves.toBeTruthy();
    }
    await expect(ownerCaller.restaurant.updateMenuItem({ id: itemIds[limit], data: { isFeatured: true } })).rejects.toThrow(`jusqu’à ${limit}`);
    await expect(ownerCaller.restaurant.updateMenuItem({ id: itemIds[0], data: { isFeatured: false } })).resolves.toBeTruthy();
    await expect(ownerCaller.restaurant.updateMenuItem({ id: itemIds[limit], data: { isFeatured: true } })).resolves.toBeTruthy();
  });
});
