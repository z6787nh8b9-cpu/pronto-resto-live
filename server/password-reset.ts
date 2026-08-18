import { createHash, randomBytes } from "crypto";

export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

export function createPasswordResetSecret() {
  return randomBytes(32).toString("base64url");
}

export function hashPasswordResetSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

export function isPasswordResetExpired(expiresAt: Date, now = new Date()) {
  return expiresAt.getTime() <= now.getTime();
}
