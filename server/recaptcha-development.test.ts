import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { verifyRecaptcha } from "./_core/recaptcha";

describe("reCAPTCHA en développement", () => {
  it("accepte le jeton de développement sans appeler un service externe", async () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    await expect(verifyRecaptcha("development-bypass", "submit_contact_form")).resolves.toBe(true);
    process.env.NODE_ENV = previous;
  });

  it("ne charge pas le badge Google dans l’entrée de développement", () => {
    const html = readFileSync(resolve(process.cwd(), "client/index.html"), "utf8");
    const contactForm = readFileSync(resolve(process.cwd(), "client/src/components/ContactFormDialog.tsx"), "utf8");
    const recaptchaClient = readFileSync(resolve(process.cwd(), "client/src/lib/recaptcha.ts"), "utf8");

    expect(html).not.toContain("google.com/recaptcha");
    expect(contactForm).toContain('executeRecaptcha("submit_contact_form")');
    expect(recaptchaClient).toContain("if (import.meta.env.DEV) return \"development-bypass\"");
    expect(recaptchaClient).toContain("google.com/recaptcha/enterprise.js");
  });
});
