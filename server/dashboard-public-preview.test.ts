import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const dashboardSource = readFileSync(resolve(process.cwd(), "client/src/pages/RestaurantDashboard.tsx"), "utf8");
const storefrontSource = readFileSync(resolve(process.cwd(), "client/src/pages/RestaurantHomePage.tsx"), "utf8");
const appSource = readFileSync(resolve(process.cwd(), "client/src/main.tsx"), "utf8");

describe("aperçu public synchronisé du dashboard", () => {
  it("ouvre une vitrine publique isolée dans un dialog et la rafraîchit après mutation", () => {
    expect(dashboardSource).toContain('const [isPreviewOpen, setIsPreviewOpen] = useState(false);');
    expect(dashboardSource).toContain('src={`/${restaurant.slug}?dashboardPreview=${previewVersion}`}');
    expect(dashboardSource).toContain("refreshPublicPreview();");
    expect(dashboardSource).toContain("title={`Aperçu public de ${restaurant.name}`}");
  });

  it("continue de vérifier l’aperçu ouvert et laisse le restaurateur demander une actualisation immédiate", () => {
    expect(dashboardSource).toContain("window.setInterval(refreshPublicPreview, 8_000)");
    expect(dashboardSource).toContain("window.clearInterval(interval)");
    expect(dashboardSource).toContain('onClick={refreshPublicPreview}>Actualiser</Button>');
    expect(dashboardSource).toContain('toast.success("Configuration chatbot mise à jour");\n      refreshPublicPreview();');
  });

  it("transmet immédiatement un brouillon éditorial borné vers l’iframe et le restitue seulement depuis la même origine", () => {
    expect(dashboardSource).toContain('type: "pronto:homepage-preview"');
    expect(dashboardSource).toContain("onInput={(event) => updateHomepagePreviewDraft(event.currentTarget)}");
    expect(dashboardSource).toContain("onLoad={() => postHomepagePreviewDraft()}");
    expect(storefrontSource).toContain('event.origin !== window.location.origin');
    expect(storefrontSource).toContain('event.data?.type !== "pronto:homepage-preview"');
    expect(storefrontSource).toContain("setHomepagePreviewDraft({");
  });

  it("rafraîchit l’aperçu ouvert après toute mutation tRPC réussie, y compris celles des modules enfants", () => {
    expect(appSource).toContain('window.dispatchEvent(new Event("pronto:public-content-updated"));');
    expect(dashboardSource).toContain('window.addEventListener("pronto:public-content-updated", onPublicContentUpdated)');
    expect(dashboardSource).toContain('window.removeEventListener("pronto:public-content-updated", onPublicContentUpdated)');
  });
});
