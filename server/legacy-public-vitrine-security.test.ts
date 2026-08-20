import { afterAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { restaurants } from "../drizzle/schema";
import { getDb } from "./db";
import { appRouter } from "./routers";

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const restaurantIds: number[] = [];
const adminCaller = appRouter.createCaller({
  adminAccount: { id: 1, email: "legacy-vitrine-security@pronto.test" }, restaurantOwner: null, user: null, req: { session: {} }, res: {},
} as any);
const publicCaller = appRouter.createCaller({ adminAccount: null, restaurantOwner: null, user: null, req: { session: {} }, res: {} } as any);

afterAll(async () => {
  if (!restaurantIds.length) return;
  const db = await getDb();
  if (db) await db.delete(restaurants).where(inArray(restaurants.id, restaurantIds));
});

describe("legacy public vitrine security", () => {
  it("returns only a public projection for an active restaurant", async () => {
    const restaurant = await adminCaller.admin.createRestaurant({
      name: "Vitrine publique test",
      slug: `legacy-public-${runId}`,
      email: "contact@example.test",
      subscriptionTier: "menu",
      subscriptionStatus: "trial",
    });
    restaurantIds.push(restaurant.id);

    const result = await publicCaller.public.getRestaurant({ slug: restaurant.slug });
    expect(result).toMatchObject({ id: restaurant.id, slug: restaurant.slug, name: "Vitrine publique test" });
    expect(result).not.toHaveProperty("ownerId");
    expect(result).not.toHaveProperty("isActive");
    expect(result).not.toHaveProperty("subscriptionStatus");
    expect(result).not.toHaveProperty("subscriptionExpiresAt");
    const publicChatbotConfig = await publicCaller.restaurant.getPublicChatbotConfig({ restaurantId: restaurant.id });
    expect(publicChatbotConfig).toMatchObject({ isEnabled: true, tone: "warm" });
    expect(publicChatbotConfig).not.toHaveProperty("customInfo");
    expect(publicChatbotConfig).not.toHaveProperty("totalConversations");
    await expect(publicCaller.restaurant.getChatbotConfig({ restaurantId: restaurant.id })).rejects.toThrow();
    await expect(publicCaller.public.getRestaurant({ slug: "x" })).rejects.toThrow();
  });

  it("hides vitrine and catalogue when the restaurant is inactive", async () => {
    const restaurant = await adminCaller.admin.createRestaurant({
      name: "Vitrine inactive test",
      slug: `legacy-inactive-${runId}`,
      subscriptionTier: "menu",
      subscriptionStatus: "trial",
    });
    restaurantIds.push(restaurant.id);
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db.update(restaurants).set({ isActive: false }).where(eq(restaurants.id, restaurant.id));

    await expect(publicCaller.public.getRestaurant({ slug: restaurant.slug })).resolves.toBeUndefined();
    await expect(publicCaller.public.getMenu({ restaurantId: restaurant.id })).resolves.toEqual({ categories: [], items: [] });
    await expect(publicCaller.restaurant.getPublicChatbotConfig({ restaurantId: restaurant.id })).resolves.toBeNull();
    await expect(publicCaller.public.chat({ restaurantId: restaurant.id, sessionId: "session-security", message: "Bonjour" })).rejects.toThrow();
    await expect(publicCaller.public.getMenu({ restaurantId: 0 })).rejects.toThrow();
  });

  it("exposes only the chatbot availability flag and hides chat after an owner disables it", async () => {
    const restaurant = await adminCaller.admin.createRestaurant({
      name: "Chatbot désactivé test",
      slug: `legacy-chat-disabled-${runId}`,
      subscriptionTier: "menu",
      subscriptionStatus: "trial",
    });
    restaurantIds.push(restaurant.id);
    await adminCaller.restaurant.updateChatbotConfig({ restaurantId: restaurant.id, isEnabled: false });

    await expect(publicCaller.public.getRestaurant({ slug: restaurant.slug })).resolves.toMatchObject({ chatbotEnabled: false });
    await expect(publicCaller.public.chat({ restaurantId: restaurant.id, sessionId: "session-chat-disabled", message: "Bonjour" })).rejects.toThrow();

    const home = readFileSync(resolve(process.cwd(), "client/src/pages/RestaurantHomePage.tsx"), "utf8");
    const menu = readFileSync(resolve(process.cwd(), "client/src/pages/RestaurantMenuPage.tsx"), "utf8");
    expect(home).toContain("restaurant.chatbotEnabled && <button");
    expect(menu).toContain("restaurant.chatbotEnabled && <Button");
  });
});
