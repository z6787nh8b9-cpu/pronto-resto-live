import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("public assistance request reCAPTCHA", () => {
  it("verifies a purpose-bound token before persisting a request", () => {
    const router = readFileSync(resolve(process.cwd(), "server/routers/chatbotRequests.ts"), "utf8");
    const widget = readFileSync(resolve(process.cwd(), "client/src/components/ChatbotWidget.tsx"), "utf8");

    expect(router).toContain('verifyRecaptcha(input.recaptchaToken, "submit_assistance_request")');
    expect(router).toContain('code: "FORBIDDEN"');
    expect(widget).toContain('executeRecaptcha("submit_assistance_request")');
    expect(widget).toContain("recaptchaToken,");
  });
});
