import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("public events page", () => {
  it("registers the dedicated route before the storefront catch-all", () => {
    const app = source("client/src/App.tsx");

    expect(app.indexOf('path="/:slug/events"')).toBeGreaterThan(-1);
    expect(app.indexOf('path="/:slug/events"')).toBeLessThan(app.indexOf('path="/:slug" component={RestaurantHomePage}'));
  });

  it("uses only filtered public events and the existing protected registration flow", () => {
    const page = source("client/src/pages/RestaurantEventsPage.tsx");
    const home = source("client/src/pages/RestaurantHomePage.tsx");

    expect(page).toContain("trpc.events.getPublicEvents.useQuery");
    expect(page).toContain("EventRegistrationFlow");
    expect(page).toContain("usePublicSeo");
    expect(page).toContain('pathname: slug ? `/${slug}/events`');
    expect(page).toContain("resolveStorefrontTheme");
    expect(home).toContain("navigate(`/${slug}/events`)");
  });

  it("does not claim an email notification that is not sent by the current flow", () => {
    const registration = source("client/src/components/EventRegistrationFlow.tsx");

    expect(registration).toContain("Votre inscription a bien été enregistrée");
    expect(registration).not.toContain("Un email de confirmation a été envoyé");
  });
});
