import { afterAll, describe, expect, it } from "vitest";
import { eq, inArray, isNull } from "drizzle-orm";
import { restaurantOwners, restaurants } from "../drizzle/schema";
import { getDb } from "./db";
import { appRouter } from "./routers";

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const ownerIds: number[] = [];
const restaurantIds: number[] = [];

afterAll(async () => {
  const db = await getDb();
  if (!db) return;
  if (restaurantIds.length) await db.delete(restaurants).where(inArray(restaurants.id, restaurantIds));
  if (ownerIds.length) await db.delete(restaurantOwners).where(inArray(restaurantOwners.id, ownerIds));
});

describe("cycle de vie d’un propriétaire", () => {
  it("transfère puis dissocie un établissement sans manipuler les données d’authentification", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const [[first], [second]] = await Promise.all([
      db.insert(restaurantOwners).values({ email: `owner-a-${runId}@example.test`, name: "Owner A", provider: "email", passwordHash: "test-hash" }),
      db.insert(restaurantOwners).values({ email: `owner-b-${runId}@example.test`, name: "Owner B", provider: "email", passwordHash: "test-hash" }),
    ]);
    const ownerA = Number(first.insertId); const ownerB = Number(second.insertId); ownerIds.push(ownerA, ownerB);
    const admin = appRouter.createCaller({ adminAccount: { id: 1, email: "admin-lifecycle@pronto.test" }, restaurantOwner: null, user: null, req: { session: {} }, res: {} } as any);
    const restaurant = await admin.admin.createRestaurant({ ownerId: ownerA, name: "Lifecycle", slug: `owner-lifecycle-${runId}`, subscriptionTier: "menu", subscriptionStatus: "trial" });
    restaurantIds.push(restaurant.id);

    await expect(admin.admin.transferRestaurantOwner({ restaurantId: restaurant.id, targetOwnerId: 999999999 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    const transferred = await admin.admin.transferRestaurantOwner({ restaurantId: restaurant.id, targetOwnerId: ownerB });
    expect(transferred).toMatchObject({ restaurantId: restaurant.id, previousOwnerId: ownerA, ownerId: ownerB });
    const [afterTransfer] = await db.select({ ownerId: restaurants.ownerId }).from(restaurants).where(eq(restaurants.id, restaurant.id));
    expect(afterTransfer.ownerId).toBe(ownerB);

    const unassigned = await admin.admin.unassignRestaurantOwner({ restaurantId: restaurant.id });
    expect(unassigned).toMatchObject({ restaurantId: restaurant.id, previousOwnerId: ownerB });
    const [afterUnassign] = await db.select({ ownerId: restaurants.ownerId }).from(restaurants).where(isNull(restaurants.ownerId));
    expect(afterUnassign?.ownerId).toBeNull();
  });
});
