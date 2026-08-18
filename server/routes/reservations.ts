import { z } from "zod";
import { publicProcedure, restaurantOwnerProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { reservations, reservationZones, reservationSettings, restaurants } from "../../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

async function requireReservationManagementAccess(ctx: any, restaurantId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  const [restaurant] = await db.select({ ownerId: restaurants.ownerId }).from(restaurants).where(eq(restaurants.id, restaurantId)).limit(1);
  if (!restaurant) throw new TRPCError({ code: "NOT_FOUND", message: "Restaurant not found" });
  const isPlatformAdmin = Boolean(ctx.adminAccount || ctx.user?.role === "admin");
  if (!isPlatformAdmin && restaurant.ownerId !== ctx.restaurantOwner?.id) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Vous n'avez pas accès à ces réservations." });
  }
  return db;
}

/**
 * Router for managing reservations (PREMIUM feature)
 */
export const reservationsRouter = router({
  /**
   * Get reservation settings for a restaurant
   */
  getSettings: publicProcedure
    .input(z.object({ restaurantId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const settings = await db
        .select()
        .from(reservationSettings)
        .where(eq(reservationSettings.restaurantId, input.restaurantId))
        .limit(1);
      
      return settings[0] || null;
    }),

  /**
   * Update or create reservation settings
   */
  updateSettings: restaurantOwnerProcedure
    .input(z.object({
      restaurantId: z.number(),
      slotDuration: z.number().optional(),
      advanceBookingDays: z.number().optional(),
      minAdvanceHours: z.number().optional(),
      defaultTableSize: z.number().optional(),
      maxPartySize: z.number().optional(),
      notifyByEmail: z.boolean().optional(),
      notifyByWhatsApp: z.boolean().optional(),
      autoConfirm: z.boolean().optional(),
      confirmationMessage: z.string().optional(),
      cancellationPolicy: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireReservationManagementAccess(ctx, input.restaurantId);
      const { restaurantId, ...settings } = input;
      
      // Check if settings exist
      const existing = await db
        .select()
        .from(reservationSettings)
        .where(eq(reservationSettings.restaurantId, restaurantId))
        .limit(1);
      
      if (existing.length > 0) {
        // Update existing settings
        await db
          .update(reservationSettings)
          .set(settings)
          .where(eq(reservationSettings.restaurantId, restaurantId));
      } else {
        // Create new settings
        await db.insert(reservationSettings).values({
          restaurantId,
          ...settings,
        });
      }
      
      return { success: true };
    }),

  /**
   * Get all zones for a restaurant
   */
  getZones: publicProcedure
    .input(z.object({ restaurantId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const zones = await db
        .select()
        .from(reservationZones)
        .where(eq(reservationZones.restaurantId, input.restaurantId))
        .orderBy(reservationZones.displayOrder);
      
      return zones;
    }),

  /**
   * Create a new zone
   */
  createZone: restaurantOwnerProcedure
    .input(z.object({
      restaurantId: z.number(),
      name: z.string(),
      capacity: z.number(),
      displayOrder: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireReservationManagementAccess(ctx, input.restaurantId);
      const result = await db.insert(reservationZones).values(input);
      return { id: result[0].insertId };
    }),

  /**
   * Update a zone
   */
  updateZone: restaurantOwnerProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      capacity: z.number().optional(),
      isActive: z.boolean().optional(),
      displayOrder: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const [zone] = await db.select({ restaurantId: reservationZones.restaurantId }).from(reservationZones).where(eq(reservationZones.id, input.id)).limit(1);
      if (!zone) throw new TRPCError({ code: "NOT_FOUND", message: "Zone not found" });
      await requireReservationManagementAccess(ctx, zone.restaurantId);
      const { id, ...updates } = input;
      await db
        .update(reservationZones)
        .set(updates)
        .where(eq(reservationZones.id, id));
      
      return { success: true };
    }),

  /**
   * Delete a zone
   */
  deleteZone: restaurantOwnerProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const [zone] = await db.select({ restaurantId: reservationZones.restaurantId }).from(reservationZones).where(eq(reservationZones.id, input.id)).limit(1);
      if (!zone) throw new TRPCError({ code: "NOT_FOUND", message: "Zone not found" });
      await requireReservationManagementAccess(ctx, zone.restaurantId);
      await db.delete(reservationZones).where(eq(reservationZones.id, input.id));
      return { success: true };
    }),

  /**
   * Create a new reservation (public endpoint)
   */
  create: publicProcedure
    .input(z.object({
      restaurantId: z.number(),
      zoneId: z.number().optional(),
      customerName: z.string().min(2),
      customerEmail: z.string().email(),
      customerPhone: z.string().min(10),
      reservationDate: z.string(), // ISO date string
      partySize: z.number().min(1),
      specialRequests: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Convert date string to timestamp
      const reservationDate = new Date(input.reservationDate);
      
      // Generate confirmation token
      const confirmationToken = Math.random().toString(36).substring(2, 15) + 
                               Math.random().toString(36).substring(2, 15);
      
      // Get settings to check auto-confirm
      const settings = await db
        .select()
        .from(reservationSettings)
        .where(eq(reservationSettings.restaurantId, input.restaurantId))
        .limit(1);
      
      const autoConfirm = settings[0]?.autoConfirm || false;
      
      const result = await db.insert(reservations).values({
        ...input,
        reservationDate,
        confirmationToken,
        status: autoConfirm ? "confirmed" : "pending",
        confirmedAt: autoConfirm ? new Date() : undefined,
      });
      
      // TODO: Send confirmation email/WhatsApp
      
      return { 
        id: result[0].insertId,
        confirmationToken,
        status: autoConfirm ? "confirmed" : "pending",
      };
    }),

  /**
   * Get all reservations for a restaurant (dashboard)
   */
  getByRestaurant: restaurantOwnerProcedure
    .input(z.object({
      restaurantId: z.number(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      status: z.enum(["pending", "confirmed", "cancelled", "completed", "no_show"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await requireReservationManagementAccess(ctx, input.restaurantId);
      
      // Apply filters
      const conditions = [eq(reservations.restaurantId, input.restaurantId)];
      
      if (input.startDate) {
        conditions.push(gte(reservations.reservationDate, new Date(input.startDate)));
      }
      
      if (input.endDate) {
        conditions.push(lte(reservations.reservationDate, new Date(input.endDate)));
      }
      
      if (input.status) {
        conditions.push(eq(reservations.status, input.status));
      }
      
      const results = await db
        .select()
        .from(reservations)
        .where(and(...conditions))
        .orderBy(desc(reservations.reservationDate));
      
      return results;
    }),

  /**
   * Update reservation status
   */
  updateStatus: restaurantOwnerProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending", "confirmed", "cancelled", "completed", "no_show"]),
      cancellationReason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const { id, status, cancellationReason } = input;
      const [reservation] = await db.select({ restaurantId: reservations.restaurantId }).from(reservations).where(eq(reservations.id, id)).limit(1);
      if (!reservation) throw new TRPCError({ code: "NOT_FOUND", message: "Reservation not found" });
      await requireReservationManagementAccess(ctx, reservation.restaurantId);
      
      const updates: any = { status };
      
      if (status === "confirmed") {
        updates.confirmedAt = new Date();
      } else if (status === "cancelled") {
        updates.cancelledAt = new Date();
        if (cancellationReason) {
          updates.cancellationReason = cancellationReason;
        }
      }
      
      await db
        .update(reservations)
        .set(updates)
        .where(eq(reservations.id, id));
      
      // TODO: Send notification email/WhatsApp
      
      return { success: true };
    }),

  /**
   * Get available time slots for a specific date
   */
  getAvailableSlots: publicProcedure
    .input(z.object({
      restaurantId: z.number(),
      date: z.string(), // ISO date string (YYYY-MM-DD)
      partySize: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Get restaurant settings
      const settings = await db
        .select()
        .from(reservationSettings)
        .where(eq(reservationSettings.restaurantId, input.restaurantId))
        .limit(1);
      
      if (!settings[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reservation settings not found",
        });
      }
      
      const { slotDuration } = settings[0];
      
      // TODO: Implement slot availability logic based on:
      // - Opening hours for the day
      // - Existing reservations
      // - Zone capacities
      // For now, return mock slots
      
      const slots = [
        "12:00", "12:30", "13:00", "13:30",
        "19:00", "19:30", "20:00", "20:30", "21:00"
      ];
      
      return slots;
    }),
});
