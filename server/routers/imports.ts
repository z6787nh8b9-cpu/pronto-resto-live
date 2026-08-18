import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  catalogCollections,
  catalogItems,
  catalogs,
  importJobRows,
  importJobs,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";
import { restaurantOwnerProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import { requireBusinessAccess } from "./businesses";

const catalogType = z.enum(["menu", "services", "products", "price_list", "portfolio", "events"]);
const sourceType = z.enum(["csv", "pdf", "image"]);

const draftItemSchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().max(4_000).nullable().optional(),
  price: z.number().nonnegative().nullable().optional(),
  priceType: z.enum(["fixed", "from", "range", "quote", "free"]).default("fixed"),
  priceMax: z.number().nonnegative().nullable().optional(),
  priceLabel: z.string().trim().max(100).nullable().optional(),
  durationMinutes: z.number().int().positive().nullable().optional(),
  confidence: z.number().min(0).max(1),
});

const draftSchema = z.object({
  catalog: z.object({ name: z.string().trim().min(1).max(255), type: catalogType }),
  collections: z.array(z.object({
    name: z.string().trim().min(1).max(255),
    description: z.string().trim().max(4_000).nullable().optional(),
    items: z.array(draftItemSchema),
  })).min(1),
});

type Draft = z.infer<typeof draftSchema>;
type DraftItem = z.infer<typeof draftItemSchema>;
type ImportRecord = { raw: Record<string, unknown>; normalized: DraftItem; rowNumber: number };

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 84) || "catalogue";
}

function decodeBase64(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "Le fichier doit être encodé en base64 valide." });
  return { mimeType: match[1].toLowerCase(), buffer: Buffer.from(match[2], "base64") };
}

function isSupportedBinary(source: z.infer<typeof sourceType>, mimeType: string, buffer: Buffer) {
  if (source === "csv") return ["text/csv", "application/vnd.ms-excel", "text/plain"].includes(mimeType) && buffer.length > 0;
  if (source === "pdf") return mimeType === "application/pdf" && buffer.subarray(0, 4).toString() === "%PDF";
  if (source === "image") {
    const isPng = buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const isJpeg = buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
    const isWebp = buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP";
    return (["image/jpeg", "image/png", "image/webp"].includes(mimeType) && (isPng || isJpeg || isWebp));
  }
  return false;
}

function csvRows(text: string) {
  const rows: string[][] = [];
  const delimiter = text.split(/\r?\n/, 1)[0].split(";").length > text.split(/\r?\n/, 1)[0].split(",").length ? ";" : ",";
  let value = "";
  let row: string[] = [];
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') { value += '"'; index += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (char === delimiter && !quoted) { row.push(value.trim()); value = ""; continue; }
    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value.trim());
      if (row.some(cell => cell.length > 0)) rows.push(row);
      row = []; value = ""; continue;
    }
    value += char;
  }
  row.push(value.trim());
  if (row.some(cell => cell.length > 0)) rows.push(row);
  return rows;
}

function normalizeHeader(value: string) {
  return slugify(value).replace(/-/g, "");
}

function findValue(record: Record<string, string>, aliases: string[]) {
  return aliases.map(normalizeHeader).map(alias => record[alias]).find(value => value !== undefined && value !== "")?.trim() || "";
}

function parsePrice(value: string) {
  const normalized = value.replace(/\s/g, "").replace(/€/g, "").replace(/,/g, ".").match(/\d+(?:\.\d{1,2})?/);
  return normalized ? Number(normalized[0]) : null;
}

