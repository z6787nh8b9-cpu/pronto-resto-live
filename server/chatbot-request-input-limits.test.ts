import { describe, expect, it } from "vitest";
import { chatbotRequestListSchema, chatbotRequestStatusSchema, publicChatbotRequestSchema } from "./routers/chatbotRequests";

describe("public assistance request input limits", () => {
  const valid = { type: "call_request" as const, name: "Camille", email: "camille@example.test", phone: "+33600000000", message: "Je souhaite être recontactée.", recaptchaToken: "development-bypass" };

  it("accepts a normal request and rejects oversized values", () => {
    expect(publicChatbotRequestSchema.safeParse(valid).success).toBe(true);
    expect(publicChatbotRequestSchema.safeParse({ ...valid, name: "a".repeat(121) }).success).toBe(false);
    expect(publicChatbotRequestSchema.safeParse({ ...valid, phone: "1".repeat(41) }).success).toBe(false);
    expect(publicChatbotRequestSchema.safeParse({ ...valid, message: "a".repeat(2_001) }).success).toBe(false);
    expect(publicChatbotRequestSchema.safeParse({ ...valid, recaptchaToken: "" }).success).toBe(false);
    expect(publicChatbotRequestSchema.safeParse({ ...valid, recaptchaToken: "t".repeat(4_097) }).success).toBe(false);
  });

  it("requires usable contact details for callback requests without blocking anonymous issue reports", () => {
    expect(publicChatbotRequestSchema.safeParse({ ...valid, email: undefined, phone: undefined }).success).toBe(false);
    expect(publicChatbotRequestSchema.safeParse({ ...valid, type: "issue_report", email: undefined, phone: undefined }).success).toBe(true);
    expect(publicChatbotRequestSchema.safeParse({ ...valid, phone: "not-a-phone" }).success).toBe(false);
    expect(publicChatbotRequestSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
  });

  it("bounds administrative reads and request status updates", () => {
    expect(chatbotRequestListSchema.safeParse(undefined).success).toBe(true);
    expect(chatbotRequestListSchema.safeParse({ limit: 100 }).success).toBe(true);
    expect(chatbotRequestListSchema.safeParse({ limit: 101 }).success).toBe(false);
    expect(chatbotRequestStatusSchema.safeParse({ id: 1, status: "contacted", adminNotes: "Rappel effectué" }).success).toBe(true);
    expect(chatbotRequestStatusSchema.safeParse({ id: 0, status: "contacted" }).success).toBe(false);
    expect(chatbotRequestStatusSchema.safeParse({ id: 1, status: "contacted", adminNotes: "a".repeat(5_001) }).success).toBe(false);
  });
});
