import type { CapacitorConfig } from "@capacitor/cli";

/** Native projects are intentionally added only after store identities and signing keys are available. */
const config: CapacitorConfig = {
  appId: "page.pronto.b2b",
  appName: "PRONTO B2B",
  webDir: "dist/public",
  bundledWebRuntime: false,
};

export default config;