export function draftFromCsv(buffer: Buffer, catalogName: string, type: z.infer<typeof catalogType>) {
  const rows = csvRows(buffer.toString("utf8").replace(/^\uFEFF/, ""));
  if (rows.length < 2) throw new TRPCError({ code: "BAD_REQUEST", message: "Le CSV doit contenir une ligne d'en-têtes et au moins une ligne de données." });

  const headers = rows[0].map(normalizeHeader);
  const groups = new Map<string, Draft["collections"][number]>();
  const records: ImportRecord[] = [];

  rows.slice(1).forEach((cells, position) => {
    const raw = Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
    const name = findValue(raw, ["name", "nom", "title", "titre", "produit", "service", "prestation", "designation"]);
    if (!name) return;
    const collectionName = findValue(raw, ["category", "categorie", "collection", "famille", "section"]) || "Sans catégorie";
    const description = findValue(raw, ["description", "details", "detail", "ingredients", "contenu"]) || null;
    const priceRaw = findValue(raw, ["price", "prix", "tarif", "montant"]);
    const durationRaw = findValue(raw, ["duration", "duree", "minutes", "temps"]);
    const normalized: DraftItem = {
      name,
      description,
      price: parsePrice(priceRaw),
      priceType: priceRaw ? "fixed" as const : "quote" as const,
      priceMax: null,
      priceLabel: null,
      durationMinutes: parsePrice(durationRaw),
      confidence: 1,
    };
    if (!groups.has(collectionName)) groups.set(collectionName, { name: collectionName, items: [] });
    groups.get(collectionName)!.items.push(normalized);
    records.push({ raw, normalized, rowNumber: position + 2 });
  });

  if (!records.length) throw new TRPCError({ code: "BAD_REQUEST", message: "Aucun nom d'élément n'a été trouvé dans le CSV." });
  return { draft: draftSchema.parse({ catalog: { name: catalogName, type }, collections: Array.from(groups.values()) }), records };
}

async function draftFromAi(sourceUrl: string, source: z.infer<typeof sourceType>, mimeType: string, catalogName: string, type: z.infer<typeof catalogType>) {
  const media = source === "image"
    ? { type: "image_url" as const, image_url: { url: sourceUrl, detail: "high" as const } }
    : { type: "file_url" as const, file_url: { url: sourceUrl, mime_type: "application/pdf" as const } };
  const response = await invokeLLM({
    model: "gemini-3-flash-preview",
    maxTokens: 12_000,
    messages: [{
      role: "user",
      content: [
        { type: "text", text: `Extract a business catalog from this ${source}. Do not invent items, prices or claims. Keep unavailable fields null. Use the requested catalog name "${catalogName}" and type "${type}". Group items into clearly visible collections. Return only the required JSON.` },
        media,
      ],
    }],
    outputSchema: {
      name: "catalog_import",
      strict: true,
      schema: {
        type: "object",
        properties: {
          catalog: { type: "object", properties: { name: { type: "string" }, type: { type: "string", enum: ["menu", "services", "products", "price_list", "portfolio", "events"] } }, required: ["name", "type"], additionalProperties: false },
          collections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" }, description: { type: ["string", "null"] },
                items: { type: "array", items: { type: "object", properties: {
                  name: { type: "string" }, description: { type: ["string", "null"] }, price: { type: ["number", "null"] },
                  priceType: { type: "string", enum: ["fixed", "from", "range", "quote", "free"] }, priceMax: { type: ["number", "null"] },
                  priceLabel: { type: ["string", "null"] }, durationMinutes: { type: ["number", "null"] }, confidence: { type: "number" },
                }, required: ["name", "description", "price", "priceType", "priceMax", "priceLabel", "durationMinutes", "confidence"], additionalProperties: false } },
              },
              required: ["name", "description", "items"],
              additionalProperties: false,
            },
          },
        },
        required: ["catalog", "collections"],
        additionalProperties: false,
      },
    },
  });
  const content = response.choices[0]?.message.content;
  if (typeof content !== "string") throw new Error("L'analyse IA n'a pas retourné de contenu exploitable.");
  const draft = draftSchema.parse(JSON.parse(content));
  const records = draft.collections.flatMap((collection, collectionIndex) => collection.items.map((item, itemIndex) => ({
    raw: { source: source, mimeType }, normalized: item, rowNumber: collectionIndex * 10_000 + itemIndex + 1,
  })));
  return { draft, records };
}

