import { describe, expect, it } from "vitest";
import { credentialsInputSchema, passwordChangeInputSchema, passwordHelpInputSchema, passwordResetInputSchema } from "./auth-inputs";

describe("REST authentication input schemas", () => {
  it("normalizes valid credentials and rejects malformed or oversized fields", () => {
    expect(credentialsInputSchema.parse({ email: " OWNER@EXAMPLE.TEST ", password: "CorrectSecret12!" })).toEqual({ email: "owner@example.test", password: "CorrectSecret12!" });
    expect(credentialsInputSchema.safeParse({ email: "invalid", password: "CorrectSecret12!" }).success).toBe(false);
    expect(credentialsInputSchema.safeParse({ email: "owner@example.test", password: "a".repeat(73) }).success).toBe(false);
    expect(credentialsInputSchema.safeParse({ email: { value: "owner@example.test" }, password: "CorrectSecret12!" }).success).toBe(false);
  });

  it("bounds password change, recovery and reset bodies before database work", () => {
    expect(passwordChangeInputSchema.safeParse({ currentPassword: "CurrentSecret12!", newPassword: "NewSecret123!" }).success).toBe(true);
    expect(passwordChangeInputSchema.safeParse({ currentPassword: "", newPassword: "NewSecret123!" }).success).toBe(false);
    expect(passwordHelpInputSchema.parse({ email: " HELP@EXAMPLE.TEST " })).toEqual({ email: "help@example.test" });
    expect(passwordHelpInputSchema.safeParse({ email: "a".repeat(321) + "@example.test" }).success).toBe(false);
    expect(passwordResetInputSchema.safeParse({ token: "t".repeat(20), newPassword: "NewSecret123!" }).success).toBe(true);
    expect(passwordResetInputSchema.safeParse({ token: "short", newPassword: "NewSecret123!" }).success).toBe(false);
    expect(passwordResetInputSchema.safeParse({ token: "t".repeat(20), newPassword: "a".repeat(73) }).success).toBe(false);
  });
});
