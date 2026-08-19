import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Super Admin diagnostic exposure", () => {
  it("does not render frontend API keys, OAuth identifiers, or a production diagnostics panel", () => {
    const page = readFileSync(resolve(process.cwd(), "client/src/pages/SuperAdmin.tsx"), "utf8");

    expect(page).not.toContain("VITE_FRONTEND_FORGE_API_KEY");
    expect(page).not.toContain("VITE_FRONTEND_FORGE_API_URL");
    expect(page).not.toContain("GOOGLE_CLIENT_ID");
    expect(page).not.toContain("FACEBOOK_APP_ID");
    expect(page).not.toContain("Configuration & Tests");
  });
});
