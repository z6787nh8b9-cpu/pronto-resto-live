import { describe, expect, it } from "vitest";
import { verifyRecaptcha } from "./_core/recaptcha";

describe("reCAPTCHA en développement", () => {
  it("accepte le jeton de développement sans appeler un service externe", async () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    await expect(verifyRecaptcha("development-bypass", "submit_contact_form")).resolves.toBe(true);
    process.env.NODE_ENV = previous;
  });
});
