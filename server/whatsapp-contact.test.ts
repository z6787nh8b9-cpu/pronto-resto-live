import { describe, expect, it } from "vitest";
import { getWhatsAppUrl, normalizeWhatsAppNumber } from "../client/src/lib/whatsapp";
import { whatsappInputSchema } from "./contact-inputs";

describe("WhatsApp contact handling", () => {
  it("normalizes display formats into a safe wa.me target", () => {
    expect(normalizeWhatsAppNumber("+33 6 12 34 56 78")).toBe("33612345678");
    expect(getWhatsAppUrl("+33 6 12 34 56 78")).toBe("https://wa.me/33612345678");
    expect(getWhatsAppUrl("+33 6 12 34 56 78", "Bonjour")).toBe("https://wa.me/33612345678?text=Bonjour");
  });

  it("does not generate a public contact link from absent or malformed input", () => {
    expect(normalizeWhatsAppNumber(undefined)).toBeNull();
    expect(normalizeWhatsAppNumber("abc")).toBeNull();
    expect(normalizeWhatsAppNumber("1234")).toBeNull();
    expect(getWhatsAppUrl("1234")).toBeNull();
  });

  it("persists only a normalized valid number from dashboard settings", () => {
    expect(whatsappInputSchema.parse("+33 (0)6 12 34 56 78")).toBe("330612345678");
    expect(whatsappInputSchema.parse("")).toBeUndefined();
    expect(() => whatsappInputSchema.parse("1234")).toThrow("entre 8 et 15 chiffres");
  });
});
