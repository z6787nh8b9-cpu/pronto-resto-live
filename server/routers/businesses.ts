import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { randomUUID } from "crypto";
import { z } from "zod";
import {
  businesses,
  businessMembers,
  businessOnboarding,
  businessProfiles,
  catalogCollections,
  catalogItems,
  catalogs,
  mediaAssets,
  restaurantOwners,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { adminProcedure, publicProcedure, restaurantOwnerProcedure, router } from "../_core/trpc";
import type { TrpcContext } from "../_core/context";
import { storagePut } from "../storage";
import { acceptedMediaTypes, hasValidMediaSignature } from "../media-validation";

const businessVertical = z.enum(["restaurant", "beauty", "retail", "service", "events", "other"]);
const catalogType = z.enum(["menu", "services", "products", "price_list", "portfolio", "events"]);
const catalogStatus = z.enum(["draft", "published", "archived"]);
const onboardingSteps = z.enum(["business_type", "catalog", "media", "profile", "publish"]);
const acceptedMediaTypeSchema = z.enum(acceptedMediaTypes);

function isPlatformAdmin(ctx: TrpcContext) {
  return Boolean(ctx.adminAccount || ctx.user?.role === "admin");
}

export async function requireBusinessAccess(ctx: TrpcContext, businessId: number) {
  if (isPlatformAdmin(ctx)) return;
  if (!ctx.restaurantOwner) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Connexion requise." });
  }

  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

  const [membership] = await db
    .select({ id: businessMembers.id, role: businessMembers.role })
    .from(businessMembers)
    .where(and(
      eq(businessMembers.businessId, businessId),
      eq(businessMembers.principalType, "restaurant_owner"),
      eq(businessMembers.principalId, ctx.restaurantOwner.id),
      eq(businessMembers.status, "active"),
    ))
    .limit(1);

  if (!membership) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Vous n'avez pas accès à cette entreprise." });
  }
}

async function requireBusinessRoleManagement(ctx: TrpcContext, businessId: number) {
  if (isPlatformAdmin(ctx)) return;
  if (!ctx.restaurantOwner) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Connexion requise." });
  }

  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
  const [membership] = await db
    .select({ role: businessMembers.role })
    .from(businessMembers)
    .where(and(
      eq(businessMembers.businessId, businessId),
      eq(businessMembers.principalType, "restaurant_owner"),
      eq(businessMembers.principalId, ctx.restaurantOwner.id),
      eq(businessMembers.status, "active"),
    ))
    .limit(1);

  if (membership?.role !== "owner") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Seul le propriétaire peut gérer les membres." });
  }
}

const managedMemberRole = z.enum(["administrator", "editor", "publisher", "analyst", "support"]);

