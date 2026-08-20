import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("chatbot response formatting", () => {
  it("keeps the server-side formatter free of markdown list markers", () => {
    const source = readFileSync(resolve(process.cwd(), "server/routers/chat.ts"), "utf8");

    expect(source).toContain("replace(/^- /gm, \"\")");
    expect(source).toContain('replace(/\\*\\*/g, "")');
  });
});
