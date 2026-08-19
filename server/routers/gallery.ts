import { z } from "zod";
import { router, publicProcedure, restaurantOwnerProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { galleryPhotos, restaurants } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const galleryRouter = router({
  getGalleryPhotos: publicProcedure
    .input(z.object({ restaurantId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return db.select().from(galleryPhotos).where(and(eq(galleryPhotos.restaurantId, input.restaurantId), eq(galleryPhotos.isActive, true))).orderBy(galleryPhotos.displayOrder);
    }),

  addPhoto: restaurantOwnerProcedure
    .input(z.object({ restaurantId: z.number(), imageUrl: z.string().url(), caption: z.string().optional(), displayOrder: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, input.restaurantId)).limit(1);
      if (!restaurant || (!ctx.adminAccount && restaurant.ownerId !== ctx.restaurantOwner?.id)) throw new Error("Unauthorized");
      const [photo] = await db.insert(galleryPhotos).values({ restaurantId: input.restaurantId, imageUrl: input.imageUrl, caption: input.caption, displayOrder: input.displayOrder || 0 }).$returningId();
      return photo;
    }),

  updatePhoto: restaurantOwnerProcedure
    .input(z.object({ id: z.number(), caption: z.string().optional(), displayOrder: z.number().optional(), isActive: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [photo] = await db.select().from(galleryPhotos).where(eq(galleryPhotos.id, input.id)).limit(1);
      const [restaurant] = photo ? await db.select().from(restaurants).where(eq(restaurants.id, photo.restaurantId)).limit(1) : [];
      if (!restaurant || (!ctx.adminAccount && restaurant.ownerId !== ctx.restaurantOwner?.id)) throw new Error("Unauthorized");
      await db.update(galleryPhotos).set({ caption: input.caption, displayOrder: input.displayOrder, isActive: input.isActive, updatedAt: new Date() }).where(eq(galleryPhotos.id, input.id));
      return { success: true };
    }),

  deletePhoto: restaurantOwnerProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [photo] = await db.select().from(galleryPhotos).where(eq(galleryPhotos.id, input.id)).limit(1);
      const [restaurant] = photo ? await db.select().from(restaurants).where(eq(restaurants.id, photo.restaurantId)).limit(1) : [];
      if (!restaurant || (!ctx.adminAccount && restaurant.ownerId !== ctx.restaurantOwner?.id)) throw new Error("Unauthorized");
      await db.delete(galleryPhotos).where(eq(galleryPhotos.id, input.id));
      return { success: true };
    }),
});
