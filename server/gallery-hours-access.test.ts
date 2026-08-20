import { afterAll, describe, expect, it } from "vitest";
import { inArray } from "drizzle-orm";
import { galleryPhotos, openingHours, restaurantOwners, restaurants } from "../drizzle/schema";
import { getDb } from "./db";
import { appRouter } from "./routers";

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const restaurantIds: number[] = [];
const ownerIds: number[] = [];
const adminCaller = appRouter.createCaller({
  adminAccount: { id: 1, email: "gallery-hours-security@pronto.test" }, restaurantOwner: null, user: null, req: { session: {} }, res: {},
} as any);

async function createOwner(label: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [result] = await db.insert(restaurantOwners).values({
    email: `gallery-hours-${label}-${runId}@example.test`, name: `Galerie horaires ${label}`, provider: "email", passwordHash: "test-only-hash",
  });
  const id = Number(result.insertId);
  ownerIds.push(id);
  return id;
}

async function createRestaurant(ownerId: number, label: string) {
  const restaurant = await adminCaller.admin.createRestaurant({
    ownerId, name: `Galerie horaires ${label}`, slug: `gallery-hours-${label}-${runId}`, subscriptionTier: "premium", subscriptionStatus: "trial",
  });
  restaurantIds.push(restaurant.id);
  return restaurant;
}

afterAll(async () => {
  const db = await getDb();
  if (!db) return;
  if (restaurantIds.length) {
    await db.delete(galleryPhotos).where(inArray(galleryPhotos.restaurantId, restaurantIds));
    await db.delete(openingHours).where(inArray(openingHours.restaurantId, restaurantIds));
    await db.delete(restaurants).where(inArray(restaurants.id, restaurantIds));
  }
  if (ownerIds.length) await db.delete(restaurantOwners).where(inArray(restaurantOwners.id, ownerIds));
});

describe("gallery and opening-hours access", () => {
  it("rejects cross-establishment gallery and opening-hours mutations", async () => {
    const ownerA = await createOwner("a");
    const ownerB = await createOwner("b");
    const restaurantA = await createRestaurant(ownerA, "a");
    const restaurantB = await createRestaurant(ownerB, "b");
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const [photoResult] = await db.insert(galleryPhotos).values({ restaurantId: restaurantB.id, imageUrl: "https://example.test/photo.jpg", displayOrder: 0, isActive: true });
    const photoId = Number(photoResult.insertId);
    const ownerACaller = appRouter.createCaller({
      adminAccount: null, restaurantOwner: { id: ownerA, email: `gallery-hours-a-${runId}@example.test` }, user: null, req: { session: {} }, res: {},
    } as any);

    await expect(ownerACaller.gallery.addPhoto({ restaurantId: restaurantB.id, imageUrl: "https://example.test/intrusion.jpg" })).rejects.toThrow();
    await expect(ownerACaller.gallery.updatePhoto({ id: photoId, caption: "Intrusion" })).rejects.toThrow();
    await expect(ownerACaller.gallery.deletePhoto({ id: photoId })).rejects.toThrow();
    await expect(ownerACaller.openingHours.setOpeningHours({ restaurantId: restaurantB.id, dayOfWeek: 1, openTime: "09:00", closeTime: "18:00", isClosed: false })).rejects.toThrow();
    await expect(ownerACaller.openingHours.batchSetOpeningHours({ restaurantId: restaurantB.id, hours: [{ dayOfWeek: 1, openTime: "09:00", closeTime: "18:00", isClosed: false }] })).rejects.toThrow();
    await expect(ownerACaller.gallery.addPhoto({ restaurantId: restaurantA.id, imageUrl: "https://example.test/own.jpg", caption: "x".repeat(501) })).rejects.toThrow();
    await expect(ownerACaller.openingHours.setOpeningHours({ restaurantId: restaurantA.id, dayOfWeek: 1, openTime: "25:00", closeTime: "18:00", isClosed: false })).rejects.toThrow();
  });
});
