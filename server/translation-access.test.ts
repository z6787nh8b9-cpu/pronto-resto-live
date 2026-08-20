import { afterAll, describe, expect, it } from "vitest";
import { inArray } from "drizzle-orm";
import { restaurantOwners, restaurants, translations } from "../drizzle/schema";
import { getDb } from "./db";
import { appRouter } from "./routers";

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const restaurantIds: number[] = [];
const ownerIds: number[] = [];
const adminCaller = appRouter.createCaller({
  adminAccount: { id: 1, email: "translation-security@pronto.test" }, restaurantOwner: null, user: null, req: { session: {} }, res: {},
} as any);

async function createOwner(label: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [result] = await db.insert(restaurantOwners).values({
    email: `translation-${label}-${runId}@example.test`, name: `Traduction ${label}`, provider: "email", passwordHash: "test-only-hash",
  });
  const id = Number(result.insertId);
  ownerIds.push(id);
  return id;
}

async function createRestaurant(ownerId: number, label: string) {
  const restaurant = await adminCaller.admin.createRestaurant({
    ownerId, name: `Traduction accès ${label}`, slug: `translation-access-${label}-${runId}`, subscriptionTier: "premium", subscriptionStatus: "trial",
  });
  restaurantIds.push(restaurant.id);
  return restaurant;
}

afterAll(async () => {
  const db = await getDb();
  if (!db) return;
  if (restaurantIds.length) {
    await db.delete(translations).where(inArray(translations.restaurantId, restaurantIds));
    await db.delete(restaurants).where(inArray(restaurants.id, restaurantIds));
  }
  if (ownerIds.length) await db.delete(restaurantOwners).where(inArray(restaurantOwners.id, ownerIds));
});

describe("translation access", () => {
  it("does not reveal or mutate another establishment’s translations", async () => {
    const ownerA = await createOwner("a");
    const ownerB = await createOwner("b");
    const restaurantA = await createRestaurant(ownerA, "a");
    const restaurantB = await createRestaurant(ownerB, "b");
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const [translationResult] = await db.insert(translations).values({
      restaurantId: restaurantB.id, entityType: "restaurant", entityId: restaurantB.id, field: "name", language: "en",
      originalText: "Traduction privée", translatedText: "Private translation", isAutoTranslated: true,
    });
    const translationId = Number(translationResult.insertId);
    const ownerACaller = appRouter.createCaller({
      adminAccount: null, restaurantOwner: { id: ownerA, email: `translation-a-${runId}@example.test` }, user: null, req: { session: {} }, res: {},
    } as any);

    await expect(ownerACaller.translations.translateAll({ restaurantId: restaurantB.id, targetLanguage: "en" })).rejects.toThrow();
    await expect(ownerACaller.translations.autoTranslatePublic({ restaurantId: restaurantB.id, targetLanguage: "en" })).rejects.toThrow();
    await expect(ownerACaller.translations.updateTranslation({ translationId, translatedText: "Intrusion" })).rejects.toThrow();
    await expect(ownerACaller.translations.getTranslationsForManagement({ restaurantId: restaurantB.id })).rejects.toThrow();
    await expect(ownerACaller.translations.getTranslationsForManagement({ restaurantId: restaurantA.id })).resolves.toEqual([]);
    await expect(ownerACaller.translations.updateTranslation({ translationId: 1, translatedText: "x".repeat(5_001) })).rejects.toThrow();
  });
});
