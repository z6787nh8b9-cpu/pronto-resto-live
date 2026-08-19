import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("business dashboard catalogue wording", () => {
  it("uses neutral catalogue wording without changing the legacy tab contract", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/RestaurantDashboard.tsx"), "utf8");

    expect(source).toContain('<TabsTrigger value="menu">Catalogue</TabsTrigger>');
    expect(source).toContain('<TabsContent value="menu"');
    expect(source).toContain("Gestion du catalogue");
    expect(source).toContain("onglet Catalogue");
    expect(source).not.toContain("Gestion du Menu");
  });
});
