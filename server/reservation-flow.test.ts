import { afterAll, describe, expect, it } from "vitest";
import { inArray } from "drizzle-orm";
import { openingHours, reservations, reservationSettings, reservationZones, restaurantOwners, restaurants } from "../drizzle/schema";
import { getDb } from "./db";
import { appRouter } from "./routers";

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const restaurantIds: number[] = [];
const ownerIds: number[] = [];

const adminCaller = appRouter.createCaller({
  adminAccount: { id: 1, email: "reservation-flow-admin@pronto.test" },
  restaurantOwner: null,
  user: null,
  req: { session: {} },
  res: {},
} as any);

afterAll(async () => {
  const db = await getDb();
  if (!db) return;

  if (restaurantIds.length) {
    await db.delete(reservations).where(inArray(reservations.restaurantId, restaurantIds));
    await db.delete(openingHours).where(inArray(openingHours.restaurantId, restaurantIds));
    await db.delete(reservationZones).where(inArray(reservationZones.restaurantId, restaurantIds));
    await db.delete(reservationSettings).where(inArray(reservationSettings.restaurantId, restaurantIds));
    await db.delete(restaurants).where(inArray(restaurants.id, restaurantIds));
  }
  if (ownerIds.length) await db.delete(restaurantOwners).where(inArray(restaurantOwners.id, ownerIds));
});

describe("parcours de réservation public", () => {
  it("propose un créneau, crée une demande puis permet sa confirmation par le propriétaire", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const ownerEmail = `reservation-flow-owner-${runId}@example.test`;
    const [ownerResult] = await db.insert(restaurantOwners).values({
      email: ownerEmail,
      name: "Propriétaire réservation test",
      provider: "email",
      passwordHash: "test-only-hash",
    });
    const ownerId = Number(ownerResult.insertId);
    ownerIds.push(ownerId);

    const restaurant = await adminCaller.admin.createRestaurant({
      ownerId,
      name: "Établissement réservation test",
      slug: `reservation-flow-${runId}`,
      subscriptionTier: "premium",
      subscriptionStatus: "trial",
    });
    restaurantIds.push(restaurant.id);

    await adminCaller.reservations.updateSettings({
      restaurantId: restaurant.id,
      slotDuration: 60,
      advanceBookingDays: 30,
      minAdvanceHours: 1,
      defaultTableSize: 4,
      maxPartySize: 4,
      autoConfirm: false,
    });
    const createdZone = await adminCaller.reservations.createZone({
      restaurantId: restaurant.id,
      name: "Salle principale",
      capacity: 4,
      displayOrder: 0,
    });
    const zoneId = Number(createdZone.id);
    const reservationDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    reservationDate.setHours(12, 0, 0, 0);
    await db.insert(openingHours).values({
      restaurantId: restaurant.id,
      dayOfWeek: reservationDate.getDay(),
      openTime: "10:00",
      closeTime: "20:00",
      isClosed: false,
    });

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
    const date = reservationDate.toISOString().slice(0, 10);

    await expect(publicCaller.reservations.getAvailableSlots({
      restaurantId: restaurant.id,
      date,
      partySize: 2,
      zoneId,
    })).resolves.toContain("12:00");

    const created = await publicCaller.reservations.create({
      restaurantId: restaurant.id,
      zoneId,
      customerName: "Camille Martin",
      customerEmail: `camille-${runId}@example.test`,
      customerPhone: "+33612345678",
      reservationDate: reservationDate.toISOString(),
      partySize: 2,
      specialRequests: "Table calme si possible.",
      recaptchaToken: "development-bypass",
    });
    expect(created.status).toBe("pending");
    expect(created.confirmationToken).toMatch(/^[A-Za-z0-9_-]{40,}$/);

    const dashboardReservations = await ownerCaller.reservations.getByRestaurant({ restaurantId: restaurant.id });
    expect(dashboardReservations).toHaveLength(1);
    expect(dashboardReservations[0]).toMatchObject({
      id: created.id,
      customerName: "Camille Martin",
      partySize: 2,
      status: "pending",
      zoneId,
    });

    await ownerCaller.reservations.updateStatus({ id: created.id, status: "confirmed" });
    const confirmedReservations = await ownerCaller.reservations.getByRestaurant({
      restaurantId: restaurant.id,
      status: "confirmed",
    });
    expect(confirmedReservations).toHaveLength(1);
    expect(confirmedReservations[0]?.confirmedAt).toBeInstanceOf(Date);

    await expect(publicCaller.reservations.getAvailableSlots({
      restaurantId: restaurant.id,
      date,
      partySize: 3,
      zoneId,
    })).resolves.not.toContain("12:00");
  });
});
