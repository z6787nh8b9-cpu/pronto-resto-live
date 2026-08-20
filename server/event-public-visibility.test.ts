import { afterAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { events, restaurants } from "../drizzle/schema";
import { getDb } from "./db";
import { appRouter } from "./routers";

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const restaurantIds: number[] = [];
const adminCaller = appRouter.createCaller({
  adminAccount: { id: 1, email: "event-security@pronto.test" }, restaurantOwner: null, user: null, req: { session: {} }, res: {},
} as any);
const publicCaller = appRouter.createCaller({ adminAccount: null, restaurantOwner: null, user: null, req: { session: {} }, res: {} } as any);

async function createRestaurant(label: string) {
  const restaurant = await adminCaller.admin.createRestaurant({
    name: `Event security ${label}`,
    slug: `event-security-${label}-${runId}`,
    subscriptionTier: "menu",
    subscriptionStatus: "trial",
  });
  restaurantIds.push(restaurant.id);
  return restaurant;
}

async function createEvent(restaurantId: number, overrides: Partial<typeof events.$inferInsert> = {}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [created] = await db.insert(events).values({
    restaurantId,
    title: `Événement test ${Math.random().toString(36).slice(2, 8)}`,
    description: "Événement de sécurité réservé aux régressions.",
    eventDate: new Date(Date.now() + 86_400_000),
    maxAttendees: 20,
    status: "published",
    isVisible: true,
    ...overrides,
  });
  return Number(created.insertId);
}

afterAll(async () => {
  if (!restaurantIds.length) return;
  const db = await getDb();
  if (!db) return;
  await db.delete(events).where(inArray(events.restaurantId, restaurantIds));
  await db.delete(restaurants).where(inArray(restaurants.id, restaurantIds));
});

describe("public event visibility", () => {
  it("lists and reads only a current, published and visible event", async () => {
    const restaurant = await createRestaurant("states");
    const visibleId = await createEvent(restaurant.id);
    const draftId = await createEvent(restaurant.id, { status: "draft" });
    const hiddenId = await createEvent(restaurant.id, { isVisible: false });
    const pastId = await createEvent(restaurant.id, { eventDate: new Date(Date.now() - 60_000) });

    const listed = await publicCaller.events.getPublicEvents({ restaurantId: restaurant.id });
    expect(listed.map((event) => event.id)).toEqual([visibleId]);
    await expect(publicCaller.events.getEvent({ eventId: visibleId })).resolves.toMatchObject({ id: visibleId });
    await expect(publicCaller.events.getEvent({ eventId: draftId })).rejects.toThrow();
    await expect(publicCaller.events.getEvent({ eventId: hiddenId })).rejects.toThrow();
    await expect(publicCaller.events.getEvent({ eventId: pastId })).rejects.toThrow();
  });

  it("hides all event data when its restaurant is inactive and rejects invalid identifiers", async () => {
    const restaurant = await createRestaurant("inactive");
    const eventId = await createEvent(restaurant.id);
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db.update(restaurants).set({ isActive: false }).where(eq(restaurants.id, restaurant.id));

    await expect(publicCaller.events.getPublicEvents({ restaurantId: restaurant.id })).resolves.toEqual([]);
    await expect(publicCaller.events.getEvent({ eventId })).rejects.toThrow();
    await expect(publicCaller.events.getEvent({ eventId: 0 })).rejects.toThrow();
  });
});
