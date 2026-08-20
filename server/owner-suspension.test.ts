import { afterAll, describe, expect, it } from "vitest";
import passport from "passport";
import { eq, inArray } from "drizzle-orm";
import { restaurantOwners } from "../drizzle/schema";
import { getDb } from "./db";
import { appRouter } from "./routers";
import { initializePassport } from "./auth-config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const ownerIds: number[] = [];

afterAll(async () => {
  const db = await getDb();
  if (db && ownerIds.length) await db.delete(restaurantOwners).where(inArray(restaurantOwners.id, ownerIds));
});

describe("suspension de propriétaire", () => {
  it("incrémente la version de session et empêche la désérialisation d’un compte suspendu", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const [result] = await db.insert(restaurantOwners).values({ email: `suspended-${runId}@example.test`, name: "Suspended owner", provider: "email", passwordHash: "test-hash" });
    const ownerId = Number(result.insertId); ownerIds.push(ownerId);
    const admin = appRouter.createCaller({ adminAccount: { id: 1, email: "admin-suspension@pronto.test" }, restaurantOwner: null, user: null, req: { session: {} }, res: {} } as any);

    await expect(admin.admin.setRestaurantOwnerSuspension({ ownerId: 999999999, isSuspended: true })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(admin.admin.setRestaurantOwnerSuspension({ ownerId, isSuspended: true })).resolves.toMatchObject({ ownerId, isSuspended: true });
    const [owner] = await db.select().from(restaurantOwners).where(eq(restaurantOwners.id, ownerId));
    expect(owner).toMatchObject({ isSuspended: true, authVersion: 2 });

    initializePassport();
    const deserialize = (passport as any)._deserializers.at(-1);
    const restored = await new Promise((resolveResult, reject) => deserialize(`owner:${ownerId}:2`, (error: Error | null, user: unknown) => error ? reject(error) : resolveResult(user)));
    expect(restored).toBeNull();
  });

  it("maintient un refus indistinguable pour la connexion e-mail et les aides de mot de passe", () => {
    const authRoutes = readFileSync(resolve(process.cwd(), "server/auth-routes.ts"), "utf8");
    expect(authRoutes).toContain('eq(restaurantOwners.isSuspended, false)');
    const authConfig = readFileSync(resolve(process.cwd(), "server/auth-config.ts"), "utf8");
    expect(authConfig).toContain("!owner.isSuspended && owner.authVersion === authVersion");
  });
});
