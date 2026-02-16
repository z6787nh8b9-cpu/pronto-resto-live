import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { openingHours } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const openingHoursRouter = router({
  // Get opening hours for a restaurant (public)
  getOpeningHours: publicProcedure
    .input(z.object({ restaurantId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const hours = await db
        .select()
        .from(openingHours)
        .where(eq(openingHours.restaurantId, input.restaurantId))
        .orderBy(openingHours.dayOfWeek);

      return hours;
    }),

  // Set opening hours for a specific day (protected)
  setOpeningHours: protectedProcedure
    .input(
      z.object({
        restaurantId: z.number(),
        dayOfWeek: z.number().min(0).max(6), // 0 = Sunday, 6 = Saturday
        openTime: z.string().nullable(),
        closeTime: z.string().nullable(),
        isClosed: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Check if entry exists
      const existing = await db
        .select()
        .from(openingHours)
        .where(
          and(
            eq(openingHours.restaurantId, input.restaurantId),
            eq(openingHours.dayOfWeek, input.dayOfWeek)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing
        await db
          .update(openingHours)
          .set({
            openTime: input.openTime,
            closeTime: input.closeTime,
            isClosed: input.isClosed,
            updatedAt: new Date(),
          })
          .where(eq(openingHours.id, existing[0].id));
      } else {
        // Insert new
        await db.insert(openingHours).values({
          restaurantId: input.restaurantId,
          dayOfWeek: input.dayOfWeek,
          openTime: input.openTime,
          closeTime: input.closeTime,
          isClosed: input.isClosed,
        });
      }

      return { success: true };
    }),

  // Batch set opening hours (protected)
  batchSetOpeningHours: protectedProcedure
    .input(
      z.object({
        restaurantId: z.number(),
        hours: z.array(
          z.object({
            dayOfWeek: z.number().min(0).max(6),
            openTime: z.string().nullable(),
            closeTime: z.string().nullable(),
            isClosed: z.boolean(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Process each day
      for (const dayData of input.hours) {
        const existing = await db
          .select()
          .from(openingHours)
          .where(
            and(
              eq(openingHours.restaurantId, input.restaurantId),
              eq(openingHours.dayOfWeek, dayData.dayOfWeek)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(openingHours)
            .set({
              openTime: dayData.openTime,
              closeTime: dayData.closeTime,
              isClosed: dayData.isClosed,
              updatedAt: new Date(),
            })
            .where(eq(openingHours.id, existing[0].id));
        } else {
          await db.insert(openingHours).values({
            restaurantId: input.restaurantId,
            dayOfWeek: dayData.dayOfWeek,
            openTime: dayData.openTime,
            closeTime: dayData.closeTime,
            isClosed: dayData.isClosed,
          });
        }
      }

      return { success: true };
    }),
});
