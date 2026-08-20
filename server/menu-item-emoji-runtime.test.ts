import { afterAll, describe, expect, it } from "vitest";
import { inArray } from "drizzle-orm";
import { menuCategories, menuItems, restaurantOwners, restaurants } from "../drizzle/schema";
import { getDb } from "./db";
import { appRouter } from "./routers";

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const restaurantIds: number[] = [];
const ownerIds: number[] = [];

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

describe("persistance runtime de l’emoji de plat", () => {
  it("conserve l’emoji lors de la création et de l’édition, puis l’expose à la vitrine publique", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const [ownerResult] = await db.insert(restaurantOwners).values({
      email: `emoji-owner-${runId}@example.test`, name: "Emoji owner", provider: "email", passwordHash: "test-only-hash",
    });
    const ownerId = Number(ownerResult.insertId);
    ownerIds.push(ownerId);
    const adminCaller = appRouter.createCaller({ adminAccount: { id: 1, email: "emoji-admin@pronto.test" }, restaurantOwner: null, user: null, req: { session: {} }, res: {} } as any);
    const restaurant = await adminCaller.admin.createRestaurant({
      ownerId, name: "Emoji vitrine", slug: `emoji-vitrine-${runId}`, subscriptionTier: "menu", subscriptionStatus: "trial",
    });
    restaurantIds.push(restaurant.id);
    const [categoryResult] = await db.insert(menuCategories).values({ restaurantId: restaurant.id, name: "Plats", displayOrder: 0 });
    const categoryId = Number(categoryResult.insertId);
    const ownerCaller = appRouter.createCaller({ adminAccount: null, restaurantOwner: { id: ownerId, email: `emoji-owner-${runId}@example.test` }, user: null, req: { session: {} }, res: {} } as any);

    const created = await ownerCaller.restaurant.createMenuItem({ restaurantId: restaurant.id, categoryId, name: "Sushi", price: "12.00", emoji: "🍣" });
    expect(created.emoji).toBe("🍣");
    await ownerCaller.restaurant.updateMenuItem({ id: created.id, data: { emoji: "🥗" } });
    const dashboardItems = await ownerCaller.restaurant.getMenuItems({ restaurantId: restaurant.id });
    expect(dashboardItems.find((item) => item.id === created.id)?.emoji).toBe("🥗");

    const publicCaller = appRouter.createCaller({ adminAccount: null, restaurantOwner: null, user: null, req: { session: {} }, res: {} } as any);
    const publicMenu = await publicCaller.public.getMenu({ restaurantId: restaurant.id });
    expect(publicMenu?.items.find((item) => item.id === created.id)?.emoji).toBe("🥗");
  });
});
