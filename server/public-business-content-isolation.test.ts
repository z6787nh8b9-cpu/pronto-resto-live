import { afterAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { galleryPhotos, openingHours, restaurants, translations } from "../drizzle/schema";
import { getDb } from "./db";
import { appRouter } from "./routers";

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const restaurantIds: number[] = [];
const adminCaller = appRouter.createCaller({
  adminAccount: { id: 1, email: "public-content-security@pronto.test" }, restaurantOwner: null, user: null, req: { session: {} }, res: {},
} as any);
const publicCaller = appRouter.createCaller({ adminAccount: null, restaurantOwner: null, user: null, req: { session: {} }, res: {} } as any);

async function createRestaurant(label: string) {
  const restaurant = await adminCaller.admin.createRestaurant({
    name: `Public content ${label}`,
    slug: `public-content-${label}-${runId}`,
    subscriptionTier: "menu",
    subscriptionStatus: "trial",
  });
  restaurantIds.push(restaurant.id);
  return restaurant;
}

afterAll(async () => {
  if (!restaurantIds.length) return;
  const db = await getDb();
  if (!db) return;
  await db.delete(galleryPhotos).where(inArray(galleryPhotos.restaurantId, restaurantIds));
  await db.delete(openingHours).where(inArray(openingHours.restaurantId, restaurantIds));
  await db.delete(translations).where(inArray(translations.restaurantId, restaurantIds));
  await db.delete(restaurants).where(inArray(restaurants.id, restaurantIds));
});

describe("public business content isolation", () => {
  it("returns active gallery media and hours only for an active restaurant", async () => {
    const restaurant = await createRestaurant("active");
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db.insert(galleryPhotos).values([
      { restaurantId: restaurant.id, imageUrl: "https://example.test/public.jpg", caption: "Visible", displayOrder: 1, isActive: true },
      { restaurantId: restaurant.id, imageUrl: "https://example.test/hidden.jpg", caption: "Hidden", displayOrder: 2, isActive: false },
    ]);
    await db.insert(openingHours).values({ restaurantId: restaurant.id, dayOfWeek: 1, openTime: "09:00", closeTime: "18:00", isClosed: false });

    await expect(publicCaller.gallery.getGalleryPhotos({ restaurantId: restaurant.id })).resolves.toHaveLength(1);
    await expect(publicCaller.openingHours.getOpeningHours({ restaurantId: restaurant.id })).resolves.toHaveLength(1);
    await expect(publicCaller.gallery.getGalleryPhotos({ restaurantId: 0 })).rejects.toThrow();
    await expect(publicCaller.openingHours.getOpeningHours({ restaurantId: 0 })).rejects.toThrow();
  });

  it("returns no gallery media or hours after the restaurant is disabled", async () => {
    const restaurant = await createRestaurant("inactive");
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db.insert(galleryPhotos).values({ restaurantId: restaurant.id, imageUrl: "https://example.test/disabled.jpg" });
    await db.insert(openingHours).values({ restaurantId: restaurant.id, dayOfWeek: 2, openTime: "10:00", closeTime: "19:00", isClosed: false });
    await db.update(restaurants).set({ isActive: false }).where(eq(restaurants.id, restaurant.id));

    await expect(publicCaller.gallery.getGalleryPhotos({ restaurantId: restaurant.id })).resolves.toEqual([]);
    await expect(publicCaller.openingHours.getOpeningHours({ restaurantId: restaurant.id })).resolves.toEqual([]);
  });

  it("returns translations only while the restaurant remains active", async () => {
    const restaurant = await createRestaurant("translations");
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db.insert(translations).values({
      restaurantId: restaurant.id,
      entityType: "restaurant",
      entityId: restaurant.id,
      field: "name",
      language: "en",
      originalText: "Contenu original",
      translatedText: "Translated content",
      isAutoTranslated: true,
    });

    await expect(publicCaller.translations.getTranslations({ restaurantId: restaurant.id, language: "en" })).resolves.toHaveLength(1);
    await db.update(restaurants).set({ isActive: false }).where(eq(restaurants.id, restaurant.id));
    await expect(publicCaller.translations.getTranslations({ restaurantId: restaurant.id, language: "en" })).resolves.toEqual([]);
    await expect(publicCaller.translations.getTranslations({ restaurantId: 0, language: "en" })).rejects.toThrow();
  });
});
