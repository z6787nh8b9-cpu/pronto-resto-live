import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { requireSubscriptionFeature } from "./subscription-access";

describe("droits serveur par formule", () => {
  it("refuse les fonctions Premium et Pro sous la formule Essentiel", () => {
    expect(() => requireSubscriptionFeature({ adminAccount: null } as never, "menu", "premium")).toThrow(TRPCError);
    expect(() => requireSubscriptionFeature({ adminAccount: null } as never, "menu", "translations")).toThrow(TRPCError);
  });

  it("autorise les traductions dès Pro, les fonctions Premium au bon niveau et les Super Admins", () => {
    expect(() => requireSubscriptionFeature({ adminAccount: null } as never, "pro", "translations")).not.toThrow();
    expect(() => requireSubscriptionFeature({ adminAccount: null } as never, "premium", "premium")).not.toThrow();
    expect(() => requireSubscriptionFeature({ adminAccount: { id: 1 } } as never, "menu", "premium")).not.toThrow();
  });
});
