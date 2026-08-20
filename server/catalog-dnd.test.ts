import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const dashboardPath = resolve(process.cwd(), "client/src/pages/RestaurantDashboard.tsx");
const dashboardSource = readFileSync(dashboardPath, "utf8");

describe("réorganisation accessible du catalogue", () => {
  it("isole chaque liste de plats dans son contexte de catégorie", () => {
    expect(dashboardSource).toContain("const categoryItems = menuItems.filter((item) => item.categoryId === categoryId);");
    expect(dashboardSource).toContain("onDragEnd={(event) => handleDragEndItems(category.id, event)}");
    expect(dashboardSource).toContain("items={categoryItems.map(item => item.id)}");
  });

  it("active les contextes triables au clavier et avec une tolérance de mouvement tactile", () => {
    expect(dashboardSource).toContain("<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndCategories}>");
    expect(dashboardSource).toContain("useSensor(PointerSensor, { activationConstraint: { distance: 8 } })");
    expect(dashboardSource).toContain("sortableKeyboardCoordinates");
  });
});
