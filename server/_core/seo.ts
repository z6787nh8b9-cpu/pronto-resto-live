import type { Express, Request } from "express";
import { and, eq } from "drizzle-orm";
import { businesses } from "../../drizzle/schema";
import { getDb } from "../db";

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, character => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;",
  })[character]!);
}

export function getPublicOrigin(req: Request) {
  const configured = process.env.PUBLIC_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return `${req.protocol}://${req.get("host")}`;
}

export function buildSitemapXml(origin: string, slugs: string[]) {
  const normalizedOrigin = origin.replace(/\/$/, "");
  const paths = ["/", ...Array.from(new Set(slugs)).map(slug => `/b/${encodeURIComponent(slug)}`)];
  const urls = paths.map(path => `  <url><loc>${escapeXml(`${normalizedOrigin}${path}`)}</loc></url>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

export function buildRobotsTxt(origin: string) {
  const normalizedOrigin = origin.replace(/\/$/, "");
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /api",
    "Disallow: /invite",
    "Disallow: /login",
    `Sitemap: ${normalizedOrigin}/sitemap.xml`,
    "",
  ].join("\n");
}

export function registerSeoRoutes(app: Express) {
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain").send(buildRobotsTxt(getPublicOrigin(req)));
  });

  app.get("/sitemap.xml", async (req, res) => {
    const db = await getDb();
    const publicBusinesses = db
      ? await db.select({ slug: businesses.slug })
        .from(businesses)
        .where(and(eq(businesses.status, "published"), eq(businesses.isActive, true)))
      : [];

    res.type("application/xml").send(buildSitemapXml(getPublicOrigin(req), publicBusinesses.map(business => business.slug)));
  });
}
