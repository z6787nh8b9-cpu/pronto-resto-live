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
});
