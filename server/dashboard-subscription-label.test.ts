import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("dashboard subscription label", () => {
  it("maps internal subscription tiers to readable PRONTO plan labels", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/RestaurantDashboard.tsx"), "utf8");

    expect(source).toContain('menu: "Essentiel"');
    expect(source).toContain('pro: "Pro"');
    expect(source).toContain('premium: "Premium"');
    expect(source).toContain("subscriptionTierLabel(restaurant.subscriptionTier)");
  });
});
