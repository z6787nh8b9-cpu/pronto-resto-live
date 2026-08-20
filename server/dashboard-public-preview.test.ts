import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const dashboardSource = readFileSync(resolve(process.cwd(), "client/src/pages/RestaurantDashboard.tsx"), "utf8");

describe("aperçu public synchronisé du dashboard", () => {
  it("ouvre une vitrine publique isolée dans un dialog et la rafraîchit après mutation", () => {
    expect(dashboardSource).toContain('const [isPreviewOpen, setIsPreviewOpen] = useState(false);');
    expect(dashboardSource).toContain('src={`/${restaurant.slug}?dashboardPreview=${previewVersion}`}');
    expect(dashboardSource).toContain("refreshPublicPreview();");
    expect(dashboardSource).toContain("title={`Aperçu public de ${restaurant.name}`}");
  });
});
