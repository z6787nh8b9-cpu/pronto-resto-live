import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ownerGuide = readFileSync(resolve(process.cwd(), "docs/guide-demarrage-proprietaire.md"), "utf8");
const adminGuide = readFileSync(resolve(process.cwd(), "docs/guide-super-admin.md"), "utf8");

describe("guides utilisateur PRONTO", () => {
  it("sépare les parcours propriétaire et Super Admin sans promettre les notifications non configurées", () => {
    expect(ownerGuide).toContain("/<votre-slug>/dashboard");
    expect(ownerGuide).toContain("Les notifications Email et WhatsApp de réservation ne constituent pas encore un canal de confirmation configuré");
    expect(adminGuide).toContain("/admin");
    expect(adminGuide).toContain("Propriétaires");
    expect(adminGuide).toContain("ne sont pas activées tant qu’un fournisseur transactionnel et un fournisseur WhatsApp Business ne sont pas choisis");
    expect(adminGuide).toContain("guide de démarrage propriétaire");
  });
});
