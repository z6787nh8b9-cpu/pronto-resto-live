import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("page tarifaire publique", () => {
  it("route la page dédiée avant la route générique d’établissement", () => {
    const app = source("client/src/App.tsx");
    expect(app).toContain('const PricingPage = lazy(() => import("./pages/PricingPage"));');
    expect(app.indexOf('<Route path="/tarifs" component={PricingPage} />')).toBeLessThan(app.indexOf('<Route path="/:slug" component={RestaurantHomePage} />'));
  });

  it("présente les niveaux fonctionnels sans promettre de paiement ou d’essai", () => {
    const page = source("client/src/pages/PricingPage.tsx");
    for (const plan of ["Menu", "Pro", "Premium"]) expect(page).toContain(`name: "${plan}"`);
    expect(page).toContain("Les modalités commerciales sont définies avec vous");
    expect(page).not.toContain("Essai gratuit");
    expect(page).not.toContain("Paiement immédiat");
  });

  it("relie les entrées tarifaires de la landing à la page dédiée", () => {
    const landing = source("client/src/pages/LandingPage.tsx");
    expect(landing).toContain('href="/tarifs"');
  });
});
