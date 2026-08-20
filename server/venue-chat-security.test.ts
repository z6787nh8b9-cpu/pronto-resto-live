import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { publicVenueChatSchema } from "./routers/public";

describe("public venue chatbot security", () => {
  it("bounds visitor input and takes connection metadata from the server request", () => {
    const source = readFileSync(resolve(process.cwd(), "server/routers/public.ts"), "utf8");
    const venueChatProcedure = source.split("// Track page view")[0];
    const valid = { restaurantId: 1, sessionId: "visitor-123", message: "Avez-vous une option végétarienne ?" };

    expect(publicVenueChatSchema.safeParse(valid).success).toBe(true);
    expect(publicVenueChatSchema.safeParse({ ...valid, message: "a".repeat(801) }).success).toBe(false);
    expect(venueChatProcedure).toContain("userIp: ctx.req.ip");
    expect(venueChatProcedure).toContain('userAgent: ctx.req.get("user-agent")?.slice(0, 512)');
    expect(venueChatProcedure).not.toContain("userIp: z.string()");
    expect(venueChatProcedure).not.toContain("userAgent: z.string()");
  });
});
