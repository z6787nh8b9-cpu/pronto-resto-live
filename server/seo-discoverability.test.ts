import { describe, expect, it } from "vitest";
import { buildRobotsTxt, buildSitemapXml } from "./_core/seo";

describe("SEO discoverability routes", () => {
  it("builds a sitemap from public business and active legacy restaurant slugs", () => {
    const sitemap = buildSitemapXml(
      "https://pronto.page/",
      ["atelier & spa", "atelier & spa"],
      ["la-voile-rouge", "la-voile-rouge"],
    );

    expect(sitemap).toContain("https://pronto.page/");
    expect(sitemap).toContain("https://pronto.page/b/atelier%20%26%20spa");
    expect(sitemap).toContain("https://pronto.page/la-voile-rouge");
    expect(sitemap).toContain("https://pronto.page/la-voile-rouge/menu");
    expect(sitemap.match(/la-voile-rouge\/menu/g)).toHaveLength(1);
    expect(sitemap).not.toContain("/admin");
    expect(sitemap).not.toContain("/invite");
  });

  it("keeps administrative and authentication paths out of crawlers", () => {
    const robots = buildRobotsTxt("https://pronto.page");

    expect(robots).toContain("Disallow: /admin");
    expect(robots).toContain("Disallow: /api");
    expect(robots).toContain("Disallow: /invite");
    expect(robots).toContain("Sitemap: https://pronto.page/sitemap.xml");
  });
});
