import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("public chatbot guidance", () => {
  it("uses factual multi-sector guidance without unsupported commercial promises", () => {
    const router = readFileSync(resolve(process.cwd(), "server/routers/chat.ts"), "utf8");
    const widget = readFileSync(resolve(process.cwd(), "client/src/components/ChatbotWidget.tsx"), "utf8");

    expect(router).toContain("restaurants, beauté et bien-être, boutiques, créateurs et services");
    expect(router).toContain("Ne promets pas de tarif précis, d’essai, de délai");
    expect(router).toContain("Ne compare pas PRONTO à des concurrents");
    expect(router).not.toContain("19€/mois");
    expect(router).not.toContain("4 fois moins cher");
    expect(widget).not.toContain("Sans rétention de données");
    expect(widget).toContain("Évitez de partager des informations sensibles");
  });
});
