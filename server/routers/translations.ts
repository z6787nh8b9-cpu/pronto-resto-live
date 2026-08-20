import { z } from "zod";
import { router, publicProcedure, restaurantOwnerProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { translations, restaurants, menuCategories, menuItems } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

export const translationsRouter = router({
  /**
   * Get all translations for a restaurant (public, for displaying translated content)
   */
  getTranslations: publicProcedure
    .input(z.object({
      restaurantId: z.number().int().positive(),
      language: z.enum(["fr", "en", "it", "de", "es"]),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const [restaurant] = await db.select({ id: restaurants.id }).from(restaurants).where(and(
        eq(restaurants.id, input.restaurantId),
        eq(restaurants.isActive, true),
      )).limit(1);
      if (!restaurant) return [];
      const allTranslations = await db
        .select()
        .from(translations)
        .where(
          and(
            eq(translations.restaurantId, input.restaurantId),
            eq(translations.language, input.language)
          )
        );

      return allTranslations;
    }),

  /**
   * Translate all content for a restaurant (batch translation)
   */
  translateAll: restaurantOwnerProcedure
    .input(z.object({
      restaurantId: z.number(),
      targetLanguage: z.enum(["en", "it", "de", "es"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
  if (!db) throw new Error('Database not available');
      
      // Get restaurant
      const [restaurant] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.id, input.restaurantId))
        .limit(1);

      if (!restaurant) {
        throw new Error("Restaurant not found");
      }

      // Check whether the local owner owns this restaurant or a local Super Admin intervenes.
      const isAdmin = Boolean(ctx.adminAccount);
      if (!isAdmin && restaurant.ownerId !== ctx.restaurantOwner?.id) {
        throw new Error("Unauthorized");
      }

      const results = [];

      // Translate restaurant info
      if (restaurant.name) {
        const nameTranslation = await translateSingle(
          input.restaurantId,
          "restaurant",
          restaurant.id,
          "name",
          restaurant.name,
          input.targetLanguage
        );
        results.push(nameTranslation);
      }

      if (restaurant.description) {
        const descTranslation = await translateSingle(
          input.restaurantId,
          "restaurant",
          restaurant.id,
          "description",
          restaurant.description,
          input.targetLanguage
        );
        results.push(descTranslation);
      }

      // Translate categories
      const categories = await db
        .select()
        .from(menuCategories)
        .where(eq(menuCategories.restaurantId, input.restaurantId));

      for (const category of categories) {
        if (category.name) {
          const catTranslation = await translateSingle(
            input.restaurantId,
            "category",
            category.id,
            "name",
            category.name,
            input.targetLanguage
          );
          results.push(catTranslation);
        }

        if (category.description) {
          const catDescTranslation = await translateSingle(
            input.restaurantId,
            "category",
            category.id,
            "description",
            category.description,
            input.targetLanguage
          );
          results.push(catDescTranslation);
        }
      }

      // Translate menu items
      const items = await db
        .select()
        .from(menuItems)
        .where(eq(menuItems.restaurantId, input.restaurantId));

      for (const item of items) {
        if (item.name) {
          const itemTranslation = await translateSingle(
            input.restaurantId,
            "item",
            item.id,
            "name",
            item.name,
            input.targetLanguage
          );
          results.push(itemTranslation);
        }

        if (item.description) {
          const itemDescTranslation = await translateSingle(
            input.restaurantId,
            "item",
            item.id,
            "description",
            item.description,
            input.targetLanguage
          );
          results.push(itemDescTranslation);
        }
      }

      return {
        success: true,
        translationsCount: results.length,
      };
    }),

  /**
   * Update a translation manually (correction)
   */
  updateTranslation: restaurantOwnerProcedure
    .input(z.object({
      translationId: z.number(),
      translatedText: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
  if (!db) throw new Error('Database not available');
      
      // Get translation
      const [translation] = await db
        .select()
        .from(translations)
        .where(eq(translations.id, input.translationId))
        .limit(1);

      if (!translation) {
        throw new Error("Translation not found");
      }

      // Get restaurant to check ownership
      const [restaurant] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.id, translation.restaurantId))
        .limit(1);

      if (!restaurant) {
        throw new Error("Restaurant not found");
      }

      // Check whether the local owner owns this restaurant or a local Super Admin intervenes.
      const isAdmin = Boolean(ctx.adminAccount);
      if (!isAdmin && restaurant.ownerId !== ctx.restaurantOwner?.id) {
        throw new Error("Unauthorized");
      }

      // Update translation
      await db
        .update(translations)
        .set({
          translatedText: input.translatedText,
          isAutoTranslated: false, // Mark as manually corrected
        })
        .where(eq(translations.id, input.translationId));

      return {
        success: true,
      };
    }),

  /**
   * Auto-translate content when visitor changes language (public, one-time per language)
   */
  autoTranslatePublic: restaurantOwnerProcedure
    .input(z.object({
      restaurantId: z.number(),
      targetLanguage: z.enum(["en", "it", "de", "es"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Check if translations already exist for this language
      const existing = await db
        .select()
        .from(translations)
        .where(
          and(
            eq(translations.restaurantId, input.restaurantId),
            eq(translations.language, input.targetLanguage)
          )
        )
        .limit(1);

      // If translations exist, don't re-translate
      if (existing.length > 0) {
        return {
          success: true,
          alreadyTranslated: true,
          translationsCount: 0,
        };
      }

      // Get restaurant
      const [restaurant] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.id, input.restaurantId))
        .limit(1);

      if (!restaurant) {
        throw new Error("Restaurant not found");
      }

      const isPlatformAdmin = Boolean(ctx.adminAccount);
      if (!isPlatformAdmin && restaurant.ownerId !== ctx.restaurantOwner?.id) {
        throw new Error("Unauthorized");
      }

      const results = [];

      // Translate restaurant info
      if (restaurant.name) {
        const nameTranslation = await translateSingle(
          input.restaurantId,
          "restaurant",
          restaurant.id,
          "name",
          restaurant.name,
          input.targetLanguage
        );
        results.push(nameTranslation);
      }

      if (restaurant.description) {
        const descTranslation = await translateSingle(
          input.restaurantId,
          "restaurant",
          restaurant.id,
          "description",
          restaurant.description,
          input.targetLanguage
        );
        results.push(descTranslation);
      }

      // Translate categories
      const categories = await db
        .select()
        .from(menuCategories)
        .where(eq(menuCategories.restaurantId, input.restaurantId));

      for (const category of categories) {
        if (category.name) {
          const catTranslation = await translateSingle(
            input.restaurantId,
            "category",
            category.id,
            "name",
            category.name,
            input.targetLanguage
          );
          results.push(catTranslation);
        }

        if (category.description) {
          const catDescTranslation = await translateSingle(
            input.restaurantId,
            "category",
            category.id,
            "description",
            category.description,
            input.targetLanguage
          );
          results.push(catDescTranslation);
        }
      }

      // Translate menu items
      const items = await db
        .select()
        .from(menuItems)
        .where(eq(menuItems.restaurantId, input.restaurantId));

      for (const item of items) {
        if (item.name) {
          const itemTranslation = await translateSingle(
            input.restaurantId,
            "item",
            item.id,
            "name",
            item.name,
            input.targetLanguage
          );
          results.push(itemTranslation);
        }

        if (item.description) {
          const itemDescTranslation = await translateSingle(
            input.restaurantId,
            "item",
            item.id,
            "description",
            item.description,
            input.targetLanguage
          );
          results.push(itemDescTranslation);
        }
      }

      return {
        success: true,
        alreadyTranslated: false,
        translationsCount: results.length,
      };
    }),

  /**
   * Get all translations for management (dashboard)
   */
  getTranslationsForManagement: restaurantOwnerProcedure
    .input(z.object({
      restaurantId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
  if (!db) throw new Error('Database not available');
      
      // Get restaurant to check ownership
      const [restaurant] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.id, input.restaurantId))
        .limit(1);

      if (!restaurant) {
        throw new Error("Restaurant not found");
      }

      // Check whether the local owner owns this restaurant or a local Super Admin intervenes.
      const isAdmin = Boolean(ctx.adminAccount);
      if (!isAdmin && restaurant.ownerId !== ctx.restaurantOwner?.id) {
        throw new Error("Unauthorized");
      }

      const allTranslations = await db
        .select()
        .from(translations)
        .where(eq(translations.restaurantId, input.restaurantId));

      return allTranslations;
    }),
});

// Helper function to translate a single field
async function translateSingle(
  restaurantId: number,
  entityType: "restaurant" | "category" | "item",
  entityId: number,
  field: string,
  originalText: string,
  targetLanguage: "en" | "it" | "de" | "es"
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  // Check if translation already exists
  const existing = await db
    .select()
    .from(translations)
    .where(
      and(
        eq(translations.restaurantId, restaurantId),
        eq(translations.entityType, entityType),
        eq(translations.entityId, entityId),
        eq(translations.field, field),
        eq(translations.language, targetLanguage)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Translate using Manus LLM
  const languageNames: Record<string, string> = {
    en: "English",
    it: "Italian",
    de: "German",
    es: "Spanish",
  };

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a professional translator specializing in restaurant menus and descriptions. Translate the following French text to ${languageNames[targetLanguage]}. Only return the translated text, nothing else.`,
      },
      {
        role: "user",
        content: originalText,
      },
    ],
  });

  const content = response.choices[0].message.content;
  const translatedText = typeof content === 'string' ? content.trim() : originalText;

  // Save translation
  const [newTranslation] = await db.insert(translations).values({
    restaurantId,
    entityType,
    entityId,
    field,
    language: targetLanguage,
    originalText,
    translatedText,
    isAutoTranslated: true,
  });

  return {
    id: newTranslation.insertId,
    restaurantId,
    entityType,
    entityId,
    field,
    language: targetLanguage,
    originalText,
    translatedText,
    isAutoTranslated: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
