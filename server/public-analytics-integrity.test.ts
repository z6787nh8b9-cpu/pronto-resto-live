import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { publicPageViewSchema } from "./routers/public";

describe("public analytics integrity", () => {
  it("accepts only page identity from the browser and derives connection metadata on the server", () => {
    const source = readFileSync(resolve(process.cwd(), "server/routers/public.ts"), "utf8");
    const pageViewProcedure = source.split("// Get active advertisements")[0].split("// Track page view")[1];

    expect(publicPageViewSchema.safeParse({ restaurantId: 1, path: "/la-voile-rouge/menu" }).success).toBe(true);
    expect(publicPageViewSchema.safeParse({ restaurantId: 1, path: "a".repeat(2_049) }).success).toBe(false);
    expect(pageViewProcedure).toContain("visitorIp: ctx.req.ip");
    expect(pageViewProcedure).toContain('userAgent: ctx.req.get("user-agent")?.slice(0, 512)');
    expect(pageViewProcedure).toContain('referer: ctx.req.get("referer")?.slice(0, 2_048)');
    expect(pageViewProcedure).not.toContain("visitorIp: z.string()");
    expect(pageViewProcedure).not.toContain("userAgent: z.string()");
  });
});
