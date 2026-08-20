import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("landing factual product copy", () => {
  it("uses the verified publication workflow instead of an unsupported trial promise", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/LandingPage.tsx"), "utf8");

    expect(source).toContain("Préparez votre catalogue · Relisez chaque détail · Publiez quand vous êtes prêt");
    expect(source).not.toContain("Essai accompagné · Sans carte bancaire");
  });
});
