import { z } from "zod";
import { router } from "../_core/trpc";
import { adminProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { advertisements } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import {
  getAllRestaurants,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getRestaurantById,
  getGlobalStats,
  getUserById,
} from "../db";

export const adminRouter = router({
  // Get global statistics
  getStats: adminProcedure.query(async () => {
    return await getGlobalStats();
  }),

  // List all restaurants
  listRestaurants: adminProcedure.query(async () => {
    return await getAllRestaurants();
  }),

  // Get single restaurant
  getRestaurant: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await getRestaurantById(input.id);
    }),

  // Create restaurant
  createRestaurant: adminProcedure
    .input(
      z.object({
        ownerId: z.number(),
        slug: z.string().min(1).max(100),
        name: z.string().min(1).max(255),
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
        subscriptionTier: z.enum(["menu", "pro", "premium"]).optional(),
        subscriptionStatus: z.enum(["active", "trial", "expired", "cancelled"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await createRestaurant(input);
    }),

  // Update restaurant
  updateRestaurant: adminProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          slug: z.string().min(1).max(100).optional(),
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
          subscriptionTier: z.enum(["menu", "pro", "premium"]).optional(),
          subscriptionStatus: z.enum(["active", "trial", "expired", "cancelled"]).optional(),
          isActive: z.boolean().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      return await updateRestaurant(input.id, input.data);
    }),

  // Delete restaurant
  deleteRestaurant: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteRestaurant(input.id);
      return { success: true };
    }),

  // Get user by ID (for owner assignm  // Get user by ID
  getUser: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await getUserById(input.id);
    }),

  // ===== ADVERTISEMENTS =====

  // List all advertisements
  listAdvertisements: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const ads = await db.select().from(advertisements).orderBy(advertisements.displayOrder);
    return ads;
  }),

  // Create advertisement
  createAdvertisement: adminProcedure
    .input(
      z.object({
        title: z.string(),
        imageUrl: z.string(),
        linkUrl: z.string(),
        displayOrder: z.number().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [ad] = await db.insert(advertisements).values({
        title: input.title,
        imageUrl: input.imageUrl,
        linkUrl: input.linkUrl,
        displayOrder: input.displayOrder,
        isActive: true,
      });

      return ad;
    }),

  // Update advertisement
  updateAdvertisement: adminProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          title: z.string().optional(),
          imageUrl: z.string().optional(),
          linkUrl: z.string().optional(),
          displayOrder: z.number().optional(),
          isActive: z.boolean().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.update(advertisements).set(input.data).where(eq(advertisements.id, input.id));

      return { success: true };
    }),

  // Delete advertisement
  deleteAdvertisement: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.delete(advertisements).where(eq(advertisements.id, input.id));

      return { success: true };
    }),
});