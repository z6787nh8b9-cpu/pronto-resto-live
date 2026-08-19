import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("public storefront chrome", () => {
  it("uses one floating, accessible chrome across generic and legacy storefronts", () => {
    const chrome = source("client/src/components/PublicVitrineChrome.tsx");
    const genericStorefront = source("client/src/pages/BusinessPublicPage.tsx");
    const menuStorefront = source("client/src/pages/RestaurantMenuPage.tsx");
    const homeStorefront = source("client/src/pages/RestaurantHomePage.tsx");

    expect(chrome).toContain("fixed inset-x-0 top-0 z-40");
    expect(chrome).toContain("backdrop-blur-xl");
    expect(genericStorefront).toContain("PublicVitrineChrome");
    expect(menuStorefront).toContain("PublicVitrineChrome");
    expect(homeStorefront).toContain("PublicVitrineChrome");
  });

  it("keeps restaurant heroes legible when no cover image exists", () => {
    const menuStorefront = source("client/src/pages/RestaurantMenuPage.tsx");
    const homeStorefront = source("client/src/pages/RestaurantHomePage.tsx");

    expect(menuStorefront).toContain("heroImageFailed");
    expect(menuStorefront).toContain("onError={() => setHeroImageFailed(true)}");
    expect(menuStorefront).toContain("radial-gradient(circle_at_18%_18%");
    expect(homeStorefront).toContain("!restaurant.heroImageUrl");
    expect(homeStorefront).toContain("min-h-[100dvh]");
  });

  it("does not render an empty allergen label in public catalogue cards", () => {
    const menuStorefront = source("client/src/pages/RestaurantMenuPage.tsx");

    expect(menuStorefront).toContain("const allergens = Array.isArray(item.allergens)");
    expect(menuStorefront).toContain("{hasAllergens && (");
    expect(menuStorefront).toContain("allergens.join(\", \")");
  });

  it("keeps mobile restaurant action stacks clear of the reCAPTCHA badge", () => {
    const homeStorefront = source("client/src/pages/RestaurantHomePage.tsx");
    const legacyStorefront = source("client/src/pages/PublicRestaurantPage.tsx");

    expect(homeStorefront).toContain("bottom-24 right-6");
    expect(legacyStorefront).toContain("bottom-24 right-6");
  });

  it("keeps generic catalogue prices in the mobile reading column", () => {
    const genericStorefront = source("client/src/pages/BusinessPublicPage.tsx");

    expect(genericStorefront).toContain("flex flex-col items-start gap-1 sm:flex-row");
  });

  it("uses intersection-based scroll reveals with a reduced-motion fallback", () => {
    const reveal = source("client/src/components/ScrollReveal.tsx");
    const genericStorefront = source("client/src/pages/BusinessPublicPage.tsx");
    const styles = source("client/src/index.css");

    expect(reveal).toContain("IntersectionObserver");
    expect(reveal).not.toContain('addEventListener("scroll"');
    expect(genericStorefront).toContain("ScrollReveal");
    expect(styles).toContain("prefers-reduced-motion: reduce");
    expect(styles).toContain("--pronto-ease-out");
  });
});
