import { createHash, randomBytes } from "crypto";

export const OWNER_INVITATION_TOKEN_PATTERN = /^[a-f0-9]{64}$/i;

export function createOwnerInvitationToken(): string {
  return randomBytes(32).toString("hex");
}

export function isOwnerInvitationToken(value: unknown): value is string {
  return typeof value === "string" && OWNER_INVITATION_TOKEN_PATTERN.test(value);
}

export function hashOwnerInvitationToken(token: string): string {
  if (!isOwnerInvitationToken(token)) {
    throw new Error("Invalid owner invitation token format");
  }
  return createHash("sha256").update(token).digest("hex");
}
