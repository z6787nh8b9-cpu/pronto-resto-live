import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createOwnerInvitationToken, hashOwnerInvitationToken, isOwnerInvitationToken } from "./owner-invitation-token";

describe("owner invitation security", () => {
  it("creates only 256-bit hex tokens and derives a deterministic SHA-256 lookup key", () => {
    const token = createOwnerInvitationToken();
    expect(token).toMatch(/^[a-f0-9]{64}$/i);
    expect(isOwnerInvitationToken(token)).toBe(true);
    expect(isOwnerInvitationToken("short-token")).toBe(false);
    expect(hashOwnerInvitationToken(token)).toMatch(/^[a-f0-9]{64}$/i);
    expect(hashOwnerInvitationToken(token)).not.toBe(token);
  });

  it("uses token hashes, a conditional claim and a transaction in OAuth configuration", () => {
    const source = readFileSync(resolve(process.cwd(), "server/auth-config.ts"), "utf8");
    expect(source).toContain("return await db.transaction");
    expect(source).toContain("eq(invitations.tokenHash, tokenHash)");
    expect(source).toContain('eq(invitations.status, "pending")');
    expect(source).toContain("gt(invitations.expiresAt, now)");
    expect(source).toContain("isNull(restaurants.ownerId)");
    expect(source).not.toMatch(/invitations\.token\b/);
  });
});
