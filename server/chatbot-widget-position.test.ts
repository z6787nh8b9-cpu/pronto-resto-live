import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("landing assistance placement", () => {
  it("keeps the floating assistance below the mobile hero actions", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/components/ChatbotWidget.tsx"), "utf8");

    expect(source).toContain("fixed bottom-4 right-4 h-16 w-16");
    expect(source).toContain("sm:bottom-6 sm:right-6 sm:h-20 sm:w-20");
    expect(source).toContain('aria-label="Ouvrir l’assistance PRONTO"');
    expect(source).toContain('aria-haspopup="dialog"');
    expect(source).toContain('role="dialog"');
    expect(source).toContain('aria-modal="true"');
    expect(source).toContain('aria-labelledby="pronto-assistance-title"');
    expect(source).toContain('aria-label="Fermer l’assistance"');
    expect(source).toContain("const handleDialogKeyDown");
    expect(source).toContain('event.key === "Escape"');
    expect(source).toContain('event.key !== "Tab"');
    expect(source).toContain("triggerRef.current?.focus()");
    expect(source).not.toContain("fixed bottom-24 right-6 h-20 w-20");
  });
});
