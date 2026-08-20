import { afterAll, describe, expect, it } from "vitest";
import { inArray } from "drizzle-orm";
import { advertisements } from "../drizzle/schema";
import { getDb } from "./db";
import { appRouter } from "./routers";

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const createdIds: number[] = [];
const publicCaller = appRouter.createCaller({ adminAccount: null, restaurantOwner: null, user: null, req: { session: {} }, res: {} } as any);

async function createAdvertisement(title: string, values: Partial<typeof advertisements.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [created] = await db.insert(advertisements).values({
    title,
    format: "footer",
    content: { text: title },
    targetPage: "all",
    displayOrder: 99_999,
    ...values,
  });
  const id = Number(created.insertId);
  createdIds.push(id);
  return id;
}

afterAll(async () => {
  if (!createdIds.length) return;
  const db = await getDb();
  if (db) await db.delete(advertisements).where(inArray(advertisements.id, createdIds));
});

describe("public advertisement windows", () => {
  it("returns only active campaigns whose start and end dates include the current time", async () => {
    const visibleTitle = `Visible ${runId}`;
    const futureTitle = `Future ${runId}`;
    const expiredTitle = `Expired ${runId}`;
    const disabledTitle = `Disabled ${runId}`;
    await createAdvertisement(visibleTitle, { isActive: true });
    await createAdvertisement(futureTitle, { isActive: true, startDate: new Date(Date.now() + 3_600_000) });
    await createAdvertisement(expiredTitle, { isActive: true, endDate: new Date(Date.now() - 3_600_000) });
    await createAdvertisement(disabledTitle, { isActive: false });

    const titles = (await publicCaller.public.getActiveAdvertisements()).map((advertisement) => advertisement.title);
    expect(titles).toContain(visibleTitle);
    expect(titles).not.toContain(futureTitle);
    expect(titles).not.toContain(expiredTitle);
    expect(titles).not.toContain(disabledTitle);
  });
});
