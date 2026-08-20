import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router } from "../_core/trpc";
// Removed obsolete tenantMiddleware import
import { publicProcedure, restaurantOwnerProcedure } from "../_core/trpc";
import {
  getRestaurantsByOwnerId,
  updateRestaurant,
  getMenuCategoriesByRestaurantId,
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  getMenuItemsByRestaurantId,
  getMenuItemsByCategoryId,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getChatbotConfigByRestaurantId,
  upsertChatbotConfig,
  getPageViewsByRestaurantId,
  getChatbotConversationsByRestaurantId,
  getDb,
} from "../db";
import { menuCategories, menuItems, restaurants } from "../../drizzle/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import { acceptedMediaTypes } from "../media-validation";
import { requireSubscriptionFeature } from "../subscription-access";
import { whatsappInputSchema } from "../contact-inputs";

async function assertCatalogReadAccess(ctx: { adminAccount: unknown; restaurantOwner: { id: number } | null }, restaurantId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  const [restaurant] = await db.select({ ownerId: restaurants.ownerId }).from(restaurants).where(eq(restaurants.id, restaurantId)).limit(1);
  if (!restaurant || (!ctx.adminAccount && restaurant.ownerId !== ctx.restaurantOwner?.id)) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
}

async function getCategoryRestaurantId(categoryId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  const [category] = await db.select({ restaurantId: menuCategories.restaurantId }).from(menuCategories).where(eq(menuCategories.id, categoryId)).limit(1);
  if (!category) throw new TRPCError({ code: "NOT_FOUND", message: "Catégorie introuvable" });
  return category.restaurantId;
}

async function getMenuItemRestaurantId(itemId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  const [item] = await db.select({ restaurantId: menuItems.restaurantId }).from(menuItems).where(eq(menuItems.id, itemId)).limit(1);
  if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Produit introuvable" });
  return item.restaurantId;
}

const featuredItemLimitByTier = { menu: 1, pro: 3, premium: 5 } as const;

