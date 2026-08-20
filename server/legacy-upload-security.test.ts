import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("legacy upload security", () => {
  it("uses the shared media allowlist, strict decoder and signature checks", () => {
    const genericUpload = readFileSync(resolve(process.cwd(), "server/routers/upload.ts"), "utf8");
    const catalogUpload = readFileSync(resolve(process.cwd(), "server/routers/restaurant.ts"), "utf8");

    for (const source of [genericUpload, catalogUpload]) {
      expect(source).toContain("decodeStrictBase64");
      expect(source).toContain("hasValidMediaSignature");
      expect(source).toContain("5 * 1024 * 1024");
      expect(source).toContain("mediaExtension");
    }
    expect(genericUpload).toContain("base64Match[1] !== input.mimeType");
    expect(catalogUpload).toContain('import { acceptedMediaTypes } from "../media-validation"');
    expect(catalogUpload).toContain("z.enum(acceptedMediaTypes)");
  });
});