function principalFromContext(ctx: any) {
  if (ctx.restaurantOwner) return { type: "restaurant_owner" as const, id: ctx.restaurantOwner.id };
  if (ctx.adminAccount) return { type: "admin_account" as const, id: ctx.adminAccount.id };
  if (ctx.user) return { type: "manus_user" as const, id: ctx.user.id };
  throw new TRPCError({ code: "UNAUTHORIZED", message: "Connexion requise." });
}

export const importsRouter = router({
  analyze: restaurantOwnerProcedure
    .input(z.object({
      businessId: z.number().int().positive(),
      targetCatalogId: z.number().int().positive().optional(),
      catalogName: z.string().trim().min(2).max(255),
      catalogType,
      sourceType,
      fileName: z.string().trim().min(1).max(255),
      mimeType: z.string().trim().toLowerCase().max(120),
      base64Data: z.string().min(32).max(14 * 1024 * 1024),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireBusinessAccess(ctx, input.businessId);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

      if (input.targetCatalogId) {
        const [catalog] = await db.select({ id: catalogs.id }).from(catalogs).where(and(eq(catalogs.id, input.targetCatalogId), eq(catalogs.businessId, input.businessId))).limit(1);
        if (!catalog) throw new TRPCError({ code: "NOT_FOUND", message: "Catalogue cible introuvable." });
      }

      const decoded = decodeBase64(input.base64Data);
      if (decoded.mimeType !== input.mimeType || !isSupportedBinary(input.sourceType, input.mimeType, decoded.buffer)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Le type déclaré ne correspond pas à un fichier pris en charge." });
      }
      const limit = input.sourceType === "csv" ? 2 * 1024 * 1024 : input.sourceType === "image" ? 8 * 1024 * 1024 : 10 * 1024 * 1024;
      if (decoded.buffer.byteLength > limit) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Le fichier dépasse la taille autorisée." });

      const principal = principalFromContext(ctx);
      const key = `businesses/${input.businessId}/imports/${nanoid()}-${input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const stored = await storagePut(key, decoded.buffer, input.mimeType);
      const created = await db.insert(importJobs).values({
        businessId: input.businessId,
        targetCatalogId: input.targetCatalogId ?? null,
        sourceType: input.sourceType,
        sourceFileName: input.fileName,
        sourceMimeType: input.mimeType,
        sourceUrl: stored.url,
        status: "analyzing",
        createdByPrincipalType: principal.type,
        createdByPrincipalId: principal.id,
      });
      const jobId = Number(created[0].insertId);

      try {
        const result = input.sourceType === "csv"
          ? draftFromCsv(decoded.buffer, input.catalogName, input.catalogType)
          : await draftFromAi(stored.url, input.sourceType, input.mimeType, input.catalogName, input.catalogType);
        const validationErrors: Array<{ path: string; message: string }> = [];
        const needsReview = result.records.some(record => record.normalized.confidence < 0.85);

        await db.update(importJobs).set({
          status: "review_required",
          draft: result.draft,
          validationErrors,
        }).where(eq(importJobs.id, jobId));

        if (result.records.length) {
          await db.insert(importJobRows).values(result.records.map(record => {
            const rowStatus: "accepted" | "needs_review" = needsReview || record.normalized.confidence < 0.85 ? "needs_review" : "accepted";
            return {
              importJobId: jobId,
              rowNumber: record.rowNumber,
              rawData: record.raw,
              normalizedData: record.normalized,
              confidence: String(record.normalized.confidence),
              status: rowStatus,
              validationErrors: [],
            };
          }));
        }

        return { jobId, status: "review_required" as const, draft: result.draft, requiresAttention: needsReview };
      } catch (error) {
        await db.update(importJobs).set({ status: "failed", validationErrors: [{ path: "analysis", message: error instanceof Error ? error.message : "Échec de l'analyse" }] }).where(eq(importJobs.id, jobId));
        throw new TRPCError({ code: "BAD_REQUEST", message: "L'analyse du fichier a échoué. Aucun catalogue n'a été modifié." });
      }
    }),

  get: restaurantOwnerProcedure
    .input(z.object({ businessId: z.number().int().positive(), importJobId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await requireBusinessAccess(ctx, input.businessId);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [job] = await db.select().from(importJobs).where(and(eq(importJobs.id, input.importJobId), eq(importJobs.businessId, input.businessId))).limit(1);
      if (!job) throw new TRPCError({ code: "NOT_FOUND", message: "Import introuvable." });
      const rows = await db.select().from(importJobRows).where(eq(importJobRows.importJobId, input.importJobId)).orderBy(asc(importJobRows.rowNumber));
      return { job, rows };
    }),

  applyDraft: restaurantOwnerProcedure
    .input(z.object({ businessId: z.number().int().positive(), importJobId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await requireBusinessAccess(ctx, input.businessId);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [job] = await db.select().from(importJobs).where(and(eq(importJobs.id, input.importJobId), eq(importJobs.businessId, input.businessId))).limit(1);
      if (!job) throw new TRPCError({ code: "NOT_FOUND", message: "Import introuvable." });
      if (job.status !== "review_required") throw new TRPCError({ code: "CONFLICT", message: "Cet import ne peut pas être appliqué dans son état actuel." });

      const draft = draftSchema.parse(job.draft);
      await db.update(importJobs).set({ status: "applying" }).where(eq(importJobs.id, job.id));

      try {
        const catalogId = job.targetCatalogId ?? Number((await db.insert(catalogs).values({
          businessId: input.businessId,
          slug: `${slugify(draft.catalog.name)}-${job.id}`,
          name: draft.catalog.name,
          type: draft.catalog.type,
          status: "draft",
          source: job.sourceType === "csv" ? "csv_import" : job.sourceType === "pdf" ? "document_import" : "image_import",
        }))[0].insertId);

        for (let collectionIndex = 0; collectionIndex < draft.collections.length; collectionIndex += 1) {
          const collection = draft.collections[collectionIndex];
          const collectionResult = await db.insert(catalogCollections).values({
            catalogId,
            slug: `${slugify(collection.name)}-${job.id}-${collectionIndex + 1}`,
            name: collection.name,
            description: collection.description ?? null,
            displayOrder: collectionIndex,
            status: "active",
          });
          const collectionId = Number(collectionResult[0].insertId);
          if (collection.items.length) {
            await db.insert(catalogItems).values(collection.items.map((item: DraftItem, itemIndex: number) => ({
              catalogId,
              collectionId,
              itemType: draft.catalog.type === "services" ? "service" as const : "product" as const,
              name: item.name,
              description: item.description ?? null,
              priceType: item.priceType,
              price: item.price === null || item.price === undefined ? null : String(item.price),
              priceMax: item.priceMax === null || item.priceMax === undefined ? null : String(item.priceMax),
              priceLabel: item.priceLabel ?? null,
              durationMinutes: item.durationMinutes ?? null,
              attributes: { importJobId: job.id, confidence: item.confidence },
              displayOrder: itemIndex,
              status: "active" as const,
            })));
          }
        }
        await db.update(importJobs).set({ status: "applied", appliedAt: new Date() }).where(eq(importJobs.id, job.id));
        return { catalogId, status: "draft" as const, published: false };
      } catch (error) {
        await db.update(importJobs).set({ status: "failed", validationErrors: [{ path: "apply", message: error instanceof Error ? error.message : "Échec de l'application" }] }).where(eq(importJobs.id, job.id));
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "L'import n'a pas pu être appliqué." });
      }
    }),
});