export const restaurantRouter = router({
  /**
   * Check if current user has access to a restaurant dashboard
   * Returns restaurant data if authorized, throws error otherwise
   */
  checkDashboardAccess: restaurantOwnerProcedure
    .input(
      z.object({
        restaurantId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Get restaurant
      const [restaurant] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.id, input.restaurantId))
        .limit(1);

      if (!restaurant) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Restaurant non trouvé" });
      }

      // Local Super Admin has access to all restaurants.
      if (ctx.adminAccount) {
        return { authorized: true, restaurant, isAdmin: true };
      }

      // Restaurant owner can only access their own restaurant
      if (ctx.restaurantOwner) {
        if (restaurant.ownerId !== ctx.restaurantOwner.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Vous n'avez pas accès à ce restaurant",
          });
        }
        return { authorized: true, restaurant, isAdmin: false };
      }

      throw new TRPCError({ code: "UNAUTHORIZED", message: "Non autorisé" });
    }),

  // Get current restaurant (based on tenant context) - DEPRECATED
  // getCurrent: publicProcedure.query(async ({ ctx }) => {
  //   return null;
  // }),

  // Get restaurants owned by current user
  getMyRestaurants: restaurantOwnerProcedure.query(async ({ ctx }) => {
    if (!ctx.restaurantOwner) return [];
    return await getRestaurantsByOwnerId(ctx.restaurantOwner.id);
  }),

  // Update restaurant settings
  updateSettings: restaurantOwnerProcedure
    .input(
      z.object({
        restaurantId: z.number(),
        data: z.object({
          name: z.string().min(1).max(255).optional(),
          description: z.string().optional(),
          whatsapp: whatsappInputSchema.optional(),
          reservationUrl: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          address: z.string().optional(),
          logoUrl: z.string().optional(),
          heroImageUrl: z.string().optional(),
          primaryColor: z.string().optional(),
          accentColor: z.string().optional(),
          fontFamily: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.adminAccount) {
        return await updateRestaurant(input.restaurantId, input.data);
      }
      const userId = ctx.restaurantOwner?.id;
      if (!userId) {
        throw new Error("Unauthorized");
      }
      const restaurants = await getRestaurantsByOwnerId(userId);
      const ownsRestaurant = restaurants.some((r) => r.id === input.restaurantId);

      if (!ownsRestaurant) {
        throw new Error("Unauthorized");
      }

      return await updateRestaurant(input.restaurantId, input.data);
    }),

  updateFeatureActivation: restaurantOwnerProcedure
    .input(z.object({
      restaurantId: z.number().int().positive(),
      feature: z.enum(["events", "reservations"]),
      enabled: z.boolean(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const [restaurant] = await db
        .select({ ownerId: restaurants.ownerId, subscriptionTier: restaurants.subscriptionTier, featuresEnabled: restaurants.featuresEnabled })
        .from(restaurants)
        .where(eq(restaurants.id, input.restaurantId))
        .limit(1);
      if (!restaurant || (!ctx.adminAccount && restaurant.ownerId !== ctx.restaurantOwner?.id)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Vous n'avez pas accès à cet établissement." });
      }
      requireSubscriptionFeature(ctx, restaurant.subscriptionTier, "premium");
      const featuresEnabled: { events?: boolean; reservations?: boolean; translations?: boolean } = {
        events: true,
        reservations: true,
        translations: true,
        ...(restaurant.featuresEnabled || {}),
      };
      featuresEnabled[input.feature] = input.enabled;
      await updateRestaurant(input.restaurantId, { featuresEnabled });
      return { feature: input.feature, enabled: input.enabled };
    }),

  updateHomepageContent: restaurantOwnerProcedure
    .input(z.object({
      restaurantId: z.number().int().positive(),
      heroHeading: z.string().trim().max(160).optional(),
      heroTagline: z.string().trim().max(320).optional(),
      aboutTitle: z.string().trim().max(160).optional(),
      aboutContent: z.string().trim().max(5_000).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const [restaurant] = await db
        .select({ ownerId: restaurants.ownerId, subscriptionTier: restaurants.subscriptionTier })
        .from(restaurants)
        .where(eq(restaurants.id, input.restaurantId))
        .limit(1);
      if (!restaurant || (!ctx.adminAccount && restaurant.ownerId !== ctx.restaurantOwner?.id)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Vous n'avez pas accès à cet établissement." });
      }
      requireSubscriptionFeature(ctx, restaurant.subscriptionTier, "premium");
      const { restaurantId, ...content } = input;
      await updateRestaurant(restaurantId, content);
      return { success: true };
    }),

  // Menu Categories
  getCategories: restaurantOwnerProcedure
    .input(z.object({ restaurantId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      await assertCatalogReadAccess(ctx, input.restaurantId);
      return await getMenuCategoriesByRestaurantId(input.restaurantId);
    }),

  createCategory: restaurantOwnerProcedure
    .input(
      z.object({
        restaurantId: z.number(),
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        emoji: z.string().optional(),
        imageUrl: z.string().optional(),
        displayOrder: z.number().default(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await assertCatalogReadAccess(ctx, input.restaurantId);
      return await createMenuCategory(input);
    }),

  updateCategory: restaurantOwnerProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          name: z.string().min(1).max(100).optional(),
          description: z.string().optional(),
          emoji: z.string().optional(),
          imageUrl: z.string().optional(),
          displayOrder: z.number().optional(),
          isActive: z.boolean().optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await assertCatalogReadAccess(ctx, await getCategoryRestaurantId(input.id));
      return await updateMenuCategory(input.id, input.data);
    }),

  deleteCategory: restaurantOwnerProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      await assertCatalogReadAccess(ctx, await getCategoryRestaurantId(input.id));
      await deleteMenuCategory(input.id);
      return { success: true };
    }),

  // Menu Items
  getMenuItems: restaurantOwnerProcedure
    .input(z.object({ restaurantId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      await assertCatalogReadAccess(ctx, input.restaurantId);
      return await getMenuItemsByRestaurantId(input.restaurantId);
    }),

  getItemsByCategory: restaurantOwnerProcedure
    .input(z.object({ categoryId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const [category] = await db.select({ restaurantId: menuCategories.restaurantId }).from(menuCategories).where(eq(menuCategories.id, input.categoryId)).limit(1);
      if (!category) throw new TRPCError({ code: "NOT_FOUND" });
      await assertCatalogReadAccess(ctx, category.restaurantId);
      return await getMenuItemsByCategoryId(input.categoryId);
    }),

  createMenuItem: restaurantOwnerProcedure
    .input(
      z.object({
        categoryId: z.number(),
        restaurantId: z.number(),
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        price: z.string(), // Decimal as string
        imageUrl: z.string().optional(),
        isVegetarian: z.boolean().default(false),
        isVegan: z.boolean().default(false),
        isGlutenFree: z.boolean().default(false),
        allergens: z.array(z.string()).default([]),
        ingredients: z.string().optional(),
        nutritionalInfo: z.object({
          calories: z.number().optional(),
          protein: z.number().optional(),
          carbs: z.number().optional(),
          fat: z.number().optional(),
        }).optional(),
        displayOrder: z.number().default(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await assertCatalogReadAccess(ctx, input.restaurantId);
      const categoryRestaurantId = await getCategoryRestaurantId(input.categoryId);
      if (categoryRestaurantId !== input.restaurantId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "La catégorie ne correspond pas à cet établissement." });
      }
      return await createMenuItem(input);
    }),

  updateMenuItem: restaurantOwnerProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          name: z.string().min(1).max(255).optional(),
          description: z.string().optional(),
          price: z.string().optional(),
          imageUrl: z.string().optional(),
          isVegetarian: z.boolean().optional(),
          isVegan: z.boolean().optional(),
          isGlutenFree: z.boolean().optional(),
          allergens: z.array(z.string()).optional(),
          ingredients: z.string().optional(),
          nutritionalInfo: z.object({
            calories: z.number().optional(),
            protein: z.number().optional(),
            carbs: z.number().optional(),
            fat: z.number().optional(),
          }).optional(),
          displayOrder: z.number().optional(),
          isActive: z.boolean().optional(),
          isFeatured: z.boolean().optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const restaurantId = await getMenuItemRestaurantId(input.id);
      await assertCatalogReadAccess(ctx, restaurantId);
      if (input.data.isFeatured === true && !ctx.adminAccount) {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        await db.transaction(async (tx) => {
          const [restaurant] = await tx.select({ subscriptionTier: restaurants.subscriptionTier }).from(restaurants).where(eq(restaurants.id, restaurantId)).limit(1);
          if (!restaurant) throw new TRPCError({ code: "NOT_FOUND", message: "Établissement introuvable." });
          const [item] = await tx.select({ isFeatured: menuItems.isFeatured }).from(menuItems).where(eq(menuItems.id, input.id)).limit(1);
          if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Plat introuvable." });
          if (!item.isFeatured) {
            await tx.execute(sql`SELECT id FROM menuItems WHERE restaurantId = ${restaurantId} AND isFeatured = true FOR UPDATE`);
            const featuredItems = await tx.select({ id: menuItems.id }).from(menuItems).where(and(eq(menuItems.restaurantId, restaurantId), eq(menuItems.isFeatured, true)));
            const limit = featuredItemLimitByTier[restaurant.subscriptionTier];
            if (featuredItems.length >= limit) {
              throw new TRPCError({ code: "FORBIDDEN", message: `Votre formule permet jusqu’à ${limit} spécialité${limit > 1 ? "s" : ""} mise${limit > 1 ? "s" : ""} en avant.` });
            }
          }
          await tx.update(menuItems).set(input.data).where(eq(menuItems.id, input.id));
        });
        return { success: true };
      }
      return await updateMenuItem(input.id, input.data);
    }),

  deleteMenuItem: restaurantOwnerProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      await assertCatalogReadAccess(ctx, await getMenuItemRestaurantId(input.id));
      await deleteMenuItem(input.id);
      return { success: true };
    }),

  // Chatbot configuration for the authenticated dashboard only.
  getChatbotConfig: restaurantOwnerProcedure
    .input(z.object({ restaurantId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const [restaurant] = await db.select({ ownerId: restaurants.ownerId }).from(restaurants).where(eq(restaurants.id, input.restaurantId)).limit(1);
      if (!restaurant || (!ctx.adminAccount && restaurant.ownerId !== ctx.restaurantOwner?.id)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return await getChatbotConfigByRestaurantId(input.restaurantId);
    }),

  // Minimal public chatbot presentation state; excludes instructions and analytics.
  getPublicChatbotConfig: publicProcedure
    .input(z.object({ restaurantId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const [restaurant] = await db.select({ id: restaurants.id }).from(restaurants).where(and(
        eq(restaurants.id, input.restaurantId),
        eq(restaurants.isActive, true),
      )).limit(1);
      if (!restaurant) return null;
      const config = await getChatbotConfigByRestaurantId(input.restaurantId);
      return {
        isEnabled: config.isEnabled,
        tone: config.tone,
        welcomeMessage: config.welcomeMessage,
      };
    }),

  updateChatbotConfig: restaurantOwnerProcedure
    .input(
      z.object({
        restaurantId: z.number(),
        isEnabled: z.boolean().optional(),
        tone: z.enum(["formal", "warm", "casual"]).optional(),
        customInfo: z.string().optional(),
        welcomeMessage: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await assertCatalogReadAccess(ctx, input.restaurantId);
      return await upsertChatbotConfig(input);
    }),

  // Analytics
  getPageViews: restaurantOwnerProcedure
    .input(z.object({ restaurantId: z.number().int().positive(), limit: z.number().int().min(1).max(1000).default(1000) }))
    .query(async ({ input, ctx }) => {
      await assertCatalogReadAccess(ctx, input.restaurantId);
      return await getPageViewsByRestaurantId(input.restaurantId, input.limit);
    }),

  getChatbotConversations: restaurantOwnerProcedure
    .input(z.object({ restaurantId: z.number().int().positive(), limit: z.number().int().min(1).max(1000).default(100) }))
    .query(async ({ input, ctx }) => {
      await assertCatalogReadAccess(ctx, input.restaurantId);
      return await getChatbotConversationsByRestaurantId(input.restaurantId, input.limit);
    }),

  // Reorder Categories
  reorderCategories: restaurantOwnerProcedure
    .input(
      z.object({
        restaurantId: z.number().int().positive(),
        categoryIds: z.array(z.number().int().positive()).max(200),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Update displayOrder for each category
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await assertCatalogReadAccess(ctx, input.restaurantId);
      const categories = input.categoryIds.length
        ? await db.select({ id: menuCategories.id, restaurantId: menuCategories.restaurantId }).from(menuCategories).where(inArray(menuCategories.id, input.categoryIds))
        : [];
      if (categories.length !== new Set(input.categoryIds).size || categories.some((category) => category.restaurantId !== input.restaurantId)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      for (let i = 0; i < input.categoryIds.length; i++) {
        await db
          .update(menuCategories)
          .set({ displayOrder: i })
          .where(eq(menuCategories.id, input.categoryIds[i]));
      }

      return { success: true };
    }),

  // Reorder Items within a category
  reorderItems: restaurantOwnerProcedure
    .input(
      z.object({
        categoryId: z.number().int().positive(),
        itemIds: z.array(z.number().int().positive()).max(500),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Update displayOrder for each item
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const restaurantId = await getCategoryRestaurantId(input.categoryId);
      await assertCatalogReadAccess(ctx, restaurantId);
      const items = input.itemIds.length
        ? await db.select({ id: menuItems.id, categoryId: menuItems.categoryId, restaurantId: menuItems.restaurantId }).from(menuItems).where(inArray(menuItems.id, input.itemIds))
        : [];
      if (items.length !== new Set(input.itemIds).size || items.some((item) => item.categoryId !== input.categoryId || item.restaurantId !== restaurantId)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      for (let i = 0; i < input.itemIds.length; i++) {
        await db
          .update(menuItems)
          .set({ displayOrder: i })
          .where(eq(menuItems.id, input.itemIds[i]));
      }

      return { success: true };
    }),

  // Upload image to S3
  uploadImage: restaurantOwnerProcedure
    .input(
      z.object({
        filename: z.string().trim().min(1).max(255),
        contentType: z.enum(acceptedMediaTypes),
        data: z.string().min(8).max(7_000_000), // base64 encoded
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { storagePut } = await import("../storage");
      const { nanoid } = await import("nanoid");
      const { decodeStrictBase64, hasValidMediaSignature, mediaExtension } = await import("../media-validation");

      // Decode base64
      const buffer = decodeStrictBase64(input.data);
      if (!buffer || buffer.length > 5 * 1024 * 1024 || !hasValidMediaSignature(buffer, input.contentType)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Le fichier est invalide, son format ne correspond pas ou il dépasse 5 Mo." });
      }

      // Generate unique filename
      const userId = ctx.restaurantOwner?.id ?? ctx.adminAccount?.id ?? 'unknown';
      const key = `restaurants/${userId}/${nanoid()}.${mediaExtension(input.contentType)}`;

      // Upload to S3
      const { url } = await storagePut(key, buffer, input.contentType);

      return { url };
    }),

  // Get restaurant by ID
  getById: restaurantOwnerProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await assertCatalogReadAccess(ctx, input.id);

      const [restaurant] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.id, input.id))
        .limit(1);

      return restaurant || null;
    }),

  // Update customization (logo, colors, fonts, theme)
  updateCustomization: restaurantOwnerProcedure
    .input(
      z.object({
        restaurantId: z.number(),
        logoUrl: z.string().optional(),
        primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        fontFamily: z.string().optional(),
        theme: z.enum(["pronto-service", "moderne-soho", "beach-boheme", "day-night", "marble-rome"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await assertCatalogReadAccess(ctx, input.restaurantId);

      await db
        .update(restaurants)
        .set({
          logoUrl: input.logoUrl,
          primaryColor: input.primaryColor,
          accentColor: input.accentColor,
          fontFamily: input.fontFamily,
          theme: input.theme,
          updatedAt: new Date(),
        })
        .where(eq(restaurants.id, input.restaurantId));

      return { success: true };
    }),
});
