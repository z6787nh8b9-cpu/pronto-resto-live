import { afterAll, describe, expect, it, vi } from "vitest";
import { inArray } from "drizzle-orm";

const { invokeLLM } = vi.hoisted(() => ({
  invokeLLM: vi.fn(),
}));

vi.mock("./_core/llm", () => ({ invokeLLM }));

invokeLLM.mockResolvedValue({
  choices: [{ message: { content: "Translated storefront name" } }],
});

import { restaurantOwners, restaurants, translations } from "../drizzle/schema";
import { getDb } from "./db";
import { appRouter } from "./routers";

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const restaurantIds: number[] = [];
const ownerIds: number[] = [];

const adminCaller = appRouter.createCaller({
  adminAccount: { id: 1, email: "translation-flow-admin@pronto.test" },
  restaurantOwner: null,
  user: null,
  req: { session: {} },
  res: {},
} as any);

afterAll(async () => {
  const db = await getDb();
  if (!db) return;
  if (restaurantIds.length) {
    await db.delete(translations).where(inArray(translations.restaurantId, restaurantIds));
    await db.delete(restaurants).where(inArray(restaurants.id, restaurantIds));
  }
  if (ownerIds.length) await db.delete(restaurantOwners).where(inArray(restaurantOwners.id, ownerIds));
});

describe("parcours de traduction Pro", () => {
  it("génère une traduction une fois, permet sa correction et expose la version corrigée publiquement", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const ownerEmail = `translation-flow-owner-${runId}@example.test`;
    const [ownerResult] = await db.insert(restaurantOwners).values({
      email: ownerEmail,
      name: "Propriétaire traduction test",
      provider: "email",
      passwordHash: "test-only-hash",
    });
    const ownerId = Number(ownerResult.insertId);
    ownerIds.push(ownerId);

    const restaurant = await adminCaller.admin.createRestaurant({
      ownerId,
      name: "Maison de traduction",
      slug: `translation-flow-${runId}`,
      subscriptionTier: "pro",
      subscriptionStatus: "trial",
    });
    restaurantIds.push(restaurant.id);

    const ownerCaller = appRouter.createCaller({
      adminAccount: null,
      restaurantOwner: { id: ownerId, email: ownerEmail },
      user: null,
      req: { session: {} },
      res: {},
    } as any);
    const publicCaller = appRouter.createCaller({
      adminAccount: null,
      restaurantOwner: null,
      user: null,
      req: { session: {} },
      res: {},
    } as any);

    await expect(publicCaller.translations.getTranslations({ restaurantId: restaurant.id, language: "en" })).resolves.toEqual([]);

    await expect(ownerCaller.translations.autoTranslatePublic({ restaurantId: restaurant.id, targetLanguage: "en" })).resolves.toMatchObject({
      success: true,
      alreadyTranslated: false,
      translationsCount: 1,
    });
    expect(invokeLLM).toHaveBeenCalledTimes(1);

    const managementTranslations = await ownerCaller.translations.getTranslationsForManagement({ restaurantId: restaurant.id });
    expect(managementTranslations).toHaveLength(1);
    expect(managementTranslations[0]).toMatchObject({
      restaurantId: restaurant.id,
      entityType: "restaurant",
      field: "name",
      language: "en",
      originalText: "Maison de traduction",
      translatedText: "Translated storefront name",
      isAutoTranslated: true,
    });

    const translationId = managementTranslations[0]!.id;
    await ownerCaller.translations.updateTranslation({
      translationId,
      translatedText: "Curated English storefront name",
    });

    await expect(publicCaller.translations.getTranslations({ restaurantId: restaurant.id, language: "en" })).resolves.toMatchObject([
      { id: translationId, translatedText: "Curated English storefront name", isAutoTranslated: false },
    ]);
    await expect(ownerCaller.translations.autoTranslatePublic({ restaurantId: restaurant.id, targetLanguage: "en" })).resolves.toMatchObject({
      success: true,
      alreadyTranslated: true,
      translationsCount: 0,
    });
    expect(invokeLLM).toHaveBeenCalledTimes(1);
  });
});
