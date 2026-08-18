import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyRecaptcha } from "./_core/recaptcha";

describe("reCAPTCHA Verification", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("should have RECAPTCHA_SECRET_KEY configured", () => {
    expect(process.env.RECAPTCHA_SECRET_KEY).toBeDefined();
    expect(process.env.RECAPTCHA_SECRET_KEY).toBeTruthy();
  });

  it("should reject empty token", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ success: false, "error-codes": ["invalid-input-response"] }) }));
    const result = await verifyRecaptcha("");
    expect(result).toBe(false);
  });

  it("should reject invalid token", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ success: false, "error-codes": ["invalid-input-response"] }) }));
    const result = await verifyRecaptcha("invalid_token_12345");
    expect(result).toBe(false);
  });

  // Note: We can't test with a real valid token in automated tests
  // because reCAPTCHA tokens are single-use and expire quickly.
  // Manual testing is required for end-to-end validation.
});
