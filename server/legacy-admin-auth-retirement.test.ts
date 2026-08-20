import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

describe("legacy Super Admin registration retirement", () => {
  it("removes the historical public registration procedure while retaining local session helpers", () => {
    const procedures = Object.keys(appRouter._def.procedures);

    expect(procedures).not.toContain("adminAuth.register");
    expect(procedures).toContain("admin.acceptLocalAdminInvitation");
    expect(procedures).toContain("adminAuth.changePassword");
  });

  it("keeps only the hashed, email-bound local invitation path in executable Super Admin code", () => {
    const adminAuthSource = readFileSync(resolve(process.cwd(), "server/routers/adminAuth.ts"), "utf8");
    const adminSource = readFileSync(resolve(process.cwd(), "server/routers/admin.ts"), "utf8");

    expect(adminAuthSource).not.toContain("adminInvitations");
    expect(adminAuthSource).not.toContain("register:");
    expect(adminSource).toContain("localAdminInvitations");
    expect(adminSource).toContain("tokenHash");
    expect(adminSource).toContain("invite.email !== email");
  });
});
