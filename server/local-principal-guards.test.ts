import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("local principal authorization guards", () => {
  it("restricts opening-hours and translation administration to local PRONTO principals", () => {
    const openingHours = source("server/routers/openingHours.ts");
    const translations = source("server/routers/translations.ts");

    expect(openingHours).not.toContain("ctx.user");
    expect(translations).not.toContain("ctx.user");
    expect(openingHours).toContain("Boolean(ctx.adminAccount)");
    expect(translations).toContain("Boolean(ctx.adminAccount)");
  });
});
