import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

const adminCaller = appRouter.createCaller({
  adminAccount: { id: 1, email: "preview-admin@pronto.local" }, user: null, restaurantOwner: null,
  req: { session: {} }, res: {},
} as any);
const anonymousCaller = appRouter.createCaller({ adminAccount: null, user: null, restaurantOwner: null, req: { session: {} }, res: {} } as any);

describe("draft business preview", () => {
  it("keeps draft demo data restricted to Super Admin preview", async () => {
    const preview = await adminCaller.businesses.getPreviewBySlug({ slug: "demo-beaute-pronto" });
    expect(preview.business.vertical).toBe("beauty");
    await expect(anonymousCaller.businesses.getPreviewBySlug({ slug: "demo-beaute-pronto" })).rejects.toBeInstanceOf(TRPCError);
    await expect(anonymousCaller.businesses.getPublicBySlug({ slug: "demo-beaute-pronto" })).rejects.toBeInstanceOf(TRPCError);
  });
});
