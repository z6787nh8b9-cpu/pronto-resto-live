import { describe, expect, it, vi } from "vitest";
import { applySecurityHeaders, healthPayload, securityHeaders } from "./security";

describe("security headers", () => {
  it("sets the baseline protections and continues the request chain", () => {
    const setHeader = vi.fn();
    const next = vi.fn();
    applySecurityHeaders({} as never, { setHeader } as never, next);

    for (const [name, value] of Object.entries(securityHeaders)) {
      expect(setHeader).toHaveBeenCalledWith(name, value);
    }
    expect(next).toHaveBeenCalledOnce();
  });

  it("exposes only a minimal health payload", () => {
    expect(healthPayload()).toEqual({ status: "ok" });
  });

  it("adds a restrictive CSP and HSTS only in production", () => {
    const setHeader = vi.fn();
    const next = vi.fn();
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    applySecurityHeaders({} as never, { setHeader } as never, next);

    expect(setHeader).toHaveBeenCalledWith("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    expect(setHeader).toHaveBeenCalledWith("Content-Security-Policy", expect.stringContaining("default-src 'self'"));
    process.env.NODE_ENV = originalNodeEnv;
  });
});
