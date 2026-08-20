import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const app = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");

function positionOf(route: string) {
  const position = app.indexOf(route);
  expect(position).toBeGreaterThanOrEqual(0);
  return position;
}

describe("priorité des routes publiques", () => {
  it("déclare les parcours réservés avant la vitrine générique", () => {
    const genericStorefront = positionOf('path="/:slug" component={RestaurantHomePage}');

    for (const reservedRoute of [
      'path="/tarifs"',
      'path="/terms"',
      'path="/login-restaurant"',
      'path="/reset-password"',
      'path="/invite/:token"',
      'path="/invite-admin/:token"',
      'path="/admin/login"',
      'path="/admin/magic-login"',
      'path="/admin" component={SuperAdmin}',
      'path="/:slug/dashboard"',
      'path="/:slug/menu"',
      'path="/:slug/events"',
    ]) {
      expect(positionOf(reservedRoute)).toBeLessThan(genericStorefront);
    }
  });

  it("préserve les pages catalogue et agenda à côté de la vitrine", () => {
    expect(app).toContain('path="/:slug/menu" component={RestaurantMenuPage}');
    expect(app).toContain('path="/:slug/events" component={RestaurantEventsPage}');
    expect(app).toContain('path="/b/:slug"');
  });
});
