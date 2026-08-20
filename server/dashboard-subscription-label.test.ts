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
    expect(source).not.toContain('restaurant.subscriptionTier === "premium" ? "Premium" : "Basic"');
  });

  it("keeps locked dashboard sections actionable without mounting protected modules", () => {
    const dashboard = readFileSync(resolve(process.cwd(), "client/src/pages/RestaurantDashboard.tsx"), "utf8");
    const overlay = readFileSync(resolve(process.cwd(), "client/src/components/LockedFeatureOverlay.tsx"), "utf8");

    expect(dashboard).toContain('onClick={!canAccessTranslations ? (event) => handleLockedTabClick("Traductions automatiques", "pro", event) : undefined}');
    expect(dashboard).toContain('onClick={!canAccessPremiumFeatures ? (event) => handleLockedTabClick("Système de réservations", "premium", event) : undefined}');
    expect(dashboard).toContain("<LockedFeaturePreview />");
    expect(dashboard).toContain("trpc.restaurant.updateFeatureActivation.useMutation");
    expect(dashboard).toContain('feature: "events", enabled');
    expect(dashboard).toContain('feature: "reservations", enabled');
    expect(dashboard).not.toContain("<LockedFeatureOverlay\n                featureName=\"Gestion d'événements\"\n                tier=\"premium\"\n                businessName={restaurant?.name || \"\"}\n              >\n                {restaurant && <Events restaurantId={restaurant.id} />}");
    expect(overlay).toContain("export function LockedFeaturePreview()");
    expect(overlay).toContain('aria-hidden="true"');
  });
});