export const businessesRouter = router({
  /** Public identity: intentionally excludes owners, account IDs and internal statuses. */
  getPublicBySlug: publicProcedure
    .input(z.object({ slug: z.string().trim().min(2).max(100) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

      const [record] = await db
        .select({
          id: businesses.id,
          slug: businesses.slug,
          name: businesses.name,
          vertical: businesses.vertical,
          profile: {
            displayName: businessProfiles.displayName,
            shortDescription: businessProfiles.shortDescription,
            email: businessProfiles.email,
            phone: businessProfiles.phone,
            whatsapp: businessProfiles.whatsapp,
            address: businessProfiles.address,
            logoUrl: businessProfiles.logoUrl,
            heroImageUrl: businessProfiles.heroImageUrl,
            primaryColor: businessProfiles.primaryColor,
            accentColor: businessProfiles.accentColor,
            fontFamily: businessProfiles.fontFamily,
            locale: businessProfiles.locale,
            socialLinks: businessProfiles.socialLinks,
            seoTitle: businessProfiles.seoTitle,
            seoDescription: businessProfiles.seoDescription,
          },
        })
        .from(businesses)
        .leftJoin(businessProfiles, eq(businessProfiles.businessId, businesses.id))
        .where(and(eq(businesses.slug, input.slug), eq(businesses.status, "published"), eq(businesses.isActive, true)))
        .limit(1);

      if (!record) throw new TRPCError({ code: "NOT_FOUND", message: "Entreprise introuvable." });
      return record;
    }),

  getByLegacyRestaurant: restaurantOwnerProcedure
    .input(z.object({ restaurantId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [business] = await db.select().from(businesses).where(eq(businesses.legacyRestaurantId, input.restaurantId)).limit(1);
      if (!business) throw new TRPCError({ code: "NOT_FOUND", message: "Entreprise introuvable." });
      await requireBusinessAccess(ctx, business.id);
      return business;
    }),

  listMine: restaurantOwnerProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

    if (isPlatformAdmin(ctx)) {
      return db.select().from(businesses).orderBy(desc(businesses.updatedAt));
    }

    if (!ctx.restaurantOwner) return [];
    return db
      .select({
        id: businesses.id,
        slug: businesses.slug,
        name: businesses.name,
        vertical: businesses.vertical,
        status: businesses.status,
        subscriptionTier: businesses.subscriptionTier,
        updatedAt: businesses.updatedAt,
        role: businessMembers.role,
      })
      .from(businessMembers)
      .innerJoin(businesses, eq(businesses.id, businessMembers.businessId))
      .where(and(
        eq(businessMembers.principalType, "restaurant_owner"),
        eq(businessMembers.principalId, ctx.restaurantOwner.id),
        eq(businessMembers.status, "active"),
      ))
      .orderBy(desc(businesses.updatedAt));
  }),

  getWorkspace: restaurantOwnerProcedure
    .input(z.object({ businessId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await requireBusinessAccess(ctx, input.businessId);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

      const [business] = await db.select().from(businesses).where(eq(businesses.id, input.businessId)).limit(1);
      if (!business) throw new TRPCError({ code: "NOT_FOUND", message: "Entreprise introuvable." });

      const [profile] = await db.select().from(businessProfiles).where(eq(businessProfiles.businessId, input.businessId)).limit(1);
      const businessCatalogs = await db.select().from(catalogs).where(eq(catalogs.businessId, input.businessId)).orderBy(asc(catalogs.displayOrder));
      return { business, profile: profile ?? null, catalogs: businessCatalogs };
    }),

  listMembers: restaurantOwnerProcedure
    .input(z.object({ businessId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await requireBusinessRoleManagement(ctx, input.businessId);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

      return db
        .select({
          id: businessMembers.id,
          principalType: businessMembers.principalType,
          principalId: businessMembers.principalId,
          role: businessMembers.role,
          status: businessMembers.status,
          joinedAt: businessMembers.joinedAt,
          createdAt: businessMembers.createdAt,
          name: restaurantOwners.name,
          email: restaurantOwners.email,
        })
        .from(businessMembers)
        .leftJoin(restaurantOwners, and(
          eq(restaurantOwners.id, businessMembers.principalId),
          eq(businessMembers.principalType, "restaurant_owner"),
        ))
        .where(eq(businessMembers.businessId, input.businessId))
        .orderBy(asc(businessMembers.createdAt));
    }),

  updateMember: restaurantOwnerProcedure
    .input(z.object({
      businessId: z.number().int().positive(),
      memberId: z.number().int().positive(),
      role: managedMemberRole.optional(),
      status: z.enum(["active", "suspended"]).optional(),
    }).refine((value) => value.role !== undefined || value.status !== undefined, {
      message: "Aucune modification de membre demandée.",
    }))
    .mutation(async ({ ctx, input }) => {
      await requireBusinessRoleManagement(ctx, input.businessId);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

      const [member] = await db
        .select()
        .from(businessMembers)
        .where(and(eq(businessMembers.id, input.memberId), eq(businessMembers.businessId, input.businessId)))
        .limit(1);
      if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "Membre introuvable." });
      if (member.role === "owner") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Le propriétaire ne peut pas être modifié depuis cette action." });
      }

      const changes = {
        ...(input.role ? { role: input.role } : {}),
        ...(input.status ? { status: input.status } : {}),
      };
      await db.update(businessMembers).set(changes).where(eq(businessMembers.id, member.id));
      const [updated] = await db.select().from(businessMembers).where(eq(businessMembers.id, member.id)).limit(1);
      return updated!;
    }),

  create: adminProcedure
    .input(z.object({
      slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(2).max(100),
      name: z.string().trim().min(2).max(255),
      vertical: businessVertical,
      description: z.string().trim().max(4_000).optional(),
      subscriptionTier: z.enum(["menu", "pro", "premium"]).default("menu"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

      const created = await db.insert(businesses).values({
        slug: input.slug,
        name: input.name,
        vertical: input.vertical,
        subscriptionTier: input.subscriptionTier,
        status: "draft",
      });
      const businessId = Number(created[0].insertId);
      await db.insert(businessProfiles).values({
        businessId,
        displayName: input.name,
        shortDescription: input.description ?? null,
        socialLinks: {},
      });
      const [business] = await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1);
      return business!;
    }),

  updateProfile: restaurantOwnerProcedure
    .input(z.object({
      businessId: z.number().int().positive(),
      displayName: z.string().trim().min(2).max(255).optional(),
      shortDescription: z.string().trim().max(4_000).nullable().optional(),
      email: z.string().trim().email().max(320).nullable().optional(),
      phone: z.string().trim().max(32).nullable().optional(),
      whatsapp: z.string().trim().max(32).nullable().optional(),
      address: z.string().trim().max(2_000).nullable().optional(),
      logoUrl: z.string().url().max(2_000).nullable().optional(),
      heroImageUrl: z.string().url().max(2_000).nullable().optional(),
      primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      locale: z.string().trim().min(2).max(10).optional(),
      socialLinks: z.record(z.string().max(40), z.string().url().max(2_000)).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireBusinessAccess(ctx, input.businessId);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

      const { businessId, ...profile } = input;
      await db.insert(businessProfiles).values({ businessId, ...profile }).onDuplicateKeyUpdate({ set: profile });
      const [updated] = await db.select().from(businessProfiles).where(eq(businessProfiles.businessId, businessId)).limit(1);
      return updated!;
    }),

  createCatalog: restaurantOwnerProcedure
    .input(z.object({
      businessId: z.number().int().positive(),
      slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(2).max(100),
      name: z.string().trim().min(2).max(255),
      type: catalogType,
      description: z.string().trim().max(4_000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireBusinessAccess(ctx, input.businessId);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

      const created = await db.insert(catalogs).values({
        businessId: input.businessId,
        slug: input.slug,
        name: input.name,
        type: input.type,
        description: input.description ?? null,
        status: "draft",
        source: "manual",
      });
      const [catalog] = await db.select().from(catalogs).where(eq(catalogs.id, Number(created[0].insertId))).limit(1);
      return catalog!;
    }),

  listCatalogContent: restaurantOwnerProcedure
    .input(z.object({ businessId: z.number().int().positive(), catalogId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await requireBusinessAccess(ctx, input.businessId);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

      const [catalog] = await db.select().from(catalogs).where(and(eq(catalogs.id, input.catalogId), eq(catalogs.businessId, input.businessId))).limit(1);
      if (!catalog) throw new TRPCError({ code: "NOT_FOUND", message: "Catalogue introuvable." });

      const collections = await db.select().from(catalogCollections).where(eq(catalogCollections.catalogId, input.catalogId)).orderBy(asc(catalogCollections.displayOrder));
      const items = await db.select().from(catalogItems).where(eq(catalogItems.catalogId, input.catalogId)).orderBy(asc(catalogItems.displayOrder));
      return { catalog, collections, items };
    }),

  getOnboarding: restaurantOwnerProcedure
    .input(z.object({ businessId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await requireBusinessAccess(ctx, input.businessId);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [record] = await db.select().from(businessOnboarding).where(eq(businessOnboarding.businessId, input.businessId)).limit(1);
      return record ?? null;
    }),

  updateOnboarding: restaurantOwnerProcedure
    .input(z.object({
      businessId: z.number().int().positive(),
      industry: businessVertical.optional(),
      primaryGoal: z.string().trim().min(2).max(120).optional(),
      completedSteps: z.array(onboardingSteps).max(5).optional(),
      status: z.enum(["not_started", "in_progress", "completed"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireBusinessAccess(ctx, input.businessId);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const { businessId, status, ...changes } = input;
      const completion = status === "completed" ? new Date() : null;
      await db.insert(businessOnboarding).values({
        businessId,
        industry: changes.industry ?? null,
        primaryGoal: changes.primaryGoal ?? null,
        completedSteps: changes.completedSteps ?? [],
        status: status ?? "in_progress",
        completedAt: completion,
      }).onDuplicateKeyUpdate({ set: { ...changes, ...(status ? { status } : {}), completedAt: completion } });
      const [updated] = await db.select().from(businessOnboarding).where(eq(businessOnboarding.businessId, businessId)).limit(1);
      return updated!;
    }),

  listMedia: restaurantOwnerProcedure
    .input(z.object({ businessId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await requireBusinessAccess(ctx, input.businessId);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      return db.select().from(mediaAssets).where(and(eq(mediaAssets.businessId, input.businessId), isNull(mediaAssets.archivedAt))).orderBy(desc(mediaAssets.createdAt));
    }),

  listArchivedMedia: restaurantOwnerProcedure
    .input(z.object({ businessId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await requireBusinessAccess(ctx, input.businessId);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      return db.select().from(mediaAssets).where(and(eq(mediaAssets.businessId, input.businessId), isNotNull(mediaAssets.archivedAt))).orderBy(desc(mediaAssets.archivedAt));
    }),

  uploadMedia: restaurantOwnerProcedure
    .input(z.object({
      businessId: z.number().int().positive(),
      fileName: z.string().trim().min(1).max(255),
      mimeType: acceptedMediaTypeSchema,
      base64: z.string().min(8).max(7_000_000),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireBusinessAccess(ctx, input.businessId);
      const bytes = Buffer.from(input.base64, "base64");
      if (!bytes.length || bytes.length > 5 * 1024 * 1024 || !hasValidMediaSignature(bytes, input.mimeType)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Le fichier est invalide, son format ne correspond pas ou il dépasse 5 Mo." });
      }
      const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-120);
      const stored = await storagePut(`businesses/${input.businessId}/media/${randomUUID()}-${safeName}`, bytes, input.mimeType);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const principalType = isPlatformAdmin(ctx) ? "admin" : "owner";
      const principalId = isPlatformAdmin(ctx) ? ctx.adminAccount?.id ?? ctx.user?.id ?? null : ctx.restaurantOwner?.id ?? null;
      const result = await db.insert(mediaAssets).values({
        businessId: input.businessId,
        uploadedByType: principalType,
        uploadedById: principalId,
        originalName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: bytes.length,
        storageKey: stored.key,
        url: stored.url,
      });
      const [asset] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, Number(result[0].insertId))).limit(1);
      return asset!;
    }),

  archiveMedia: restaurantOwnerProcedure
    .input(z.object({ businessId: z.number().int().positive(), assetId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await requireBusinessAccess(ctx, input.businessId);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [asset] = await db.select().from(mediaAssets).where(and(eq(mediaAssets.id, input.assetId), eq(mediaAssets.businessId, input.businessId), isNull(mediaAssets.archivedAt))).limit(1);
      if (!asset) throw new TRPCError({ code: "NOT_FOUND", message: "Média introuvable." });
      await db.update(mediaAssets).set({ archivedAt: new Date() }).where(eq(mediaAssets.id, asset.id));
      return { success: true };
    }),

  restoreMedia: restaurantOwnerProcedure
    .input(z.object({ businessId: z.number().int().positive(), assetId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await requireBusinessAccess(ctx, input.businessId);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [asset] = await db.select().from(mediaAssets).where(and(eq(mediaAssets.id, input.assetId), eq(mediaAssets.businessId, input.businessId), isNotNull(mediaAssets.archivedAt))).limit(1);
      if (!asset) throw new TRPCError({ code: "NOT_FOUND", message: "Média archivé introuvable." });
      await db.update(mediaAssets).set({ archivedAt: null }).where(eq(mediaAssets.id, asset.id));
      return { success: true };
    }),
});
