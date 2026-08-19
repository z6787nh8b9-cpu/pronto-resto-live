import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { menuCategories, menuItems, restaurants } from "../drizzle/schema";

const adminCaller = appRouter.createCaller({
  adminAccount: { id: 1, email: "test-admin@pronto.local" },
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

describe("Restaurant analytics isolation", () => {
  it("allows a Super Admin to read a restaurant's analytics", async () => {
    const db = await getDb();
    const [restaurant] = await db!
      .select()
      .from(restaurants)
      .where(eq(restaurants.slug, "la-voile-rouge"))
      .limit(1);

    expect(restaurant).toBeDefined();
    const ownerCaller = appRouter.createCaller({
      adminAccount: null,
      user: null,
      restaurantOwner: { id: restaurant.ownerId, email: "owner@pronto.local" },
      req: { session: {} },
      res: {},
    } as any);
    const ownedRestaurants = await ownerCaller.restaurant.getMyRestaurants();
    expect(ownedRestaurants.some((ownedRestaurant) => ownedRestaurant.id === restaurant.id)).toBe(true);
    const unrelatedRestaurants = await unrelatedOwnerCaller.restaurant.getMyRestaurants();
    expect(unrelatedRestaurants.some((unrelatedRestaurant) => unrelatedRestaurant.id === restaurant.id)).toBe(false);

    const access = await adminCaller.restaurant.checkDashboardAccess({ restaurantId: restaurant.id });
    expect(access).toMatchObject({ authorized: true, isAdmin: true });
    const summary = await adminCaller.restaurant.getAnalyticsSummary({ restaurantId: restaurant.id });
    expect(summary).toMatchObject({
      pageViewsThisMonth: expect.any(Number),
      conversationsThisMonth: expect.any(Number),
      totalConversations: expect.any(Number),
    });
  });

  it("rejects analytics reads and chatbot changes from an unrelated owner", async () => {
    const db = await getDb();
    const [restaurant] = await db!
      .select()
      .from(restaurants)
      .where(eq(restaurants.slug, "la-voile-rouge"))
      .limit(1);

    await expect(unrelatedOwnerCaller.restaurant.getPageViews({ restaurantId: restaurant.id, limit: 1 })).rejects.toBeInstanceOf(TRPCError);
    await expect(unrelatedOwnerCaller.restaurant.getChatbotConversations({ restaurantId: restaurant.id, limit: 1 })).rejects.toBeInstanceOf(TRPCError);
    await expect(unrelatedOwnerCaller.restaurant.getAnalyticsSummary({ restaurantId: restaurant.id })).rejects.toBeInstanceOf(TRPCError);
    await expect(unrelatedOwnerCaller.restaurant.updateSettings({ restaurantId: restaurant.id, data: {} })).rejects.toBeInstanceOf(TRPCError);
    await expect(unrelatedOwnerCaller.restaurant.updateChatbotConfig({ restaurantId: restaurant.id, isEnabled: false })).rejects.toBeInstanceOf(TRPCError);
  });

  it("rejects legacy category and item mutations from an unrelated owner", async () => {
    const db = await getDb();
    const [restaurant] = await db!
      .select()
      .from(restaurants)
      .where(eq(restaurants.slug, "la-voile-rouge"))
      .limit(1);
    const [category] = await db!
      .select()
      .from(menuCategories)
      .where(eq(menuCategories.restaurantId, restaurant.id))
      .limit(1);
    const [item] = await db!
      .select()
      .from(menuItems)
      .where(eq(menuItems.restaurantId, restaurant.id))
      .limit(1);

    expect(category).toBeDefined();
    expect(item).toBeDefined();

    await expect(unrelatedOwnerCaller.restaurant.createCategory({ restaurantId: restaurant.id, name: "Refus" })).rejects.toBeInstanceOf(TRPCError);
    await expect(unrelatedOwnerCaller.restaurant.updateCategory({ id: category.id, data: { name: "Refus" } })).rejects.toBeInstanceOf(TRPCError);
    await expect(unrelatedOwnerCaller.restaurant.deleteCategory({ id: category.id })).rejects.toBeInstanceOf(TRPCError);
    await expect(unrelatedOwnerCaller.restaurant.createMenuItem({ restaurantId: restaurant.id, categoryId: category.id, name: "Refus", price: "1.00" })).rejects.toBeInstanceOf(TRPCError);
    await expect(unrelatedOwnerCaller.restaurant.updateMenuItem({ id: item.id, data: { name: "Refus" } })).rejects.toBeInstanceOf(TRPCError);
    await expect(unrelatedOwnerCaller.restaurant.deleteMenuItem({ id: item.id })).rejects.toBeInstanceOf(TRPCError);
    await expect(unrelatedOwnerCaller.restaurant.reorderCategories({ restaurantId: restaurant.id, categoryIds: [category.id] })).rejects.toBeInstanceOf(TRPCError);
    await expect(unrelatedOwnerCaller.restaurant.reorderItems({ categoryId: category.id, itemIds: [item.id] })).rejects.toBeInstanceOf(TRPCError);
  });
});
