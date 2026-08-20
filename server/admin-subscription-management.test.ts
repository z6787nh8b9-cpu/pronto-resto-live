import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const adminRouter = readFileSync(resolve(process.cwd(), "server/routers/admin.ts"), "utf8");

describe("gestion administrative des formules", () => {
  it("réserve la mutation de formule au Super Admin", () => {
    const updateStart = adminRouter.indexOf("updateRestaurant: adminProcedure");
    expect(updateStart).toBeGreaterThan(-1);
    const mutation = adminRouter.slice(updateStart, updateStart + 1500);
    expect(mutation).toContain("subscriptionTier: z.enum([\"menu\", \"pro\", \"premium\"]).optional()");
    expect(mutation).toContain("subscriptionStatus: z.enum([\"active\", \"trial\", \"expired\", \"cancelled\"]).optional()");
    expect(mutation).toContain("return await updateRestaurant(input.id, input.data)");
  });
});
