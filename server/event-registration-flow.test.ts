import { afterAll, describe, expect, it, vi } from "vitest";
import { inArray } from "drizzle-orm";

vi.mock("./_core/recaptcha", () => ({
  verifyRecaptcha: vi.fn().mockResolvedValue(true),
}));

import { eventRegistrations, events, restaurantOwners, restaurants } from "../drizzle/schema";
import { getDb } from "./db";
import { appRouter } from "./routers";

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const restaurantIds: number[] = [];
const ownerIds: number[] = [];

const adminCaller = appRouter.createCaller({
  adminAccount: { id: 1, email: "event-flow-admin@pronto.test" },
  restaurantOwner: null,
  user: null,
  req: { session: {} },
  res: {},
} as any);

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

describe("parcours événementiel public", () => {
  it("crée, publie et inscrit un visiteur sans exposer un brouillon", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const ownerEmail = `event-flow-owner-${runId}@example.test`;
    const [ownerResult] = await db.insert(restaurantOwners).values({
      email: ownerEmail,
      name: "Propriétaire événement test",
      provider: "email",
      passwordHash: "test-only-hash",
    });
    const ownerId = Number(ownerResult.insertId);
    ownerIds.push(ownerId);

    const restaurant = await adminCaller.admin.createRestaurant({
      ownerId,
      name: "Établissement événement test",
      slug: `event-flow-${runId}`,
      subscriptionTier: "premium",
      subscriptionStatus: "trial",
    });
    restaurantIds.push(restaurant.id);

    const ownerCaller = appRouter.createCaller({
      adminAccount: null,
      restaurantOwner: { id: ownerId, email: ownerEmail },
      user: null,
      req: { session: {} },
      res: {},
    } as any);
    const publicCaller = appRouter.createCaller({
      adminAccount: null,
      restaurantOwner: null,
      user: null,
      req: { session: {} },
      res: {},
    } as any);
    const eventDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

    const draft = await ownerCaller.events.createEvent({
      restaurantId: restaurant.id,
      title: "Atelier de dégustation",
      description: "Une dégustation test avec réservation publique.",
      eventDate,
      maxAttendees: 8,
      price: 0,
      requiresApproval: false,
    });
    const eventId = Number((draft as any).insertId);

    await expect(publicCaller.events.getPublicEvents({ restaurantId: restaurant.id })).resolves.toEqual([]);

    await ownerCaller.events.updateEvent({
      eventId,
      data: { status: "published", isVisible: true },
    });

    const visibleEvents = await publicCaller.events.getPublicEvents({ restaurantId: restaurant.id });
    expect(visibleEvents).toHaveLength(1);
    expect(visibleEvents[0]?.id).toBe(eventId);

    await publicCaller.events.registerForEvent({
      eventId,
      restaurantId: restaurant.id,
      customerName: "Camille Martin",
      customerEmail: `camille-${runId}@example.test`,
      customerPhone: "+33612345678",
      numberOfPeople: 2,
      specialRequests: "Option végétarienne si possible.",
      recaptchaToken: "test-pass",
    });

    const registrations = await ownerCaller.events.getEventRegistrations({ eventId });
    expect(registrations).toHaveLength(1);
    expect(registrations[0]).toMatchObject({
      eventId,
      restaurantId: restaurant.id,
      customerName: "Camille Martin",
      numberOfPeople: 2,
      status: "confirmed",
      paymentStatus: "paid",
    });
    expect(registrations[0]?.confirmationToken).toMatch(/^[A-Za-z0-9_-]{40,}$/);

    const [storedEvent] = await db.select().from(events).where(inArray(events.id, [eventId]));
    expect(storedEvent?.currentAttendees).toBe(2);
  });
});
