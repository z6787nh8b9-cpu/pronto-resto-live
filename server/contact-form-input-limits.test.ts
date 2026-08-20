import { describe, expect, it } from "vitest";
import { publicContactFormSchema } from "./routers/public";

describe("public contact form input limits", () => {
  const valid = { name: "Atelier Horizon", email: "contact@example.test", phone: "+33600000000", message: "Je souhaite découvrir PRONTO.", source: "HEADER" as const, recaptchaToken: "development-bypass" };

  it("accepts a normal request and rejects malformed or oversized contact data", () => {
    expect(publicContactFormSchema.safeParse(valid).success).toBe(true);
    expect(publicContactFormSchema.safeParse({ ...valid, name: "a" }).success).toBe(false);
    expect(publicContactFormSchema.safeParse({ ...valid, phone: "1".repeat(41) }).success).toBe(false);
    expect(publicContactFormSchema.safeParse({ ...valid, message: "a".repeat(2_001) }).success).toBe(false);
  });
});
