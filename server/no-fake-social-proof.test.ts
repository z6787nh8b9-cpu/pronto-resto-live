import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Public social-proof compliance", () => {
  it("does not ship fabricated testimonials, ratings, or attributed reviews", () => {
    const landing = readFileSync(resolve(process.cwd(), "client/src/pages/LandingPage.tsx"), "utf8").toLowerCase();

    expect(landing).not.toContain("testimonial");
    expect(landing).not.toContain("témoignage");
    expect(landing).not.toContain("avis client");
    expect(landing).not.toContain("5 étoiles");
    expect(landing).not.toContain("5 stars");
  });
});
