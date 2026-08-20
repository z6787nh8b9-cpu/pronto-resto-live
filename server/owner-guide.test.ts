import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const guide = readFileSync(resolve(process.cwd(), "docs/guide-demarrage-proprietaire.md"), "utf8");

describe("guide de démarrage propriétaire", () => {
  it("documente les parcours et limites effectivement disponibles", () => {
    for (const reference of ["/login-restaurant", "/<votre-slug>/dashboard", "/<votre-slug>/menu", "/<votre-slug>/events"]) {
      expect(guide).toContain(reference);
    }
    expect(guide).toContain("Les notifications Email et WhatsApp de réservation ne constituent pas encore un canal de confirmation configuré");
    expect(guide).toContain("Menu");
    expect(guide).toContain("Pro");
    expect(guide).toContain("Premium");
  });
});
