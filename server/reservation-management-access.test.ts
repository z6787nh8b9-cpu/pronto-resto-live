import { afterAll, describe, expect, it } from "vitest";
import { inArray } from "drizzle-orm";
import { reservationSettings, reservationZones, reservations, restaurantOwners, restaurants } from "../drizzle/schema";
import { getDb } from "./db";
import { appRouter } from "./routers";

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const restaurantIds: number[] = [];
const ownerIds: number[] = [];
const adminCaller = appRouter.createCaller({
  adminAccount: { id: 1, email: "reservation-management-security@pronto.test" }, restaurantOwner: null, user: null, req: { session: {} }, res: {},
} as any);

async function createOwner(label: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [result] = await db.insert(restaurantOwners).values({
    email: `reservation-management-${label}-${runId}@example.test`, name: `Réservation ${label}`, provider: "email", passwordHash: "test-only-hash",
  });
  const id = Number(result.insertId);
  ownerIds.push(id);
  return id;
}

async function createRestaurant(ownerId: number, label: string) {
  const restaurant = await adminCaller.admin.createRestaurant({
    ownerId, name: `Réservation accès ${label}`, slug: `reservation-management-${label}-${runId}`, subscriptionTier: "premium", subscriptionStatus: "trial",
  });
  restaurantIds.push(restaurant.id);
  return restaurant;
}

afterAll(async () => {
  const db = await getDb();
  if (!db) return;
  if (restaurantIds.length) {
    await db.delete(reservations).where(inArray(reservations.restaurantId, restaurantIds));
    await db.delete(reservationZones).where(inArray(reservationZones.restaurantId, restaurantIds));
    await db.delete(reservationSettings).where(inArray(reservationSettings.restaurantId, restaurantIds));
    await db.delete(restaurants).where(inArray(restaurants.id, restaurantIds));
  }
  if (ownerIds.length) await db.delete(restaurantOwners).where(inArray(restaurantOwners.id, ownerIds));
});

describe("reservation management access", () => {
  it("rejects cross-establishment access to reservation data, settings and zones", async () => {
    const ownerA = await createOwner("a");
    const ownerB = await createOwner("b");
    const restaurantA = await createRestaurant(ownerA, "a");
    const restaurantB = await createRestaurant(ownerB, "b");
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const [zoneResult] = await db.insert(reservationZones).values({ restaurantId: restaurantB.id, name: "Terrasse", capacity: 20, isActive: true, displayOrder: 0 });
    const zoneId = Number(zoneResult.insertId);
    const [reservationResult] = await db.insert(reservations).values({
      restaurantId: restaurantB.id, zoneId, customerName: "Client", customerEmail: `client-${runId}@example.test`, customerPhone: "+33612345678",
      partySize: 2, reservationDate: new Date(Date.now() + 86_400_000), status: "pending", confirmationToken: `token-${runId}`,
    });
    const reservationId = Number(reservationResult.insertId);
    const ownerACaller = appRouter.createCaller({
      adminAccount: null, restaurantOwner: { id: ownerA, email: `reservation-management-a-${runId}@example.test` }, user: null, req: { session: {} }, res: {},
    } as any);

    await expect(ownerACaller.reservations.getSettings({ restaurantId: restaurantB.id })).rejects.toThrow();
    await expect(ownerACaller.reservations.updateSettings({ restaurantId: restaurantB.id, slotDuration: 30 })).rejects.toThrow();
    await expect(ownerACaller.reservations.getZones({ restaurantId: restaurantB.id })).rejects.toThrow();
    await expect(ownerACaller.reservations.createZone({ restaurantId: restaurantB.id, name: "Intrusion", capacity: 10 })).rejects.toThrow();
    await expect(ownerACaller.reservations.updateZone({ id: zoneId, name: "Intrusion" })).rejects.toThrow();
    await expect(ownerACaller.reservations.deleteZone({ id: zoneId })).rejects.toThrow();
    await expect(ownerACaller.reservations.getByRestaurant({ restaurantId: restaurantB.id })).rejects.toThrow();
    await expect(ownerACaller.reservations.updateStatus({ id: reservationId, status: "confirmed" })).rejects.toThrow();
    await expect(ownerACaller.reservations.getByRestaurant({ restaurantId: restaurantA.id })).resolves.toEqual([]);
    await expect(ownerACaller.reservations.createZone({ restaurantId: restaurantA.id, name: "x".repeat(101), capacity: 10 })).rejects.toThrow();
  });
});
