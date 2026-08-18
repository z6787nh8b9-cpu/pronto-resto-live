import { describe, expect, it } from "vitest";
import { passwordPolicyError } from "./password-policy";

describe("password policy", () => {
  it("rejects a short password", () => {
    expect(passwordPolicyError("Rise08@"))?.toContain("12 caractères");
  });

  it("requires lower, upper and numeric characters", () => {
    expect(passwordPolicyError("PASSWORDONLY12")).toContain("minuscule");
    expect(passwordPolicyError("passwordonly12")).toContain("majuscule");
    expect(passwordPolicyError("PasswordOnlyX")).toContain("chiffre");
  });

  it("accepts a sufficiently strong password", () => {
    expect(passwordPolicyError("Pronto2026Secure")).toBeNull();
  });
});
