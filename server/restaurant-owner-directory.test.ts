import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const adminRouterSource = readFileSync(resolve(process.cwd(), "server/routers/admin.ts"), "utf8");
const superAdminSource = readFileSync(resolve(process.cwd(), "client/src/pages/SuperAdmin.tsx"), "utf8");
const ownersTabSource = readFileSync(resolve(process.cwd(), "client/src/pages/admin/RestaurantOwnersTab.tsx"), "utf8");

describe("annuaire Super Admin des propriétaires", () => {
  it("réserve le répertoire au Super Admin et exclut les secrets d’authentification", () => {
    const directorySection = adminRouterSource.split("listRestaurantOwners: adminProcedure")[1].split("// ===== OWNER LIFECYCLE =====")[0];

    expect(directorySection).toContain("restaurantOwners.email");
    expect(directorySection).toContain("restaurants.ownerId");
    expect(directorySection).not.toContain("passwordHash:");
    expect(directorySection).not.toContain("providerId:");
    expect(directorySection).not.toContain("authVersion:");
  });

  it("rend la consultation dans un onglet Super Admin avec une explication de confidentialité", () => {
    expect(superAdminSource).toContain('TabsTrigger value="owners"');
    expect(superAdminSource).toContain("RestaurantOwnersTab");
    expect(ownersTabSource).toContain("Les secrets de connexion et les sessions ne sont jamais affichés ici.");
  });
});
