import { describe, expect, it } from "vitest";
import { hasValidMediaSignature, isAcceptedMediaType } from "./media-validation";

describe("media validation", () => {
  it("accepts only explicitly supported media types", () => {
    expect(isAcceptedMediaType("image/webp")).toBe(true);
    expect(isAcceptedMediaType("image/svg+xml")).toBe(false);
    expect(isAcceptedMediaType("text/html")).toBe(false);
  });

  it("validates file signatures instead of trusting the browser MIME type", () => {
    expect(hasValidMediaSignature(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]), "image/png")).toBe(true);
    expect(hasValidMediaSignature(Buffer.from("not-an-image"), "image/png")).toBe(false);
    expect(hasValidMediaSignature(Buffer.from("%PDF-1.7"), "application/pdf")).toBe(true);
    expect(hasValidMediaSignature(Buffer.from("%PDX-1.7"), "application/pdf")).toBe(false);
  });
});
