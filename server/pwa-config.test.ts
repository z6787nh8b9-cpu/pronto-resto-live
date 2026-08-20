import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("PWA and Capacitor configuration", () => {
  it("keeps authenticated API responses out of runtime caches and declares the native web bundle", () => {
    const viteConfig = readFileSync(resolve(process.cwd(), "vite.config.ts"), "utf8");
    const pwaRegistration = readFileSync(resolve(process.cwd(), "client/src/lib/pwa.ts"), "utf8");
    const installControl = readFileSync(resolve(process.cwd(), "client/src/components/PwaInstallControl.tsx"), "utf8");
    const capacitorConfig = readFileSync(resolve(process.cwd(), "capacitor.config.ts"), "utf8");
    const packageJson = readFileSync(resolve(process.cwd(), "package.json"), "utf8");

    expect(viteConfig).toContain("VitePWA");
    expect(viteConfig).toContain('runtimeCaching: []');
    expect(viteConfig).toContain('purpose: "any maskable"');
    expect(viteConfig).toContain('sizes: "1024x1024"');
    expect(viteConfig).toContain('categories: ["business", "productivity"]');
    expect(pwaRegistration).toContain("import.meta.env.PROD");
    expect(installControl).toContain("beforeinstallprompt");
    expect(installControl).toContain("display-mode: standalone");
    expect(installControl).toContain("PRONTO est installé sur cet appareil");
    expect(installControl).toContain("pronto:pwa-update");
    expect(capacitorConfig).toContain('webDir: "dist/public"');
    expect(capacitorConfig).toContain('appId: "page.pronto.b2b"');
    expect(capacitorConfig).not.toContain("server:");
    expect(packageJson).toContain('"pwa:build": "vite build"');
    expect(packageJson).toContain('"cap:sync": "pnpm pwa:build && cap sync"');
  });
});
