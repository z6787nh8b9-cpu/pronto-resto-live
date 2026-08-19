import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("client-side diagnostic exposure", () => {
  it("does not render internal diagnostics or Forge key fragments in Super Admin", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/SuperAdmin.tsx"), "utf8");
    expect(source).not.toContain("Configuration & Tests");
    expect(source).not.toContain("VITE_FRONTEND_FORGE_API_KEY");
    expect(source).not.toContain("VITE_FRONTEND_FORGE_API_URL");
    expect(source).not.toContain("GOOGLE_CLIENT_ID");
    expect(source).not.toContain("FACEBOOK_APP_ID");
  });
});
