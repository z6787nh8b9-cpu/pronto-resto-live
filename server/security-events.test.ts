import { describe, expect, it } from "vitest";
import { buildSecurityEventPayload, hashIp } from "./security-events";

const request = {
  headers: { "x-forwarded-for": "203.0.113.50, 10.0.0.1" },
  ip: "10.0.0.1",
  path: "/api/auth/email-login",
} as never;

describe("security event payloads", () => {
  it("hashes the originating IP and retains only routing metadata", () => {
    const payload = buildSecurityEventPayload({
      req: request,
      principalType: "owner",
      principalId: 42,
      eventType: "owner.email_login",
      outcome: "failure",
    });

    expect(payload.ipHash).toHaveLength(64);
    expect(payload.ipHash).not.toContain("203.0.113.50");
    expect(payload.route).toBe("/api/auth/email-login");
    expect(Object.keys(payload)).not.toContain("email");
    expect(Object.keys(payload)).not.toContain("password");
    expect(Object.keys(payload)).not.toContain("token");
  });

  it("produces the same privacy-preserving fingerprint for the same request", () => {
    expect(hashIp(request)).toBe(hashIp(request));
  });
});
