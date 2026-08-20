import { describe, expect, it } from "vitest";
import { isSafeAssetKey } from "./_core/storageProxy";

describe("asset proxy key validation", () => {
  it("accepts storage keys produced by the supported upload flows", () => {
    expect(isSafeAssetKey("uploads/42/menu-cover.png")).toBe(true);
    expect(isSafeAssetKey("restaurants/7/hero/photo-abc123.webp")).toBe(true);
    expect(isSafeAssetKey("businesses/10/media/uuid-image.jpg")).toBe(true);
  });

  it("rejects traversal, ambiguous separators and excessive paths before presigning", () => {
    expect(isSafeAssetKey("../private-file")).toBe(false);
    expect(isSafeAssetKey("uploads//42/image.png")).toBe(false);
    expect(isSafeAssetKey("uploads\\42\\image.png")).toBe(false);
    expect(isSafeAssetKey("/uploads/42/image.png")).toBe(false);
    expect(isSafeAssetKey("uploads/42/../private-file")).toBe(false);
    expect(isSafeAssetKey("a".repeat(513))).toBe(false);
  });
});
