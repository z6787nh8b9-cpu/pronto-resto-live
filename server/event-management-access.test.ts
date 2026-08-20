import { afterAll, describe, expect, it } from "vitest";
import { inArray } from "drizzle-orm";
import { eventRegistrations, events, restaurantOwners, restaurants } from "../drizzle/schema";
import { getDb } from "./db";
import { appRouter } from "./routers";

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const restaurantIds: number[] = [];
const ownerIds: number[] = [];
const adminCaller = appRouter.createCaller({
  adminAccount: { id: 1, email: "event-management-security@pronto.test" }, restaurantOwner: null, user: null, req: { session: {} }, res: {},
} as any);

async function createOwner(label: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [result] = await db.insert(restaurantOwners).values({
    email: `event-management-${label}-${runId}@example.test`, name: `Événement ${label}`, provider: "email", passwordHash: "test-only-hash",
  });
  const id = Number(result.insertId);
  ownerIds.push(id);
  return id;
}

async function createRestaurant(ownerId: number, label: string) {
  const restaurant = await adminCaller.admin.createRestaurant({
    ownerId, name: `Événement accès ${label}`, slug: `event-management-${label}-${runId}`, subscriptionTier: "premium", subscriptionStatus: "trial",
  });
  restaurantIds.push(restaurant.id);
  return restaurant;
}

afterAll(async () => {
  const db = await getDb();
  if (!db) return;
  if (restaurantIds.length) {
    await db.delete(eventRegistrations).where(inArray(eventRegistrations.restaurantId, restaurantIds));
    await db.delete(events).where(inArray(events.restaurantId, restaurantIds));
    await db.delete(restaurants).where(inArray(restaurants.id, restaurantIds));
  }
  if (ownerIds.length) await db.delete(restaurantOwners).where(inArray(restaurantOwners.id, ownerIds));
});

describe("event management access", () => {
  it("refuses every management operation against another owner’s event and registration", async () => {
    const ownerA = await createOwner("a");
    const ownerB = await createOwner("b");
    const restaurantA = await createRestaurant(ownerA, "a");
    const restaurantB = await createRestaurant(ownerB, "b");
    const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const created = await adminCaller.events.createEvent({
      restaurantId: restaurantB.id, title: "Événement privé", description: "Accès réservé", eventDate: future, maxAttendees: 10,
    });
    const eventId = Number((created as any).insertId);
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const [registrationResult] = await db.insert(eventRegistrations).values({
      eventId, restaurantId: restaurantB.id, customerName: "Client", customerEmail: `client-${runId}@example.test`, customerPhone: "+33612345678",
      numberOfPeople: 1, status: "pending", paymentStatus: "paid", paymentAmount: "0.00",
    });
    const registrationId = Number(registrationResult.insertId);
    const ownerACaller = appRouter.createCaller({
      adminAccount: null, restaurantOwner: { id: ownerA, email: `event-management-a-${runId}@example.test` }, user: null, req: { session: {} }, res: {},
    } as any);

    await expect(ownerACaller.events.getEvents({ restaurantId: restaurantB.id })).rejects.toThrow();
    await expect(ownerACaller.events.createEvent({ restaurantId: restaurantB.id, title: "Intrusion", description: "Tentative", eventDate: future, maxAttendees: 10 })).rejects.toThrow();
    await expect(ownerACaller.events.updateEvent({ eventId, data: { title: "Intrusion" } })).rejects.toThrow();
    await expect(ownerACaller.events.getEventRegistrations({ eventId })).rejects.toThrow();
    await expect(ownerACaller.events.updateRegistrationStatus({ registrationId, status: "confirmed" })).rejects.toThrow();
    await expect(ownerACaller.events.deleteEvent({ eventId })).rejects.toThrow();
    await expect(ownerACaller.events.getEvents({ restaurantId: restaurantA.id })).resolves.toEqual([]);
  });

  it("refuses lowering capacity below existing attendees", async () => {
    const owner = await createOwner("capacity");
    const restaurant = await createRestaurant(owner, "capacity");
    const future = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString();
    const created = await adminCaller.events.createEvent({
      restaurantId: restaurant.id, title: "Capacité", description: "Contrôle de capacité", eventDate: future, maxAttendees: 10,
    });
    const eventId = Number((created as any).insertId);
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db.update(events).set({ currentAttendees: 4 }).where(inArray(events.id, [eventId]));
    const ownerCaller = appRouter.createCaller({
      adminAccount: null, restaurantOwner: { id: owner, email: `event-management-capacity-${runId}@example.test` }, user: null, req: { session: {} }, res: {},
    } as any);
    await expect(ownerCaller.events.updateEvent({ eventId, data: { maxAttendees: 3 } })).rejects.toThrow();
  });
});
