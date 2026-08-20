import { afterAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { openingHours, reservations, reservationSettings, reservationZones, restaurants } from "../drizzle/schema";
import { getDb } from "./db";
import { appRouter } from "./routers";
import { publicReservationSchema } from "./routes/reservations";

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const restaurantIds: number[] = [];
const adminCaller = appRouter.createCaller({
  adminAccount: { id: 1, email: "reservation-security@pronto.test" }, restaurantOwner: null, user: null, req: { session: {} }, res: {},
} as any);
const publicCaller = appRouter.createCaller({ adminAccount: null, restaurantOwner: null, user: null, req: { session: {} }, res: {} } as any);

async function createReservationRestaurant(label: string) {
  const restaurant = await adminCaller.admin.createRestaurant({
    name: `Réservation sécurité ${label}`,
    slug: `reservation-security-${label}-${runId}`,
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
    autoConfirm: true,
  });
  return restaurant;
}

afterAll(async () => {
  if (!restaurantIds.length) return;
  const db = await getDb();
  if (!db) return;
  await db.delete(reservations).where(inArray(reservations.restaurantId, restaurantIds));
  await db.delete(openingHours).where(inArray(openingHours.restaurantId, restaurantIds));
  await db.delete(reservationZones).where(inArray(reservationZones.restaurantId, restaurantIds));
  await db.delete(reservationSettings).where(inArray(reservationSettings.restaurantId, restaurantIds));
  await db.delete(restaurants).where(inArray(restaurants.id, restaurantIds));
});

describe("public reservation security", () => {
  it("enforces bounded, human-verified reservation input", () => {
    const valid = {
      restaurantId: 1,
      customerName: "Cliente Test",
      customerEmail: "client@example.test",
      customerPhone: "+33612345678",
      reservationDate: "2026-08-25T12:00:00.000Z",
      partySize: 2,
      specialRequests: "Sans arachide",
      recaptchaToken: "development-bypass",
    };
    expect(publicReservationSchema.safeParse(valid).success).toBe(true);
    expect(publicReservationSchema.safeParse({ ...valid, customerName: "x".repeat(101) }).success).toBe(false);
    expect(publicReservationSchema.safeParse({ ...valid, customerPhone: "1".repeat(21) }).success).toBe(false);
    expect(publicReservationSchema.safeParse({ ...valid, specialRequests: "x".repeat(501) }).success).toBe(false);
    expect(publicReservationSchema.safeParse({ ...valid, partySize: 21 }).success).toBe(false);
    expect(publicReservationSchema.safeParse({ ...valid, recaptchaToken: "" }).success).toBe(false);
  });

  it("hides public reservation details after an establishment is disabled", async () => {
    const restaurant = await createReservationRestaurant("inactive");
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db.insert(reservationZones).values({ restaurantId: restaurant.id, name: "Salle", capacity: 4, isActive: true, displayOrder: 0 });
    await expect(publicCaller.reservations.getPublicSettings({ restaurantId: restaurant.id })).resolves.toMatchObject({ maxPartySize: 4 });
    await expect(publicCaller.reservations.getPublicZones({ restaurantId: restaurant.id })).resolves.toHaveLength(1);
    await db.update(restaurants).set({ isActive: false }).where(eq(restaurants.id, restaurant.id));
    await expect(publicCaller.reservations.getPublicSettings({ restaurantId: restaurant.id })).rejects.toThrow();
    await expect(publicCaller.reservations.getPublicZones({ restaurantId: restaurant.id })).rejects.toThrow();
  });

  it("hides settings, zones and availability when a Premium establishment disables reservations", async () => {
    const restaurant = await createReservationRestaurant("feature-toggle");
    await adminCaller.restaurant.updateFeatureActivation({ restaurantId: restaurant.id, feature: "reservations", enabled: false });

    await expect(publicCaller.reservations.getPublicSettings({ restaurantId: restaurant.id })).rejects.toThrow();
    await expect(publicCaller.reservations.getPublicZones({ restaurantId: restaurant.id })).rejects.toThrow();
    await expect(publicCaller.reservations.getAvailableSlots({ restaurantId: restaurant.id, date: "2026-08-26", partySize: 2 })).rejects.toThrow();
  });

  it("accepts only one concurrent claim when two reservations exceed the same zone capacity", async () => {
    const restaurant = await createReservationRestaurant("capacity");
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const [zoneResult] = await db.insert(reservationZones).values({ restaurantId: restaurant.id, name: "Terrasse", capacity: 4, isActive: true, displayOrder: 0 });
    const zoneId = Number(zoneResult.insertId);
    const reservationDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    reservationDate.setHours(12, 0, 0, 0);
    await db.insert(openingHours).values({
      restaurantId: restaurant.id,
      dayOfWeek: reservationDate.getDay(),
      openTime: "10:00",
      closeTime: "20:00",
      isClosed: false,
    });
    const input = {
      restaurantId: restaurant.id,
      zoneId,
      customerName: "Client concurrent",
      customerEmail: `client-${runId}@example.test`,
      customerPhone: "+33612345678",
      reservationDate: reservationDate.toISOString(),
      partySize: 3,
      recaptchaToken: "development-bypass",
    };
    const outcomes = await Promise.allSettled([
      publicCaller.reservations.create(input),
      publicCaller.reservations.create({ ...input, customerEmail: `client-second-${runId}@example.test` }),
    ]);
    expect(outcomes.filter((outcome) => outcome.status === "fulfilled")).toHaveLength(1);
    expect(outcomes.filter((outcome) => outcome.status === "rejected")).toHaveLength(1);
  });

  it("computes public availability against the selected zone rather than aggregate venue capacity", async () => {
    const restaurant = await createReservationRestaurant("zone-slots");
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const [terraceResult] = await db.insert(reservationZones).values({ restaurantId: restaurant.id, name: "Terrasse", capacity: 2, isActive: true, displayOrder: 0 });
    const [roomResult] = await db.insert(reservationZones).values({ restaurantId: restaurant.id, name: "Salle", capacity: 2, isActive: true, displayOrder: 1 });
    const terraceId = Number(terraceResult.insertId);
    const roomId = Number(roomResult.insertId);
    const reservationDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    reservationDate.setHours(12, 0, 0, 0);
    await db.insert(openingHours).values({ restaurantId: restaurant.id, dayOfWeek: reservationDate.getDay(), openTime: "10:00", closeTime: "20:00", isClosed: false });
    await db.insert(reservations).values({
      restaurantId: restaurant.id,
      zoneId: terraceId,
      customerName: "Terrasse complète",
      customerEmail: `terrace-${runId}@example.test`,
      customerPhone: "+33612345678",
      partySize: 2,
      reservationDate,
      confirmationToken: `zone-${runId}`,
      status: "confirmed",
    });

    const date = reservationDate.toISOString().slice(0, 10);
    const terraceSlots = await publicCaller.reservations.getAvailableSlots({ restaurantId: restaurant.id, date, partySize: 1, zoneId: terraceId });
    const roomSlots = await publicCaller.reservations.getAvailableSlots({ restaurantId: restaurant.id, date, partySize: 1, zoneId: roomId });

    expect(terraceSlots).not.toContain("12:00");
    expect(roomSlots).toContain("12:00");
  });
});
