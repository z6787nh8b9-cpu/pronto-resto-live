import { afterAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { menuCategories, menuItems, restaurantOwners, restaurants } from "../drizzle/schema";
import { getDb } from "./db";
import { appRouter } from "./routers";

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const restaurantIds: number[] = [];
const ownerIds: number[] = [];
const adminCaller = appRouter.createCaller({
  adminAccount: { id: 1, email: "catalog-security@pronto.test" }, restaurantOwner: null, user: null, req: { session: {} }, res: {},
} as any);
const anonymousCaller = appRouter.createCaller({ adminAccount: null, restaurantOwner: null, user: null, req: { session: {} }, res: {} } as any);

async function createOwner(label: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [created] = await db.insert(restaurantOwners).values({
    email: `catalog-owner-${label}-${runId}@example.test`,
    name: `Catalogue ${label}`,
    provider: "email",
    passwordHash: "test-only-hash",
  });
  const id = Number(created.insertId);
  ownerIds.push(id);
  return id;
}

async function createRestaurant(ownerId: number, label: string) {
  const restaurant = await adminCaller.admin.createRestaurant({
    ownerId,
    name: `Catalogue ${label}`,
    slug: `catalog-${label}-${runId}`,
    subscriptionTier: "menu",
    subscriptionStatus: "trial",
  });
  restaurantIds.push(restaurant.id);
  return restaurant;
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

describe("catalog read access", () => {
  it("requires an authorized dashboard principal and prevents cross-restaurant reads", async () => {
    const ownerA = await createOwner("a");
    const ownerB = await createOwner("b");
    const restaurantA = await createRestaurant(ownerA, "a");
    const restaurantB = await createRestaurant(ownerB, "b");
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const [categoryCreated] = await db.insert(menuCategories).values({ restaurantId: restaurantB.id, name: "Privé", displayOrder: 0 });
    const categoryBId = Number(categoryCreated.insertId);
    const ownerACaller = appRouter.createCaller({
      adminAccount: null, restaurantOwner: { id: ownerA, email: `catalog-owner-a-${runId}@example.test` }, user: null, req: { session: {} }, res: {},
    } as any);

    await expect(anonymousCaller.restaurant.getCategories({ restaurantId: restaurantA.id })).rejects.toThrow();
    await expect(anonymousCaller.restaurant.getMenuItems({ restaurantId: restaurantA.id })).rejects.toThrow();
    await expect(anonymousCaller.restaurant.getItemsByCategory({ categoryId: categoryBId })).rejects.toThrow();
    await expect(ownerACaller.restaurant.getCategories({ restaurantId: restaurantA.id })).resolves.toEqual([]);
    await expect(ownerACaller.restaurant.getMenuItems({ restaurantId: restaurantA.id })).resolves.toEqual([]);
    await expect(ownerACaller.restaurant.getCategories({ restaurantId: restaurantB.id })).rejects.toThrow();
    await expect(ownerACaller.restaurant.getItemsByCategory({ categoryId: categoryBId })).rejects.toThrow();
    await expect(adminCaller.restaurant.getCategories({ restaurantId: restaurantB.id })).resolves.toHaveLength(1);
    await expect(adminCaller.restaurant.getCategories({ restaurantId: 0 })).rejects.toThrow();
  });
});
