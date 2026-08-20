import { describe, expect, it } from "vitest";
import { publicChatbotRequestSchema } from "./routers/chatbotRequests";

describe("public assistance request input limits", () => {
  const valid = { type: "call_request" as const, name: "Camille", email: "camille@example.test", phone: "+33600000000", message: "Je souhaite être recontactée.", recaptchaToken: "development-bypass" };

  it("accepts a normal request and rejects oversized values", () => {
    expect(publicChatbotRequestSchema.safeParse(valid).success).toBe(true);
    expect(publicChatbotRequestSchema.safeParse({ ...valid, name: "a".repeat(121) }).success).toBe(false);
    expect(publicChatbotRequestSchema.safeParse({ ...valid, phone: "1".repeat(41) }).success).toBe(false);
    expect(publicChatbotRequestSchema.safeParse({ ...valid, message: "a".repeat(2_001) }).success).toBe(false);
    expect(publicChatbotRequestSchema.safeParse({ ...valid, recaptchaToken: "" }).success).toBe(false);
  });
});
