import { describe, expect, it } from "vitest";
import { publicChatMessageSchema } from "./routers/chat";

describe("public chatbot input limits", () => {
  it("accepts a bounded useful message and rejects blank or oversized input", () => {
    expect(publicChatMessageSchema.safeParse({ message: "a".repeat(2_000) }).success).toBe(true);
    expect(publicChatMessageSchema.safeParse({ message: "a".repeat(2_001) }).success).toBe(false);
    expect(publicChatMessageSchema.safeParse({ message: "   " }).success).toBe(false);
  });
});
