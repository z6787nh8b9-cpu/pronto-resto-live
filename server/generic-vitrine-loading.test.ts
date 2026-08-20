import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("generic public vitrine loading states", () => {
  it("uses an accessible loading state instead of rendering an empty public page", () => {
    const page = readFileSync(resolve(process.cwd(), "client/src/pages/BusinessPublicPage.tsx"), "utf8");

    expect(page).toContain('import { LoadingState } from "@/components/LoadingState"');
    expect(page).toContain('<LoadingState label="Ouverture de la vitrine" />');
    expect(page).toContain("Cette vitrine n’est pas disponible.");
  });
});
