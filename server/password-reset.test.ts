import { describe, expect, it } from "vitest";
import { createPasswordResetSecret, hashPasswordResetSecret, isPasswordResetExpired } from "./password-reset";

describe("password reset primitives", () => {
  it("creates a high-entropy secret and persists only a deterministic hash", () => {
    const secret = createPasswordResetSecret();
    expect(secret.length).toBeGreaterThan(30);
    expect(hashPasswordResetSecret(secret)).toHaveLength(64);
    expect(hashPasswordResetSecret(secret)).not.toBe(secret);
  });

  it("treats expiration boundaries as expired", () => {
    const now = new Date("2026-08-18T10:00:00.000Z");
    expect(isPasswordResetExpired(new Date("2026-08-18T10:00:00.000Z"), now)).toBe(true);
    expect(isPasswordResetExpired(new Date("2026-08-18T10:00:01.000Z"), now)).toBe(false);
  });
});
