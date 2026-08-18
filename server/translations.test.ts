import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { appRouter } from "./routers";

const anonymousCaller = appRouter.createCaller({
  adminAccount: null,
  user: null,
  restaurantOwner: null,
  req: { session: {} },
  res: {},
} as any);

describe("translation generation access", () => {
  it("refuses anonymous requests before invoking the translation service", async () => {
    await expect(anonymousCaller.translations.autoTranslatePublic({ restaurantId: 1, targetLanguage: "en" })).rejects.toBeInstanceOf(TRPCError);
  });
});
