import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { adminProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { advertisements, adminInvitations, adminAccounts } from "../../drizzle/schema";
import { randomBytes } from "crypto";
import { eq, sql } from "drizzle-orm";
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
        ownerId: z.number().nullable().optional(),
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
        description: z.string().optional(),
        format: z.enum(["pastille", "footer", "fullpage", "popup", "dish_item"]),
        imageUrl: z.string().optional(),
        linkUrl: z.string().optional(),
        targetPage: z.enum(["landing", "restaurant_page", "menu", "all"]).default("all"),
        content: z.any().optional(),
        displayOrder: z.number().default(0),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [ad] = await db.insert(advertisements).values({
        title: input.title,
        description: input.description,
        format: input.format,
        imageUrl: input.imageUrl,
        linkUrl: input.linkUrl,
        targetPage: input.targetPage,
        content: input.content || {},
        displayOrder: input.displayOrder,
        isActive: true,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
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
          description: z.string().optional(),
          format: z.enum(["pastille", "footer", "fullpage", "popup", "dish_item"]).optional(),
          imageUrl: z.string().optional(),
          linkUrl: z.string().optional(),
          targetPage: z.enum(["landing", "restaurant_page", "menu", "all"]).optional(),
          content: z.any().optional(),
          displayOrder: z.number().optional(),
          isActive: z.boolean().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const updateData: any = { ...input.data };
      if (input.data.startDate !== undefined) {
        updateData.startDate = input.data.startDate ? new Date(input.data.startDate) : null;
      }
      if (input.data.endDate !== undefined) {
        updateData.endDate = input.data.endDate ? new Date(input.data.endDate) : null;
      }
      await db.update(advertisements).set(updateData).where(eq(advertisements.id, input.id));

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

  // ===== ADMIN MANAGEMENT =====

  // List local PRONTO Super Admin accounts only.
  listAdmins: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Local email/password administration is the only active model.
    const emailAdmins = await db.select({
      id: adminAccounts.id,
      email: adminAccounts.email,
      name: adminAccounts.name,
      createdAt: adminAccounts.createdAt,
      lastSignedIn: adminAccounts.lastSignedIn,
      source: sql<string>`'email'`,
    }).from(adminAccounts);

    return emailAdmins.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }),

  // Legacy platform promotions are intentionally disabled during decoupling.
  promoteToAdmin: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Utilisez les invitations Super Admin PRONTO pour créer un accès local." });
    }),

  // Legacy platform demotions are intentionally disabled during decoupling.
  demoteToUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Les comptes plateforme ne font plus partie des accès PRONTO." });
    }),

  // No platform identities are listed or promoted in PRONTO.
  listAllUsers: adminProcedure.query(async () => {
    return [] as Array<{ id: number; name: string | null; email: string | null; role: "user" | "admin" }>;
  }),

  // Generate admin invitation link (no email required)
  generateAdminInvitation: adminProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Generate unique token
      const token = randomBytes(32).toString('hex');
      
      // Set expiration to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create invitation
      await db.insert(adminInvitations).values({
        token,
        expiresAt,
        createdBy: ctx.adminAccount!.id,
      });

      return { success: true, token };
    }),

  // List admin invitations
  listAdminInvitations: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const invitations = await db.select().from(adminInvitations).orderBy(adminInvitations.createdAt);
    return invitations;
  }),

  // Delete/revoke admin invitation
  revokeAdminInvitation: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.delete(adminInvitations).where(eq(adminInvitations.id, input.id));
      return { success: true };
    }),

  // Check invitation validity (public procedure)
  checkAdminInvitation: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [invitation] = await db.select().from(adminInvitations)
        .where(eq(adminInvitations.token, input.token))
        .limit(1);

      if (!invitation) {
        return { valid: false, reason: "invalid" };
      }

      if (invitation.usedAt) {
        return { valid: false, reason: "used" };
      }

      if (new Date(invitation.expiresAt) < new Date()) {
        return { valid: false, reason: "expired" };
      }

      return { valid: true };
    }),

  // The historical invitation acceptance expected a platform identity. It is
  // deliberately disabled until a local email/password acceptance flow ships.
  acceptAdminInvitation: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input, ctx }) => {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Le parcours d’invitation hérité est désactivé pendant la migration vers les comptes PRONTO locaux." });
    }),
});
