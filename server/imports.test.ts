import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { appRouter } from "./routers";
import { draftFromCsv } from "./routers/imports";

const anonymousCaller = appRouter.createCaller({
  adminAccount: null,
  user: null,
  restaurantOwner: null,
  req: { session: {} },
  res: {},
} as any);

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
});
