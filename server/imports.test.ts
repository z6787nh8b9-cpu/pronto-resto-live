import { afterAll, describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { draftFromCsv } from "./routers/imports";
import { businesses, catalogCollections, catalogItems, catalogs, importJobRows, importJobs } from "../drizzle/schema";

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const integrationBusinessSlug = `import-test-${runId}`;

const anonymousCaller = appRouter.createCaller({
  adminAccount: null,
  user: null,
  restaurantOwner: null,
  req: { session: {} },
  res: {},
} as any);

const adminCaller = appRouter.createCaller({
  adminAccount: { id: 1, email: "test-admin@pronto.local" },
  user: null,
  restaurantOwner: null,
  req: { session: {} },
  res: {},
} as any);

afterAll(async () => {
  const db = await getDb();
  if (!db) return;
  const [business] = await db.select().from(businesses).where(eq(businesses.slug, integrationBusinessSlug)).limit(1);
  if (!business) return;
  const importedCatalogs = await db.select({ id: catalogs.id }).from(catalogs).where(eq(catalogs.businessId, business.id));
  for (const catalog of importedCatalogs) {
    await db.delete(catalogItems).where(eq(catalogItems.catalogId, catalog.id));
    await db.delete(catalogCollections).where(eq(catalogCollections.catalogId, catalog.id));
  }
  await db.delete(catalogs).where(eq(catalogs.businessId, business.id));
  const jobs = await db.select({ id: importJobs.id }).from(importJobs).where(eq(importJobs.businessId, business.id));
  for (const job of jobs) await db.delete(importJobRows).where(eq(importJobRows.importJobId, job.id));
  await db.delete(importJobs).where(eq(importJobs.businessId, business.id));
  await db.delete(businesses).where(eq(businesses.id, business.id));
});

describe("Controlled catalog imports", () => {
  it("parses French CSV headers into a reviewable draft without inventing data", () => {
    const input = Buffer.from(
      "Catégorie;Nom;Description;Prix;Durée\nSoins visage;Soin éclat;Nettoyage doux;49,90;60\nSoins visage;Massage express;;35;30\n",
      "utf8",
    );

    const result = draftFromCsv(input, "Carte des soins", "services");
    expect(result.draft.catalog).toEqual({ name: "Carte des soins", type: "services" });
    expect(result.draft.collections).toHaveLength(1);
    expect(result.draft.collections[0]).toMatchObject({ name: "Soins visage" });
    expect(result.draft.collections[0].items).toEqual([
      expect.objectContaining({ name: "Soin éclat", price: 49.9, durationMinutes: 60, confidence: 1 }),
      expect.objectContaining({ name: "Massage express", price: 35, durationMinutes: 30, confidence: 1 }),
    ]);
  });

  it("rejects import analysis before reading a file when the caller is anonymous", async () => {
    await expect(anonymousCaller.imports.analyze({
      businessId: 1,
      catalogName: "Test",
      catalogType: "services",
      sourceType: "csv",
      fileName: "test.csv",
      mimeType: "text/csv",
      base64Data: "data:text/csv;base64,Y2F0ZWdvcmllLG5vbSxwcml4ClRlc3QsSWl0ZW0sMTA=",
    })).rejects.toBeInstanceOf(TRPCError);
  });

  it("refuses malformed CSV files that do not provide an item name", () => {
    expect(() => draftFromCsv(Buffer.from("Prix;Durée\n10;30\n", "utf8"), "Test", "services"))
      .toThrow("Aucun nom d'élément");
  });

  it("applies a reviewed CSV draft only after explicit confirmation and keeps its catalog unpublished", async () => {
    const db = await getDb();
    expect(db).not.toBeNull();

    const businessResult = await db!.insert(businesses).values({
      slug: integrationBusinessSlug,
      name: "Espace import de validation",
      vertical: "beauty",
      status: "draft",
      subscriptionTier: "pro",
      subscriptionStatus: "trial",
    });
    const businessId = Number(businessResult[0].insertId);
    const { draft } = draftFromCsv(
      Buffer.from("Catégorie;Nom;Description;Prix;Durée\nSoins visage;Soin éclat;Nettoyage doux;49,90;60\n", "utf8"),
      "Catalogue de validation",
      "services",
    );
    const jobResult = await db!.insert(importJobs).values({
      businessId,
      sourceType: "csv",
      sourceFileName: "validation.csv",
      sourceMimeType: "text/csv",
      sourceUrl: "https://example.test/imports/validation.csv",
      status: "review_required",
      draft,
      validationErrors: [],
      createdByPrincipalType: "admin_account",
      createdByPrincipalId: 1,
    });
    const importJobId = Number(jobResult[0].insertId);

    const result = await adminCaller.imports.applyDraft({ businessId, importJobId });

    expect(result).toMatchObject({ status: "draft", published: false });
    const [catalog] = await db!.select().from(catalogs).where(eq(catalogs.id, result.catalogId)).limit(1);
    expect(catalog).toMatchObject({ businessId, name: "Catalogue de validation", type: "services", status: "draft", source: "csv_import" });
    const [collection] = await db!.select().from(catalogCollections).where(eq(catalogCollections.catalogId, result.catalogId)).limit(1);
    expect(collection).toMatchObject({ name: "Soins visage", status: "active" });
    const [item] = await db!.select().from(catalogItems).where(eq(catalogItems.catalogId, result.catalogId)).limit(1);
    expect(item).toMatchObject({ name: "Soin éclat", itemType: "service", status: "active" });
    const [job] = await db!.select().from(importJobs).where(eq(importJobs.id, importJobId)).limit(1);
    expect(job?.status).toBe("applied");
    const publishedCatalogs = await db!.select().from(catalogs).where(and(eq(catalogs.businessId, businessId), eq(catalogs.status, "published")));
    expect(publishedCatalogs).toHaveLength(0);
  });
});
