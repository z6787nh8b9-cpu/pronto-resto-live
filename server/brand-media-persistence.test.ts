import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const dashboardSource = readFileSync(resolve(process.cwd(), "client/src/pages/RestaurantDashboard.tsx"), "utf8");

describe("persistance des médias de marque", () => {
  it("préserve le logo et la couverture existants lorsqu’un réglage sans nouvel upload est sauvegardé", () => {
    expect(dashboardSource).toContain("logoUrl: logoUrl || restaurant?.logoUrl || undefined");
    expect(dashboardSource).toContain("heroImageUrl: heroImageUrl || restaurant?.heroImageUrl || undefined");
  });

  it("affiche l’image déjà enregistrée dans les deux contrôles d’upload", () => {
    expect(dashboardSource).toContain("currentImageUrl={logoUrl || restaurant.logoUrl || undefined}");
    expect(dashboardSource).toContain("currentImageUrl={heroImageUrl || restaurant.heroImageUrl || undefined}");
  });
});
