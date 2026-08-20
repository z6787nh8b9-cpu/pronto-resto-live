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

  it("uses the same discreet PRONTO by ALTMachine attribution across public storefronts", () => {
    const attribution = source("client/src/components/PublicAttribution.tsx");
    const genericStorefront = source("client/src/pages/BusinessPublicPage.tsx");
    const menuStorefront = source("client/src/pages/RestaurantMenuPage.tsx");
    const homeStorefront = source("client/src/pages/RestaurantHomePage.tsx");
    const eventsStorefront = source("client/src/pages/RestaurantEventsPage.tsx");
    const legacyStorefront = source("client/src/pages/PublicRestaurantPage.tsx");

    expect(attribution).toContain("PRONTO");
    expect(attribution).toContain("by ALTMachine");
    for (const storefront of [genericStorefront, menuStorefront, homeStorefront, eventsStorefront, legacyStorefront]) {
      expect(storefront).toContain("PublicAttribution");
    }
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

  it("makes horizontal public catalogue categories discoverable on mobile", () => {
    const menuStorefront = source("client/src/pages/RestaurantMenuPage.tsx");

    expect(menuStorefront).toContain("défilement horizontal disponible");
    expect(menuStorefront).toContain("Faites défiler les catégories");
    expect(menuStorefront).toContain("data-[state=active]:font-semibold");
  });

  it("applies bundled premium storefront themes consistently to the home and catalogue", () => {
    const themes = source("client/src/components/ThemeWrapper.tsx");
    const styles = source("client/src/index.css");
    const menuStorefront = source("client/src/pages/RestaurantMenuPage.tsx");
    const homeStorefront = source("client/src/pages/RestaurantHomePage.tsx");

    for (const theme of ["pronto-service", "moderne-soho", "beach-boheme", "day-night", "marble-rome"]) {
      expect(themes).toContain(theme);
    }
    expect(themes).not.toContain("/src/themes/");
    expect(styles).toContain(".public-storefront[data-theme=\"marble-rome\"]");
    expect(styles).toContain(".public-storefront[data-theme=\"day-night\"]");
    expect(styles).toContain("@media (max-width: 767px)");
    expect(styles).toContain(".public-storefront .storefront-card { border-radius: 1.4rem !important; }");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
    expect(menuStorefront).toContain("<ThemeWrapper theme={storefrontTheme}>");
    expect(homeStorefront).toContain("<ThemeWrapper theme={storefrontTheme}>");
    expect(menuStorefront).toContain("storefront-catalog-card");
    expect(homeStorefront).toContain("storefront-gallery-item");
  });

  it("labels floating public contact actions for assistive technology", () => {
    const menuStorefront = source("client/src/pages/RestaurantMenuPage.tsx");

    expect(menuStorefront).toContain("Contacter ${restaurant.name} sur WhatsApp");
    expect(menuStorefront).toContain("Ouvrir l’assistant de ${restaurant.name}");
    expect(menuStorefront).toContain('aria-haspopup="dialog"');
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

  it("distinguishes explicit signature dishes from a neutral catalogue selection", () => {
    const homeStorefront = source("client/src/pages/RestaurantHomePage.tsx");
    const publicRouter = source("server/routers/public.ts");

    expect(homeStorefront).toContain("const signatureDishes = menuData?.items?.filter");
    expect(homeStorefront).toContain('hasSignatureDishes ? "Nos Spécialités" : "Une sélection du moment"');
    expect(homeStorefront).toContain("★ Signature");
    expect(homeStorefront).toContain("rounded-[calc(2rem-0.375rem)]");
    expect(publicRouter).toContain("NOS SPÉCIALITÉS (plats favoris à recommander en priorité)");
  });
});
