import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("public language selector", () => {
  it("offers the five supported public languages with an accessible mobile trigger", () => {
    const selector = source("client/src/components/LanguageSelector.tsx");

    for (const language of ['code: "fr"', 'code: "en"', 'code: "it"', 'code: "de"', 'code: "es"']) {
      expect(selector).toContain(language);
    }
    expect(selector).toContain("aria-label={`Langue : ${currentLang.name}`}");
    expect(selector).toContain('<span className="sm:hidden">{currentLang.flag}</span>');
  });

  it("keeps the control in the shared floating chrome for eligible home and catalogue storefronts", () => {
    const home = source("client/src/pages/RestaurantHomePage.tsx");
    const menu = source("client/src/pages/RestaurantMenuPage.tsx");

    expect(home).toContain('className="flex items-center gap-1.5"');
    expect(home).toContain('restaurant.subscriptionTier === "pro" || restaurant.subscriptionTier === "premium"');
    expect(home).toContain('className="hidden items-center gap-1.5 md:flex"');
    expect(menu).toContain('className="h-10 rounded-[1rem] border-transparent bg-black/[0.05]');
  });
});
