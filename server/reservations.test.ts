import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { appRouter } from "./routers";

const anonymousCaller = appRouter.createCaller({
  adminAccount: null,
  user: null,
  restaurantOwner: null,
  req: { session: {} },
  res: {},
} as any);

describe("reservation management access", () => {
  it("refuses anonymous management of restaurant settings, zones and reservations", async () => {
    await expect(anonymousCaller.reservations.updateSettings({ restaurantId: 1, slotDuration: 30 })).rejects.toBeInstanceOf(TRPCError);
    await expect(anonymousCaller.reservations.createZone({ restaurantId: 1, name: "Salle", capacity: 20 })).rejects.toBeInstanceOf(TRPCError);
    await expect(anonymousCaller.reservations.getByRestaurant({ restaurantId: 1 })).rejects.toBeInstanceOf(TRPCError);
    await expect(anonymousCaller.reservations.updateStatus({ id: 1, status: "confirmed" })).rejects.toBeInstanceOf(TRPCError);
  });
});
