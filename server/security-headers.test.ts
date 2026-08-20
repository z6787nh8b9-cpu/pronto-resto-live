import { describe, expect, it, vi } from "vitest";
import { applySecurityHeaders, securityHeaders } from "./_core/security";

describe("HTTP security headers", () => {
  it("applies the browser hardening baseline to every request", () => {
    const setHeader = vi.fn();
    const next = vi.fn();

    applySecurityHeaders({} as never, { setHeader } as never, next);

    for (const [name, value] of Object.entries(securityHeaders)) {
      expect(setHeader).toHaveBeenCalledWith(name, value);
    }
    expect(next).toHaveBeenCalledOnce();
  });

  it("enables transport security only in production", () => {
    const previousEnvironment = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const setHeader = vi.fn();

    applySecurityHeaders({} as never, { setHeader } as never, vi.fn());

    expect(setHeader).toHaveBeenCalledWith("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    process.env.NODE_ENV = previousEnvironment;
  });
});
