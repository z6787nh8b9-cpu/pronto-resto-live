import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const app = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");

describe("routage public PRONTO", () => {
  it("enregistre les routes réservées avant la route générique d’établissement", () => {
    const generic = app.indexOf('<Route path="/:slug" component={RestaurantHomePage} />');
    expect(generic).toBeGreaterThan(-1);
    for (const route of [
      '<Route path="/tarifs" component={PricingPage} />',
      '<Route path="/terms" component={TermsPage} />',
      '<Route path="/login-restaurant" component={RestaurantLogin} />',
      '<Route path="/admin/restaurants/:id" component={AdminManageRestaurant} />',
      '<Route path="/:slug/dashboard" component={RestaurantDashboard} />',
      '<Route path="/b/:slug">{() => <BusinessPublicPage />}</Route>',
      '<Route path="/:slug/menu" component={RestaurantMenuPage} />',
      '<Route path="/:slug/events" component={RestaurantEventsPage} />',
    ]) {
      expect(app.indexOf(route)).toBeGreaterThan(-1);
      expect(app.indexOf(route)).toBeLessThan(generic);
    }
  });
});
