import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { galleryPhotos } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const galleryRouter = router({
  // Get gallery photos for a restaurant
  getGalleryPhotos: publicProcedure
    .input(z.object({ restaurantId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const photos = await db
        .select()
        .from(galleryPhotos)
        .where(
          and(
            eq(galleryPhotos.restaurantId, input.restaurantId),
            eq(galleryPhotos.isActive, true)
          )
        )
        .orderBy(galleryPhotos.displayOrder);

      return photos;
    }),

  // Add a photo to gallery
  addPhoto: protectedProcedure
    .input(
      z.object({
        restaurantId: z.number(),
        imageUrl: z.string().url(),
        caption: z.string().optional(),
        displayOrder: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [photo] = await db
        .insert(galleryPhotos)
        .values({
          restaurantId: input.restaurantId,
          imageUrl: input.imageUrl,
          caption: input.caption,
          displayOrder: input.displayOrder || 0,
        })
        .$returningId();

      return photo;
    }),

  // Update photo
  updatePhoto: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        caption: z.string().optional(),
        displayOrder: z.number().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(galleryPhotos)
        .set({
          caption: input.caption,
          displayOrder: input.displayOrder,
          isActive: input.isActive,
          updatedAt: new Date(),
        })
        .where(eq(galleryPhotos.id, input.id));

      return { success: true };
    }),

  // Delete photo
  deletePhoto: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(galleryPhotos).where(eq(galleryPhotos.id, input.id));

      return { success: true };
    }),
});
