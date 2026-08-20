import { z } from "zod";
import { randomBytes } from "crypto";
import { publicProcedure, restaurantOwnerProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { events, eventRegistrations, restaurants } from "../../drizzle/schema";
import { eq, and, gte, desc, gt, isNull, or, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { verifyRecaptcha } from "../_core/recaptcha";
import { requireSubscriptionFeature } from "../subscription-access";

export const publicEventRegistrationSchema = z.object({
  eventId: z.number().int().positive(),
  restaurantId: z.number().int().positive(),
  customerName: z.string().trim().min(2).max(100),
  customerEmail: z.string().trim().email().max(254),
  customerPhone: z.string().trim().min(6).max(20),
  numberOfPeople: z.number().int().min(1).max(20),
  specialRequests: z.string().trim().max(500).optional(),
  recaptchaToken: z.string().min(1),
});

export const eventsRouter = router({
  // Public: Get all published events for a restaurant
  getPublicEvents: publicProcedure
    .input(z.object({ restaurantId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [restaurant] = await db.select({ id: restaurants.id, subscriptionTier: restaurants.subscriptionTier }).from(restaurants).where(and(
        eq(restaurants.id, input.restaurantId),
        eq(restaurants.isActive, true),
      )).limit(1);
      if (!restaurant || restaurant.subscriptionTier !== "premium") return [];

      const now = new Date();
      const eventsList = await db
        .select()
        .from(events)
        .where(
          and(
            eq(events.restaurantId, input.restaurantId),
            eq(events.status, "published"),
            eq(events.isVisible, true),
            gte(events.eventDate, now)
          )
        )
        .orderBy(events.eventDate);

      return eventsList;
    }),

  // Public: Get a single event by ID
  getEvent: publicProcedure
    .input(z.object({ eventId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const now = new Date();
      const [event] = await db.select().from(events).where(and(
        eq(events.id, input.eventId),
        eq(events.status, "published"),
        eq(events.isVisible, true),
        gte(events.eventDate, now),
      ));
      if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });

      const [restaurant] = await db.select({ id: restaurants.id, subscriptionTier: restaurants.subscriptionTier }).from(restaurants).where(and(
        eq(restaurants.id, event.restaurantId),
        eq(restaurants.isActive, true),
      )).limit(1);
      if (!restaurant || restaurant.subscriptionTier !== "premium") throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });

      return event;
    }),

  // Public: Register for an event
  registerForEvent: publicProcedure
    .input(publicEventRegistrationSchema)
    .mutation(async ({ input }) => {
      const isHuman = await verifyRecaptcha(input.recaptchaToken, "register_for_event");
      if (!isHuman) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Vérification anti-spam refusée." });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Get event details
      const [event] = await db.select().from(events).where(eq(events.id, input.eventId));
      if (!event || event.restaurantId !== input.restaurantId || event.status !== "published" || !event.isVisible || event.eventDate <= new Date()) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Événement indisponible." });
      }

      const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, event.restaurantId)).limit(1);
      if (!restaurant?.isActive || restaurant.subscriptionTier !== "premium") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Événement indisponible." });
      }

      // Check registration deadline
      if (event.registrationDeadline && new Date() > event.registrationDeadline) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Registration deadline has passed" });
      }

      return await db.transaction(async (tx) => {
        const now = new Date();
        const capacityClaim = await tx
          .update(events)
          .set({ currentAttendees: sql`${events.currentAttendees} + ${input.numberOfPeople}` })
          .where(
            and(
              eq(events.id, input.eventId),
              eq(events.restaurantId, input.restaurantId),
              eq(events.status, "published"),
              eq(events.isVisible, true),
              gt(events.eventDate, now),
              or(isNull(events.registrationDeadline), gt(events.registrationDeadline, now)),
              sql`${events.currentAttendees} + ${input.numberOfPeople} <= ${events.maxAttendees}`
            )
          );

        if (Number(capacityClaim[0]?.affectedRows) !== 1) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Événement complet ou indisponible." });
        }

        const [registration] = await tx.insert(eventRegistrations).values({
          eventId: input.eventId,
          restaurantId: event.restaurantId,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          numberOfPeople: input.numberOfPeople,
          specialRequests: input.specialRequests || null,
          status: event.requiresApproval ? "pending" : "confirmed",
          paymentStatus: parseFloat(event.price) > 0 ? "pending" : "paid",
          paymentAmount: event.price,
          confirmationToken: randomBytes(32).toString("base64url"),
          confirmedAt: event.requiresApproval ? null : new Date(),
        });

        return registration;
      });
    }),

  // Protected: Get all events for restaurant owner
  getEvents: restaurantOwnerProcedure
    .input(z.object({ restaurantId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, input.restaurantId)).limit(1);
      const isAdmin = Boolean(ctx.adminAccount);
      if (!restaurant || (!isAdmin && restaurant.ownerId !== ctx.restaurantOwner?.id)) throw new TRPCError({ code: "FORBIDDEN" });
      requireSubscriptionFeature(ctx, restaurant.subscriptionTier, "premium");

      const eventsList = await db
        .select()
        .from(events)
        .where(eq(events.restaurantId, input.restaurantId))
        .orderBy(desc(events.eventDate));

      return eventsList;
    }),

  // Protected: Create a new event
  createEvent: restaurantOwnerProcedure
    .input(
      z.object({
        restaurantId: z.number().int().positive(),
        title: z.string().trim().min(1).max(200),
        description: z.string().trim().min(1).max(5_000),
        imageUrl: z.string().url().max(2_000).optional(),
        eventDate: z.string().datetime({ offset: true }),
        duration: z.number().int().min(15).max(1_440).default(120),
        maxAttendees: z.number().int().min(1).max(20_000),
        price: z.number().min(0).max(100_000).default(0),
        requiresApproval: z.boolean().default(false),
        registrationDeadline: z.string().datetime({ offset: true }).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, input.restaurantId)).limit(1);
      const isAdmin = Boolean(ctx.adminAccount);
      if (!restaurant || (!isAdmin && restaurant.ownerId !== ctx.restaurantOwner?.id)) throw new TRPCError({ code: "FORBIDDEN" });
      requireSubscriptionFeature(ctx, restaurant.subscriptionTier, "premium");

      const [event] = await db.insert(events).values({
        restaurantId: input.restaurantId,
        title: input.title,
        description: input.description,
        imageUrl: input.imageUrl || null,
        eventDate: new Date(input.eventDate),
        duration: input.duration,
        maxAttendees: input.maxAttendees,
        price: input.price.toString(),
        requiresApproval: input.requiresApproval,
        registrationDeadline: input.registrationDeadline ? new Date(input.registrationDeadline) : null,
        status: "draft",
      });

      return event;
    }),

  // Protected: Update an event
  updateEvent: restaurantOwnerProcedure
    .input(
      z.object({
        eventId: z.number().int().positive(),
        data: z.object({
          title: z.string().trim().min(1).max(200).optional(),
          description: z.string().trim().min(1).max(5_000).optional(),
          imageUrl: z.string().url().max(2_000).optional(),
          eventDate: z.string().datetime({ offset: true }).optional(),
          duration: z.number().int().min(15).max(1_440).optional(),
          maxAttendees: z.number().int().min(1).max(20_000).optional(),
          price: z.number().min(0).max(100_000).optional(),
          status: z.enum(["draft", "published", "cancelled", "completed"]).optional(),
          isVisible: z.boolean().optional(),
          requiresApproval: z.boolean().optional(),
          registrationDeadline: z.string().datetime({ offset: true }).optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const [event] = await db.select().from(events).where(eq(events.id, input.eventId)).limit(1);
      const [restaurant] = event ? await db.select().from(restaurants).where(eq(restaurants.id, event.restaurantId)).limit(1) : [];
      const isAdmin = Boolean(ctx.adminAccount);
      if (!restaurant || (!isAdmin && restaurant.ownerId !== ctx.restaurantOwner?.id)) throw new TRPCError({ code: "FORBIDDEN" });
      requireSubscriptionFeature(ctx, restaurant.subscriptionTier, "premium");
      if (input.data.maxAttendees !== undefined && input.data.maxAttendees < event.currentAttendees) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "La capacité ne peut pas être inférieure aux inscriptions existantes." });
      }

      const updateData: any = {};
      if (input.data.title) updateData.title = input.data.title;
      if (input.data.description) updateData.description = input.data.description;
      if (input.data.imageUrl !== undefined) updateData.imageUrl = input.data.imageUrl || null;
      if (input.data.eventDate) updateData.eventDate = new Date(input.data.eventDate);
      if (input.data.duration) updateData.duration = input.data.duration;
      if (input.data.maxAttendees) updateData.maxAttendees = input.data.maxAttendees;
      if (input.data.price !== undefined) updateData.price = input.data.price.toString();
      if (input.data.status) updateData.status = input.data.status;
      if (input.data.isVisible !== undefined) updateData.isVisible = input.data.isVisible;
      if (input.data.requiresApproval !== undefined) updateData.requiresApproval = input.data.requiresApproval;
      if (input.data.registrationDeadline !== undefined)
        updateData.registrationDeadline = input.data.registrationDeadline
          ? new Date(input.data.registrationDeadline)
          : null;

      await db.update(events).set(updateData).where(eq(events.id, input.eventId));

      return { success: true };
    }),

  // Protected: Delete an event
  deleteEvent: restaurantOwnerProcedure
    .input(z.object({ eventId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const [event] = await db.select().from(events).where(eq(events.id, input.eventId)).limit(1);
      const [restaurant] = event ? await db.select().from(restaurants).where(eq(restaurants.id, event.restaurantId)).limit(1) : [];
      const isAdmin = Boolean(ctx.adminAccount);
      if (!restaurant || (!isAdmin && restaurant.ownerId !== ctx.restaurantOwner?.id)) throw new TRPCError({ code: "FORBIDDEN" });
      requireSubscriptionFeature(ctx, restaurant.subscriptionTier, "premium");

      // Delete all registrations first
      await db.delete(eventRegistrations).where(eq(eventRegistrations.eventId, input.eventId));

      // Delete the event
      await db.delete(events).where(eq(events.id, input.eventId));

      return { success: true };
    }),

  // Protected: Get all registrations for an event
  getEventRegistrations: restaurantOwnerProcedure
    .input(z.object({ eventId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const [event] = await db.select().from(events).where(eq(events.id, input.eventId)).limit(1);
      const [restaurant] = event ? await db.select().from(restaurants).where(eq(restaurants.id, event.restaurantId)).limit(1) : [];
      const isAdmin = Boolean(ctx.adminAccount);
      if (!restaurant || (!isAdmin && restaurant.ownerId !== ctx.restaurantOwner?.id)) throw new TRPCError({ code: "FORBIDDEN" });
      requireSubscriptionFeature(ctx, restaurant.subscriptionTier, "premium");

      const registrations = await db
        .select()
        .from(eventRegistrations)
        .where(eq(eventRegistrations.eventId, input.eventId))
        .orderBy(desc(eventRegistrations.createdAt));

      return registrations;
    }),

  // Protected: Update registration status
  updateRegistrationStatus: restaurantOwnerProcedure
    .input(
      z.object({
        registrationId: z.number().int().positive(),
        status: z.enum(["pending", "confirmed", "cancelled", "attended", "no_show"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const [registration] = await db.select().from(eventRegistrations).where(eq(eventRegistrations.id, input.registrationId)).limit(1);
      const [event] = registration ? await db.select().from(events).where(eq(events.id, registration.eventId)).limit(1) : [];
      const [restaurant] = event ? await db.select().from(restaurants).where(eq(restaurants.id, event.restaurantId)).limit(1) : [];
      const isAdmin = Boolean(ctx.adminAccount);
      if (!restaurant || (!isAdmin && restaurant.ownerId !== ctx.restaurantOwner?.id)) throw new TRPCError({ code: "FORBIDDEN" });
      requireSubscriptionFeature(ctx, restaurant.subscriptionTier, "premium");

      await db
        .update(eventRegistrations)
        .set({
          status: input.status,
          confirmedAt: input.status === "confirmed" ? new Date() : null,
          cancelledAt: input.status === "cancelled" ? new Date() : null,
        })
        .where(eq(eventRegistrations.id, input.registrationId));

      return { success: true };
    }),
});
