import type { Express, Request } from "express";
import { and, eq } from "drizzle-orm";
import { businesses, restaurants } from "../../drizzle/schema";
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

export type SitemapBusiness = {
  slug: string;
  legacyRestaurantId: number | null;
};

export type SitemapRestaurant = {
  id: number;
  slug: string;
};

export function buildSitemapXml(origin: string, businessesForSitemap: SitemapBusiness[], restaurantsForSitemap: SitemapRestaurant[] = []) {
  const normalizedOrigin = origin.replace(/\/$/, "");
  const activeLegacyIds = new Set(restaurantsForSitemap.map(restaurant => restaurant.id));
  const publicBusinessPaths = Array.from(new Set(
    businessesForSitemap
      .filter(business => !business.legacyRestaurantId || !activeLegacyIds.has(business.legacyRestaurantId))
      .map(business => business.slug),
  )).map(slug => `/b/${encodeURIComponent(slug)}`);
  const legacyRestaurantPaths = Array.from(new Set(restaurantsForSitemap.map(restaurant => restaurant.slug))).flatMap(slug => {
    const encodedSlug = encodeURIComponent(slug);
    return [`/${encodedSlug}`, `/${encodedSlug}/menu`];
  });
  const paths = ["/", ...publicBusinessPaths, ...legacyRestaurantPaths];
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
    const [publicBusinesses, activeRestaurants] = db
      ? await Promise.all([
        db.select({ slug: businesses.slug, legacyRestaurantId: businesses.legacyRestaurantId })
          .from(businesses)
          .where(and(eq(businesses.status, "published"), eq(businesses.isActive, true))),
        db.select({ id: restaurants.id, slug: restaurants.slug })
          .from(restaurants)
          .where(eq(restaurants.isActive, true)),
      ])
      : [[], []];

    res.type("application/xml").send(buildSitemapXml(
      getPublicOrigin(req),
      publicBusinesses,
      activeRestaurants,
    ));
  });
}
