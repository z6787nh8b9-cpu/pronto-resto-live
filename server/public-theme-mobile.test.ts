import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

describe("responsive des thèmes publics", () => {
  it("prévoit un socle mobile commun aux cinq thèmes", () => {
    expect(css).toContain(".public-storefront {");
    for (const theme of ["moderne-soho", "beach-boheme", "day-night", "marble-rome"]) {
      expect(css).toContain(`.public-storefront[data-theme="${theme}"]`);
    }
    expect(css).toContain("@media (max-width: 767px)");
    expect(css).toContain("overflow-x: clip");
    expect(css).toContain("touch-action: pan-x");
    expect(css).toContain("min-height: 2.75rem");
    expect(css).toContain("prefers-reduced-motion: reduce");
  });
});
