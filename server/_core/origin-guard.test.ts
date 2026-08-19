import { describe, expect, it, vi } from "vitest";
import { requireSameOrigin } from "./origin-guard";

function runGuard({ method, origin, host = "pronto.page", protocol = "https" }: {
  method: string;
  origin?: string;
  host?: string;
  protocol?: string;
}) {
  const next = vi.fn();
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  requireSameOrigin({
    method,
    protocol,
    get: (name: string) => name === "origin" ? origin : name === "host" ? host : undefined,
  } as any, { status } as any, next);
  return { next, status, json };
}

describe("requireSameOrigin", () => {
  it("accepts a same-origin mutation", () => {
    const result = runGuard({ method: "POST", origin: "https://pronto.page" });
    expect(result.next).toHaveBeenCalledOnce();
    expect(result.status).not.toHaveBeenCalled();
  });

  it("rejects a cross-site mutation", () => {
    const result = runGuard({ method: "POST", origin: "https://attacker.example" });
    expect(result.next).not.toHaveBeenCalled();
    expect(result.status).toHaveBeenCalledWith(403);
  });

  it("requires an origin for an unsafe method while leaving reads unaffected", () => {
    const mutation = runGuard({ method: "POST" });
    const read = runGuard({ method: "GET" });
    expect(mutation.status).toHaveBeenCalledWith(403);
    expect(read.next).toHaveBeenCalledOnce();
  });
});
