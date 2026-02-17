import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router } from "../_core/trpc";
// Removed obsolete tenantMiddleware import
import { publicProcedure, protectedProcedure, restaurantOwnerProcedure } from "../_core/trpc";
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
import { eq } from "drizzle-orm";

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

      // Super Admin has access to all restaurants
      if (ctx.user && ctx.user.role === 'admin') {
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
    if (!ctx.user) return [];
    return await getRestaurantsByOwnerId(ctx.user.id);
  }),

  // Update restaurant settings
  updateSettings: restaurantOwnerProcedure
    .input(
      z.object({
        restaurantId: z.number(),
        data: z.object({
          name: z.string().min(1).max(255).optional(),
          description: z.string().optional(),
          whatsapp: z.string().optional(),
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
      // Verify ownership
      if (!ctx.user) {
        throw new Error("Unauthorized");
      }
      const restaurants = await getRestaurantsByOwnerId(ctx.user.id);
      const ownsRestaurant = restaurants.some((r) => r.id === input.restaurantId);

      if (!ownsRestaurant && ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      return await updateRestaurant(input.restaurantId, input.data);
    }),

  // Menu Categories
  getCategories: publicProcedure
    .input(z.object({ restaurantId: z.number() }))
    .query(async ({ input }) => {
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
    .mutation(async ({ input }) => {
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
    .mutation(async ({ input }) => {
      return await updateMenuCategory(input.id, input.data);
    }),

  deleteCategory: restaurantOwnerProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteMenuCategory(input.id);
      return { success: true };
    }),

  // Menu Items
  getMenuItems: publicProcedure
    .input(z.object({ restaurantId: z.number() }))
    .query(async ({ input }) => {
      return await getMenuItemsByRestaurantId(input.restaurantId);
    }),

  getItemsByCategory: publicProcedure
    .input(z.object({ categoryId: z.number() }))
    .query(async ({ input }) => {
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
    .mutation(async ({ input }) => {
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
    .mutation(async ({ input }) => {
      return await updateMenuItem(input.id, input.data);
    }),

  deleteMenuItem: restaurantOwnerProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteMenuItem(input.id);
      return { success: true };
    }),

  // Chatbot Configuration
  getChatbotConfig: publicProcedure
    .input(z.object({ restaurantId: z.number() }))
    .query(async ({ input }) => {
      return await getChatbotConfigByRestaurantId(input.restaurantId);
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
    .mutation(async ({ input }) => {
      return await upsertChatbotConfig(input);
    }),

  // Analytics
  getPageViews: restaurantOwnerProcedure
    .input(z.object({ restaurantId: z.number(), limit: z.number().default(1000) }))
    .query(async ({ input }) => {
      return await getPageViewsByRestaurantId(input.restaurantId, input.limit);
    }),

  getChatbotConversations: restaurantOwnerProcedure
    .input(z.object({ restaurantId: z.number(), limit: z.number().default(100) }))
    .query(async ({ input }) => {
      return await getChatbotConversationsByRestaurantId(input.restaurantId, input.limit);
    }),

  // Reorder Categories
  reorderCategories: restaurantOwnerProcedure
    .input(
      z.object({
        restaurantId: z.number(),
        categoryIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input }) => {
      // Update displayOrder for each category
      const db = await getDb();
      if (!db) throw new Error("Database not available");

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
        categoryId: z.number(),
        itemIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input }) => {
      // Update displayOrder for each item
      const db = await getDb();
      if (!db) throw new Error("Database not available");

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
        filename: z.string(),
        contentType: z.string(),
        data: z.string(), // base64 encoded
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { storagePut } = await import("../storage");
      const { nanoid } = await import("nanoid");

      // Decode base64
      const buffer = Buffer.from(input.data, "base64");

      // Generate unique filename
      const ext = input.filename.split(".").pop();
      // Use restaurantOwner ID if available, otherwise use super admin user ID
      const userId = ctx.restaurantOwner?.id || ctx.user?.id || 'unknown';
      const key = `restaurants/${userId}/${nanoid()}.${ext}`;

      // Upload to S3
      const { url } = await storagePut(key, buffer, input.contentType);

      return { url };
    }),

  // Get restaurant by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

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
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

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
