import { z } from "zod";
import { router } from "../_core/trpc";
import { restaurantProcedure, restaurateurProcedure } from "../_core/tenantMiddleware";
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
} from "../db";

export const restaurantRouter = router({
  // Get current restaurant (based on tenant context)
  getCurrent: restaurantProcedure.query(async ({ ctx }) => {
    // @ts-ignore - restaurant is added by middleware
    return ctx.restaurant;
  }),

  // Get restaurants owned by current user
  getMyRestaurants: restaurateurProcedure.query(async ({ ctx }) => {
    return await getRestaurantsByOwnerId(ctx.user.id);
  }),

  // Update restaurant settings
  updateSettings: restaurateurProcedure
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
      const restaurants = await getRestaurantsByOwnerId(ctx.user.id);
      const ownsRestaurant = restaurants.some((r) => r.id === input.restaurantId);

      if (!ownsRestaurant && ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      return await updateRestaurant(input.restaurantId, input.data);
    }),

  // Menu Categories
  getCategories: restaurantProcedure
    .input(z.object({ restaurantId: z.number() }))
    .query(async ({ input }) => {
      return await getMenuCategoriesByRestaurantId(input.restaurantId);
    }),

  createCategory: restaurateurProcedure
    .input(
      z.object({
        restaurantId: z.number(),
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        displayOrder: z.number().default(0),
      })
    )
    .mutation(async ({ input }) => {
      return await createMenuCategory(input);
    }),

  updateCategory: restaurateurProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          name: z.string().min(1).max(100).optional(),
          description: z.string().optional(),
          displayOrder: z.number().optional(),
          isActive: z.boolean().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      return await updateMenuCategory(input.id, input.data);
    }),

  deleteCategory: restaurateurProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteMenuCategory(input.id);
      return { success: true };
    }),

  // Menu Items
  getMenuItems: restaurantProcedure
    .input(z.object({ restaurantId: z.number() }))
    .query(async ({ input }) => {
      return await getMenuItemsByRestaurantId(input.restaurantId);
    }),

  getItemsByCategory: restaurantProcedure
    .input(z.object({ categoryId: z.number() }))
    .query(async ({ input }) => {
      return await getMenuItemsByCategoryId(input.categoryId);
    }),

  createMenuItem: restaurateurProcedure
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

  updateMenuItem: restaurateurProcedure
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

  deleteMenuItem: restaurateurProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteMenuItem(input.id);
      return { success: true };
    }),

  // Chatbot Configuration
  getChatbotConfig: restaurantProcedure
    .input(z.object({ restaurantId: z.number() }))
    .query(async ({ input }) => {
      return await getChatbotConfigByRestaurantId(input.restaurantId);
    }),

  updateChatbotConfig: restaurateurProcedure
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
  getPageViews: restaurateurProcedure
    .input(z.object({ restaurantId: z.number(), limit: z.number().default(1000) }))
    .query(async ({ input }) => {
      return await getPageViewsByRestaurantId(input.restaurantId, input.limit);
    }),

  getChatbotConversations: restaurateurProcedure
    .input(z.object({ restaurantId: z.number(), limit: z.number().default(100) }))
    .query(async ({ input }) => {
      return await getChatbotConversationsByRestaurantId(input.restaurantId, input.limit);
    }),
});
