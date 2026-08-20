import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("couverture serveur des formules", () => {
  it("protège les procédures Premium et leurs parcours publics", () => {
    const openingHours = source("server/routers/openingHours.ts");
    const gallery = source("server/routers/gallery.ts");
    const events = source("server/routers/events.ts");
    const reservations = source("server/routes/reservations.ts");

    for (const router of [openingHours, gallery, events, reservations]) {
      expect(router).toContain('requireSubscriptionFeature');
      expect(router).toContain('"premium"');
    }
    expect(events).toContain('restaurant.subscriptionTier !== "premium"');
    expect(reservations).toContain('restaurant.subscriptionTier !== "premium"');
  });

  it("protège les traductions par la formule Pro et masque les traductions publiques après déclassement", () => {
    const translations = source("server/routers/translations.ts");
    expect(translations).toContain('requireSubscriptionFeature(ctx, restaurant.subscriptionTier, "translations")');
    expect(translations).toContain('restaurant.subscriptionTier !== "pro" && restaurant.subscriptionTier !== "premium"');
  });
});
