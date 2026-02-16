import { describe, it, expect } from "vitest";
import { verifyRecaptcha } from "./_core/recaptcha";

describe("reCAPTCHA Verification", () => {
  it("should have RECAPTCHA_SECRET_KEY configured", () => {
    expect(process.env.RECAPTCHA_SECRET_KEY).toBeDefined();
    expect(process.env.RECAPTCHA_SECRET_KEY).toBeTruthy();
  });

  it("should reject empty token", async () => {
    const result = await verifyRecaptcha("");
    expect(result).toBe(false);
  });

  it("should reject invalid token", async () => {
    const result = await verifyRecaptcha("invalid_token_12345");
    expect(result).toBe(false);
  });

  // Note: We can't test with a real valid token in automated tests
  // because reCAPTCHA tokens are single-use and expire quickly.
  // Manual testing is required for end-to-end validation.
});
