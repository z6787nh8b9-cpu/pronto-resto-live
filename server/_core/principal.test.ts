import { describe, expect, it } from "vitest";
import { resolvePrincipal } from "./principal";

describe("resolvePrincipal", () => {
  it("prioritizes an explicit admin session over other identities", () => {
    const principal = resolvePrincipal({
      adminAccount: { id: 1, email: "admin@example.test", name: "Admin" } as never,
      restaurantOwner: { id: 2, email: "owner@example.test", name: "Owner", provider: "email" } as never,
      user: null,
    });
    expect(principal).toMatchObject({ kind: "admin", id: 1, source: "password" });
  });

  it("normalizes an OAuth owner without exposing a provider identifier", () => {
    const principal = resolvePrincipal({
      adminAccount: null,
      restaurantOwner: { id: 2, email: "owner@example.test", name: "Owner", provider: "google", providerId: "secret-provider-id" } as never,
      user: null,
    });
    expect(principal).toEqual({ kind: "owner", id: 2, email: "owner@example.test", name: "Owner", source: "google" });
    expect(principal).not.toHaveProperty("providerId");
  });
});
