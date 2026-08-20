import { z } from "zod";
import { router, publicProcedure, restaurantOwnerProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { galleryPhotos, restaurants } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { requireSubscriptionFeature } from "../subscription-access";

export const galleryRouter = router({
  getGalleryPhotos: publicProcedure
    .input(z.object({ restaurantId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [restaurant] = await db.select({ id: restaurants.id, subscriptionTier: restaurants.subscriptionTier }).from(restaurants).where(and(
        eq(restaurants.id, input.restaurantId),
        eq(restaurants.isActive, true),
      )).limit(1);
      if (!restaurant || restaurant.subscriptionTier !== "premium") return [];
      return db.select().from(galleryPhotos).where(and(eq(galleryPhotos.restaurantId, input.restaurantId), eq(galleryPhotos.isActive, true))).orderBy(galleryPhotos.displayOrder);
    }),

  addPhoto: restaurantOwnerProcedure
    .input(z.object({
      restaurantId: z.number().int().positive(),
      imageUrl: z.string().url().max(2_000),
      caption: z.string().trim().max(500).optional(),
      displayOrder: z.number().int().min(0).max(10_000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, input.restaurantId)).limit(1);
      if (!restaurant || (!ctx.adminAccount && restaurant.ownerId !== ctx.restaurantOwner?.id)) throw new Error("Unauthorized");
      requireSubscriptionFeature(ctx, restaurant.subscriptionTier, "premium");
      const [photo] = await db.insert(galleryPhotos).values({ restaurantId: input.restaurantId, imageUrl: input.imageUrl, caption: input.caption, displayOrder: input.displayOrder || 0 }).$returningId();
      return photo;
    }),

  updatePhoto: restaurantOwnerProcedure
    .input(z.object({
      id: z.number().int().positive(),
      caption: z.string().trim().max(500).optional(),
      displayOrder: z.number().int().min(0).max(10_000).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [photo] = await db.select().from(galleryPhotos).where(eq(galleryPhotos.id, input.id)).limit(1);
      const [restaurant] = photo ? await db.select().from(restaurants).where(eq(restaurants.id, photo.restaurantId)).limit(1) : [];
      if (!restaurant || (!ctx.adminAccount && restaurant.ownerId !== ctx.restaurantOwner?.id)) throw new Error("Unauthorized");
      requireSubscriptionFeature(ctx, restaurant.subscriptionTier, "premium");
      await db.update(galleryPhotos).set({ caption: input.caption, displayOrder: input.displayOrder, isActive: input.isActive, updatedAt: new Date() }).where(eq(galleryPhotos.id, input.id));
      return { success: true };
    }),

  deletePhoto: restaurantOwnerProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [photo] = await db.select().from(galleryPhotos).where(eq(galleryPhotos.id, input.id)).limit(1);
      const [restaurant] = photo ? await db.select().from(restaurants).where(eq(restaurants.id, photo.restaurantId)).limit(1) : [];
      if (!restaurant || (!ctx.adminAccount && restaurant.ownerId !== ctx.restaurantOwner?.id)) throw new Error("Unauthorized");
      requireSubscriptionFeature(ctx, restaurant.subscriptionTier, "premium");
      await db.delete(galleryPhotos).where(eq(galleryPhotos.id, input.id));
      return { success: true };
    }),
});
