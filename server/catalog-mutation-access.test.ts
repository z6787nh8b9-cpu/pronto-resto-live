import { afterAll, describe, expect, it } from "vitest";
import { inArray } from "drizzle-orm";
import { menuCategories, menuItems, restaurantOwners, restaurants } from "../drizzle/schema";
import { getDb } from "./db";
import { appRouter } from "./routers";

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const restaurantIds: number[] = [];
const ownerIds: number[] = [];
const adminCaller = appRouter.createCaller({
  adminAccount: { id: 1, email: "catalog-mutation-security@pronto.test" }, restaurantOwner: null, user: null, req: { session: {} }, res: {},
} as any);

async function createOwner(label: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [created] = await db.insert(restaurantOwners).values({
    email: `catalog-mutation-${label}-${runId}@example.test`,
    name: `Catalogue mutation ${label}`,
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
    name: `Mutation ${label}`,
    slug: `catalog-mutation-${label}-${runId}`,
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

describe("catalog mutation access", () => {
  it("prevents an owner from mutating or reading another establishment through every legacy entry point", async () => {
    const ownerA = await createOwner("a");
    const ownerB = await createOwner("b");
    const restaurantA = await createRestaurant(ownerA, "a");
    const restaurantB = await createRestaurant(ownerB, "b");
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const [categoryBResult] = await db.insert(menuCategories).values({ restaurantId: restaurantB.id, name: "Privé B", displayOrder: 0 });
    const categoryBId = Number(categoryBResult.insertId);
    const [itemBResult] = await db.insert(menuItems).values({ restaurantId: restaurantB.id, categoryId: categoryBId, name: "Produit B", price: "12.00", displayOrder: 0 });
    const itemBId = Number(itemBResult.insertId);
    const ownerACaller = appRouter.createCaller({
      adminAccount: null, restaurantOwner: { id: ownerA, email: `catalog-mutation-a-${runId}@example.test` }, user: null, req: { session: {} }, res: {},
    } as any);

    await expect(ownerACaller.restaurant.createCategory({ restaurantId: restaurantB.id, name: "Intrusion" })).rejects.toThrow();
    await expect(ownerACaller.restaurant.updateCategory({ id: categoryBId, data: { name: "Intrusion" } })).rejects.toThrow();
    await expect(ownerACaller.restaurant.deleteCategory({ id: categoryBId })).rejects.toThrow();
    await expect(ownerACaller.restaurant.createMenuItem({ restaurantId: restaurantA.id, categoryId: categoryBId, name: "Produit intrusion", price: "10.00" })).rejects.toThrow();
    await expect(ownerACaller.restaurant.updateMenuItem({ id: itemBId, data: { name: "Intrusion" } })).rejects.toThrow();
    await expect(ownerACaller.restaurant.deleteMenuItem({ id: itemBId })).rejects.toThrow();
    await expect(ownerACaller.restaurant.updateChatbotConfig({ restaurantId: restaurantB.id, isEnabled: false })).rejects.toThrow();
    await expect(ownerACaller.restaurant.getPageViews({ restaurantId: restaurantB.id })).rejects.toThrow();
    await expect(ownerACaller.restaurant.getChatbotConversations({ restaurantId: restaurantB.id })).rejects.toThrow();
    await expect(ownerACaller.restaurant.reorderCategories({ restaurantId: restaurantB.id, categoryIds: [categoryBId] })).rejects.toThrow();
    await expect(ownerACaller.restaurant.reorderItems({ categoryId: categoryBId, itemIds: [itemBId] })).rejects.toThrow();
    await expect(ownerACaller.restaurant.updateCustomization({ restaurantId: restaurantB.id, primaryColor: "#112233" })).rejects.toThrow();
    await expect(ownerACaller.restaurant.getById({ id: restaurantB.id })).rejects.toThrow();
    await expect(ownerACaller.restaurant.getById({ id: restaurantA.id })).resolves.toMatchObject({ id: restaurantA.id });
  });
});
