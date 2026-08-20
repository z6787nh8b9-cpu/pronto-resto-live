/**
 * Invitations Router
 * Handles restaurant owner invitation system
 */

import { router, publicProcedure, adminProcedure, restaurantOwnerProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { invitations, restaurants } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { createOwnerInvitationToken, hashOwnerInvitationToken, OWNER_INVITATION_TOKEN_PATTERN } from "../owner-invitation-token";

export const invitationsRouter = router({
  /**
   * Create a new invitation for a restaurant (Super Admin only)
   */
  create: adminProcedure
    .input(
      z.object({
        restaurantId: z.number().int().positive(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Check if restaurant exists
      const [restaurant] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.id, input.restaurantId))
        .limit(1);

      if (!restaurant) {
        throw new Error("Restaurant not found");
      }

      // Generate unique token
      const token = createOwnerInvitationToken();

      // Set expiration to 24 hours from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Create invitation
      const [invitation] = await db.insert(invitations).values({
        restaurantId: input.restaurantId,
        tokenHash: hashOwnerInvitationToken(token),
        expiresAt,
        status: "pending",
      });

      // Return invitation with full URL
      const invitationUrl = `${process.env.FRONTEND_URL || "https://pronto.page"}/invite/${token}`;

      return {
        id: invitation.insertId,
        token,
        invitationUrl,
        expiresAt,
      };
    }),

  /**
   * Get invitation details by token
   */
  getByToken: publicProcedure
    .input(
      z.object({
        token: z.string().regex(OWNER_INVITATION_TOKEN_PATTERN),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const [invitation] = await db
        .select()
        .from(invitations)
        .where(eq(invitations.tokenHash, hashOwnerInvitationToken(input.token)))
        .limit(1);

      if (!invitation) {
        return { valid: false, reason: "not_found" };
      }

      // Check if expired
      const now = new Date();
      if (invitation.expiresAt < now) {
        return { valid: false, reason: "expired" };
      }

      if (invitation.status !== "pending") {
        return { valid: false, reason: "already_used" };
      }

      // Get restaurant details
      const [restaurant] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.id, invitation.restaurantId))
        .limit(1);

      return {
        valid: true,
        invitation: {
          id: invitation.id,
          status: invitation.status,
          expiresAt: invitation.expiresAt,
        },
        restaurant: restaurant
          ? { name: restaurant.name, slug: restaurant.slug }
          : null,
      };
    }),

  /**
   * List ALL invitations (Super Admin only)
   */
  listAll: adminProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Get all invitations with restaurant details
      const invitationsList = await db
        .select({
          id: invitations.id,
          restaurantId: invitations.restaurantId,
          restaurantName: restaurants.name,
          restaurantSlug: restaurants.slug,
          status: invitations.status,
          createdAt: invitations.createdAt,
          expiresAt: invitations.expiresAt,
          acceptedAt: invitations.acceptedAt,
          acceptedBy: invitations.acceptedBy,
        })
        .from(invitations)
        .leftJoin(restaurants, eq(invitations.restaurantId, restaurants.id))
        .orderBy(invitations.createdAt);

      return invitationsList;
    }),

  /**
   * List all invitations for a restaurant
   */
  listByRestaurant: restaurantOwnerProcedure
    .input(
      z.object({
        restaurantId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const [restaurant] = await db
        .select({ ownerId: restaurants.ownerId })
        .from(restaurants)
        .where(eq(restaurants.id, input.restaurantId))
        .limit(1);

      if (!restaurant) {
        throw new Error("Restaurant not found");
      }

      const isPlatformAdmin = Boolean(ctx.adminAccount);
      if (!isPlatformAdmin && restaurant.ownerId !== ctx.restaurantOwner?.id) {
        throw new Error("Forbidden");
      }

      const invitationsList = await db
        .select({
          id: invitations.id,
          restaurantId: invitations.restaurantId,
          status: invitations.status,
          acceptedBy: invitations.acceptedBy,
          acceptedAt: invitations.acceptedAt,
          expiresAt: invitations.expiresAt,
          createdAt: invitations.createdAt,
        })
        .from(invitations)
        .where(eq(invitations.restaurantId, input.restaurantId))
        .orderBy(invitations.createdAt);

      return invitationsList;
    }),
});
