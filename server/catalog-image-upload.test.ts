import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const dashboardSource = readFileSync(resolve(process.cwd(), "client/src/pages/RestaurantDashboard.tsx"), "utf8");

describe("upload des images de plats", () => {
  it("envoie l’image choisie à la création d’un plat", () => {
    expect(dashboardSource).toContain("imageUrl: itemImageUrl || undefined");
    expect(dashboardSource).toContain("setItemImageUrl(\"\"); // Reset after creation");
  });

  it("précharge l’image existante avant l’édition et l’affiche dans les contrôles d’upload", () => {
    expect(dashboardSource).toContain("setItemImageUrl(item.imageUrl || \"\");");
    expect(dashboardSource).toContain("currentImageUrl={itemImageUrl}");
  });
});
