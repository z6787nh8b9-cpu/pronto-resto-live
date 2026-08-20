import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("Public SEO metadata", () => {
  it("provides a French metadata baseline for the application shell", () => {
    const html = read("client/index.html");

    expect(html).toContain('<html lang="fr">');
    expect(html).toContain('name="description"');
    expect(html).toContain('property="og:title"');
    expect(html).toContain('property="og:description"');
  });

  it("uses the shared public helper on published vitrines and catalogues", () => {
    const helper = read("client/src/lib/public-seo.ts");
    const businessPage = read("client/src/pages/BusinessPublicPage.tsx");
    const restaurantPage = read("client/src/pages/RestaurantHomePage.tsx");
    const menuPage = read("client/src/pages/RestaurantMenuPage.tsx");

    expect(helper).toContain('upsertCanonical');
    expect(helper).toContain('noindex, nofollow');
    expect(helper).toContain('toPublicImageUrl');
    expect(businessPage).toContain('usePublicSeo({');
    expect(businessPage).toContain('noIndex: preview');
    expect(restaurantPage).toContain('usePublicSeo({');
    expect(menuPage).toContain('usePublicSeo({');
  });
});
