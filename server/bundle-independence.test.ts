import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("public bundle independence", () => {
  it("does not reference Manus analytics or a public Manus asset route in the HTML entry", () => {
    const html = readFileSync(resolve(process.cwd(), "client/index.html"), "utf8");
    expect(html.toLowerCase()).not.toContain("manus");
    expect(html).not.toContain("VITE_ANALYTICS_ENDPOINT");
    expect(html).not.toContain("VITE_ANALYTICS_WEBSITE_ID");
  });
});
