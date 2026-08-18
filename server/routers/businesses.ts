import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  businesses,
  businessMembers,
  businessProfiles,
  catalogCollections,
  catalogItems,
  catalogs,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { adminProcedure, publicProcedure, restaurantOwnerProcedure, router } from "../_core/trpc";
import type { TrpcContext } from "../_core/context";

const businessVertical = z.enum(["restaurant", "beauty", "retail", "service", "events", "other"]);
const catalogType = z.enum(["menu", "services", "products", "price_list", "portfolio", "events"]);
const catalogStatus = z.enum(["draft", "published", "archived"]);

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
});
