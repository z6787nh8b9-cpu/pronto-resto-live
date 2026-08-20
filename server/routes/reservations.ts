import { z } from "zod";
import { publicProcedure, restaurantOwnerProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { openingHours, reservations, reservationZones, reservationSettings, restaurants } from "../../drizzle/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { randomBytes } from "crypto";
import { verifyRecaptcha } from "../_core/recaptcha";

export const publicReservationSchema = z.object({
  restaurantId: z.number().int().positive(),
  zoneId: z.number().int().positive().optional(),
  customerName: z.string().trim().min(2).max(100),
  customerEmail: z.string().trim().email().max(254),
  customerPhone: z.string().trim().min(6).max(20),
  reservationDate: z.string().datetime({ offset: true }),
  partySize: z.number().int().min(1).max(20),
  specialRequests: z.string().trim().max(500).optional(),
  recaptchaToken: z.string().min(1),
});

const publicReservationIdSchema = z.object({ restaurantId: z.number().int().positive() });

async function requirePublicReservationRestaurant(restaurantId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  const [restaurant] = await db.select({ id: restaurants.id }).from(restaurants).where(and(
    eq(restaurants.id, restaurantId),
    eq(restaurants.isActive, true),
  )).limit(1);
  if (!restaurant) throw new TRPCError({ code: "NOT_FOUND", message: "Établissement indisponible." });
  return db;
}

function isSlotWithinOpeningHours(reservationDate: Date, opening: { isClosed: boolean; openTime: string | null; closeTime: string | null }, slotDuration: number) {
  if (opening.isClosed || !opening.openTime || !opening.closeTime) return false;
  const [openHour, openMinute] = opening.openTime.split(":").map(Number);
  const [closeHour, closeMinute] = opening.closeTime.split(":").map(Number);
  const slotMinutes = reservationDate.getHours() * 60 + reservationDate.getMinutes();
  const openMinutes = openHour * 60 + openMinute;
  const closeMinutes = closeHour * 60 + closeMinute;
  return slotMinutes >= openMinutes
    && slotMinutes + slotDuration <= closeMinutes
    && (slotMinutes - openMinutes) % slotDuration === 0
    && reservationDate.getSeconds() === 0
    && reservationDate.getMilliseconds() === 0;
}

async function requireReservationManagementAccess(ctx: any, restaurantId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  const [restaurant] = await db.select({ ownerId: restaurants.ownerId }).from(restaurants).where(eq(restaurants.id, restaurantId)).limit(1);
  if (!restaurant) throw new TRPCError({ code: "NOT_FOUND", message: "Restaurant not found" });
  const isPlatformAdmin = Boolean(ctx.adminAccount);
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
   * Get reservation settings for an authorized dashboard
   */
  getSettings: restaurantOwnerProcedure
    .input(publicReservationIdSchema)
    .query(async ({ input, ctx }) => {
      const db = await requireReservationManagementAccess(ctx, input.restaurantId);
      const [settings] = await db
        .select()
        .from(reservationSettings)
        .where(eq(reservationSettings.restaurantId, input.restaurantId))
        .limit(1);
      return settings || null;
    }),

  /** Public reservation settings needed only by the booking flow. */
  getPublicSettings: publicProcedure
    .input(publicReservationIdSchema)
    .query(async ({ input }) => {
      const db = await requirePublicReservationRestaurant(input.restaurantId);
      const [settings] = await db
        .select({
          slotDuration: reservationSettings.slotDuration,
          advanceBookingDays: reservationSettings.advanceBookingDays,
          minAdvanceHours: reservationSettings.minAdvanceHours,
          maxPartySize: reservationSettings.maxPartySize,
          autoConfirm: reservationSettings.autoConfirm,
          cancellationPolicy: reservationSettings.cancellationPolicy,
        })
        .from(reservationSettings)
        .where(eq(reservationSettings.restaurantId, input.restaurantId))
        .limit(1);

      return settings || null;
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
   * Get all zones for an authorized dashboard
   */
  getZones: restaurantOwnerProcedure
    .input(publicReservationIdSchema)
    .query(async ({ input, ctx }) => {
      const db = await requireReservationManagementAccess(ctx, input.restaurantId);
      const zones = await db
        .select()
        .from(reservationZones)
        .where(eq(reservationZones.restaurantId, input.restaurantId))
        .orderBy(reservationZones.displayOrder);
      return zones;
    }),

  /** Public, active zone list used by the booking flow. */
  getPublicZones: publicProcedure
    .input(publicReservationIdSchema)
    .query(async ({ input }) => {
      const db = await requirePublicReservationRestaurant(input.restaurantId);
      return db
        .select({ id: reservationZones.id, name: reservationZones.name, capacity: reservationZones.capacity })
        .from(reservationZones)
        .where(and(eq(reservationZones.restaurantId, input.restaurantId), eq(reservationZones.isActive, true)))
        .orderBy(reservationZones.displayOrder);
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
    .input(publicReservationSchema)
    .mutation(async ({ input }) => {
      const isHuman = await verifyRecaptcha(input.recaptchaToken, "create_reservation");
      if (!isHuman) throw new TRPCError({ code: "FORBIDDEN", message: "Vérification anti-spam refusée." });
      const db = await requirePublicReservationRestaurant(input.restaurantId);
      
      const reservationDate = new Date(input.reservationDate);
      if (Number.isNaN(reservationDate.getTime())) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Date de réservation invalide." });
      }
      
      // Generate confirmation token
      const confirmationToken = randomBytes(32).toString("base64url");
      
      const created = await db.transaction(async (tx) => {
        // Serializes capacity claims per restaurant while keeping other establishments independent.
        await tx.execute(sql`SELECT id FROM reservation_zones WHERE restaurantId = ${input.restaurantId} AND isActive = true FOR UPDATE`);
        const [config] = await tx.select().from(reservationSettings).where(eq(reservationSettings.restaurantId, input.restaurantId)).limit(1);
        if (!config) throw new TRPCError({ code: "BAD_REQUEST", message: "Les réservations ne sont pas configurées pour cet établissement." });
        if (input.partySize > config.maxPartySize) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Le nombre de personnes dépasse la capacité autorisée." });
        }
        const now = new Date();
        const earliest = new Date(now.getTime() + config.minAdvanceHours * 60 * 60 * 1000);
        const latest = new Date(now.getTime() + config.advanceBookingDays * 24 * 60 * 60 * 1000);
        if (reservationDate < earliest || reservationDate > latest) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Ce créneau ne respecte pas le délai de réservation de l'établissement." });
        }
        const [opening] = await tx.select().from(openingHours).where(and(
          eq(openingHours.restaurantId, input.restaurantId),
          eq(openingHours.dayOfWeek, reservationDate.getDay()),
        )).limit(1);
        if (!opening || !isSlotWithinOpeningHours(reservationDate, opening, config.slotDuration)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Ce créneau ne correspond pas aux horaires d’ouverture." });
        }
        const activeZones = await tx.select().from(reservationZones).where(and(eq(reservationZones.restaurantId, input.restaurantId), eq(reservationZones.isActive, true)));
        const selectedZone = input.zoneId ? activeZones.find((zone) => zone.id === input.zoneId) : null;
        if (input.zoneId && !selectedZone) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "La zone sélectionnée est indisponible." });
        }
        const capacity = selectedZone ? selectedZone.capacity : activeZones.reduce((total, zone) => total + zone.capacity, 0);
        if (capacity < input.partySize) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "La capacité disponible est insuffisante." });
        }
        const existingAtSlot = await tx.select({ partySize: reservations.partySize, status: reservations.status, zoneId: reservations.zoneId }).from(reservations).where(and(eq(reservations.restaurantId, input.restaurantId), eq(reservations.reservationDate, reservationDate)));
        const occupied = existingAtSlot.filter((reservation) => reservation.status !== "cancelled" && reservation.status !== "no_show" && (!selectedZone || reservation.zoneId === selectedZone.id)).reduce((total, reservation) => total + reservation.partySize, 0);
        if (occupied + input.partySize > capacity) {
          throw new TRPCError({ code: "CONFLICT", message: "Ce créneau n'est plus disponible pour ce nombre de personnes." });
        }
        const result = await tx.insert(reservations).values({
          restaurantId: input.restaurantId,
          zoneId: input.zoneId,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          partySize: input.partySize,
          specialRequests: input.specialRequests || undefined,
          reservationDate,
          confirmationToken,
          status: config.autoConfirm ? "confirmed" : "pending",
          confirmedAt: config.autoConfirm ? new Date() : undefined,
        });
        return { id: result[0].insertId, autoConfirm: config.autoConfirm };
      });

      // TODO: Send confirmation email/WhatsApp.
      return { 
        id: created.id,
        confirmationToken,
        status: created.autoConfirm ? "confirmed" : "pending",
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
      restaurantId: z.number().int().positive(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      partySize: z.number().int().min(1).max(20),
    }))
    .query(async ({ input }) => {
      const db = await requirePublicReservationRestaurant(input.restaurantId);
      
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
      
      const reservationDay = new Date(`${input.date}T00:00:00`);
      if (Number.isNaN(reservationDay.getTime()) || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Date de réservation invalide." });
      }
      const config = settings[0];
      if (input.partySize > config.maxPartySize) return [];
      const now = new Date();
      const earliest = new Date(now.getTime() + config.minAdvanceHours * 60 * 60 * 1000);
      const latest = new Date(now.getTime() + config.advanceBookingDays * 24 * 60 * 60 * 1000);
      if (reservationDay > latest) return [];

      const [opening] = await db.select().from(openingHours).where(and(eq(openingHours.restaurantId, input.restaurantId), eq(openingHours.dayOfWeek, reservationDay.getDay()))).limit(1);
      if (!opening || opening.isClosed || !opening.openTime || !opening.closeTime) return [];
      const zones = await db.select().from(reservationZones).where(and(eq(reservationZones.restaurantId, input.restaurantId), eq(reservationZones.isActive, true)));
      const capacity = zones.reduce((total, zone) => total + zone.capacity, 0);
      if (capacity < input.partySize) return [];

      const startOfDay = new Date(`${input.date}T00:00:00`);
      const endOfDay = new Date(`${input.date}T23:59:59.999`);
      const existing = await db.select({ reservationDate: reservations.reservationDate, partySize: reservations.partySize, status: reservations.status }).from(reservations).where(and(eq(reservations.restaurantId, input.restaurantId), gte(reservations.reservationDate, startOfDay), lte(reservations.reservationDate, endOfDay)));
      const occupancy = new Map<number, number>();
      for (const entry of existing) {
        if (entry.status === "cancelled" || entry.status === "no_show") continue;
        const key = entry.reservationDate.getTime();
        occupancy.set(key, (occupancy.get(key) || 0) + entry.partySize);
      }
      const [openHour, openMinute] = opening.openTime.split(":").map(Number);
      const [closeHour, closeMinute] = opening.closeTime.split(":").map(Number);
      const openAt = new Date(`${input.date}T00:00:00`); openAt.setHours(openHour, openMinute, 0, 0);
      const closeAt = new Date(`${input.date}T00:00:00`); closeAt.setHours(closeHour, closeMinute, 0, 0);
      const slots: string[] = [];
      for (let cursor = new Date(openAt); cursor.getTime() + config.slotDuration * 60_000 <= closeAt.getTime(); cursor = new Date(cursor.getTime() + config.slotDuration * 60_000)) {
        const occupied = occupancy.get(cursor.getTime()) || 0;
        if (cursor >= earliest && occupied + input.partySize <= capacity) slots.push(cursor.toTimeString().slice(0, 5));
      }
      return slots;
    }),
});
