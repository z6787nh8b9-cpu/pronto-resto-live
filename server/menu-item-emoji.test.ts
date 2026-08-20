import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("emoji de plat", () => {
  it("persiste un emoji borné dans le modèle et les mutations catalogue", () => {
    const schema = source("drizzle/schema.ts");
    const router = source("server/routers/restaurant.ts");

    expect(schema).toContain('emoji: varchar("emoji", { length: 10 })');
    expect(router).toContain("emoji: z.string().trim().max(10).optional()");
  });

  it("propose l’emoji dans les deux formulaires et l’utilise seulement sans image publique", () => {
    const dashboard = source("client/src/pages/RestaurantDashboard.tsx");
    const home = source("client/src/pages/RestaurantHomePage.tsx");
    const menu = source("client/src/pages/RestaurantMenuPage.tsx");
    const legacy = source("client/src/pages/PublicRestaurantPage.tsx");

    expect(dashboard.match(/Emoji du plat/g)?.length).toBe(2);
    expect(dashboard).toContain("emoji: itemEmoji || undefined");
    expect(home).toContain("dish.imageUrl ? (");
    expect(home).toContain("dish.emoji ? (");
    expect(menu).toContain("item.imageUrl ? (");
    expect(menu).toContain("item.emoji ? (");
    expect(legacy).toContain("item.imageUrl || (item.emoji ? null");
  });
});
