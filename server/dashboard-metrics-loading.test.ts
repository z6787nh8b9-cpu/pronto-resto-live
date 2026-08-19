import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("business dashboard loading metrics", () => {
  it("uses non-misleading loading surfaces before catalogue metrics resolve", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/RestaurantDashboard.tsx"), "utf8");

    expect(source).toContain("isCategoriesLoading");
    expect(source).toContain("isMenuItemsLoading");
    expect(source).toContain("DashboardMetricValue");
    expect(source).toContain("aria-label={`Chargement : ${label}`}");
    expect(source).toContain("animate-pulse");
    expect(source).toContain("défilement horizontal disponible");
    expect(source).toContain("Faites défiler pour voir toutes les sections");
  });
});
