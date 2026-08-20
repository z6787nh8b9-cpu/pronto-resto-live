import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("route code splitting", () => {
  it("loads route pages dynamically with an accessible suspense fallback", () => {
    const app = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
    const viteConfig = readFileSync(resolve(process.cwd(), "vite.config.ts"), "utf8");

    expect(app).toContain('lazy(() => import("./pages/RestaurantDashboard"))');
    expect(app).toContain('lazy(() => import("./pages/RestaurantMenuPage"))');
    expect(app).toContain('lazy(() => import("./pages/SuperAdmin"))');
    expect(app).toContain("<Suspense fallback={<RouteLoading />}>");
    expect(app).toContain('role="status"');
    expect(app).toContain('aria-live="polite"');
    expect(viteConfig).toContain('"react-vendor"');
    expect(viteConfig).toContain('"data-vendor"');
  });
});
