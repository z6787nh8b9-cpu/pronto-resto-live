import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { publicEventRegistrationSchema } from "./routers/events";

const validRegistration = {
  eventId: 15,
  restaurantId: 4,
  customerName: "Camille Martin",
  customerEmail: "camille@example.test",
  customerPhone: "+33612345678",
  numberOfPeople: 2,
  specialRequests: "Option végétarienne si possible.",
  recaptchaToken: "development-bypass",
};

describe("public event registration security", () => {
  it("bounds and normalizes every visitor-controlled field", () => {
    const parsed = publicEventRegistrationSchema.parse({ ...validRegistration, customerName: "  Camille Martin  " });

    expect(parsed.customerName).toBe("Camille Martin");
    expect(publicEventRegistrationSchema.safeParse({ ...validRegistration, customerName: "x".repeat(101) }).success).toBe(false);
    expect(publicEventRegistrationSchema.safeParse({ ...validRegistration, customerEmail: "x".repeat(250) + "@test.fr" }).success).toBe(false);
    expect(publicEventRegistrationSchema.safeParse({ ...validRegistration, customerPhone: "1".repeat(21) }).success).toBe(false);
    expect(publicEventRegistrationSchema.safeParse({ ...validRegistration, numberOfPeople: 21 }).success).toBe(false);
    expect(publicEventRegistrationSchema.safeParse({ ...validRegistration, specialRequests: "x".repeat(501) }).success).toBe(false);
    expect(publicEventRegistrationSchema.safeParse({ ...validRegistration, recaptchaToken: "" }).success).toBe(false);
  });

  it("enforces anti-spam, event visibility, tenant ownership and an atomic capacity claim", () => {
    const source = readFileSync(resolve(process.cwd(), "server/routers/events.ts"), "utf8");
    const registrationProcedure = source.split("// Protected: Get all events for restaurant owner")[0];

    expect(registrationProcedure).toContain('verifyRecaptcha(input.recaptchaToken, "register_for_event")');
    expect(registrationProcedure).toContain("event.restaurantId !== input.restaurantId");
    expect(registrationProcedure).toContain('event.status !== "published"');
    expect(registrationProcedure).toContain("!event.isVisible");
    expect(registrationProcedure).toContain("!restaurant?.isActive");
    expect(registrationProcedure).toContain("return await db.transaction");
    expect(registrationProcedure).toContain("currentAttendees} + ${input.numberOfPeople}");
    expect(registrationProcedure).toContain("capacityClaim[0]?.affectedRows");
    expect(registrationProcedure).toContain("restaurantId: event.restaurantId");
    expect(registrationProcedure).not.toContain("currentAttendees: event.currentAttendees + input.numberOfPeople");
  });
});
