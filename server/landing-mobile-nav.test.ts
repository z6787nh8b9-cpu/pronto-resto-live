import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("landing mobile navigation", () => {
  it("keeps the menu trigger labelled and delegated to the accessible Sheet primitive", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/LandingPage.tsx"), "utf8");

    expect(source).toContain('<SheetTrigger asChild className="sm:hidden">');
    expect(source).toContain('aria-label="Ouvrir le menu"');
    expect(source).toContain('aria-label="Navigation mobile"');
  });
});
