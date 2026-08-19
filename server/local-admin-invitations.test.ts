import bcrypt from "bcrypt";
import { createHash } from "crypto";
import { and, eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { adminAccounts, localAdminInvitations } from "../drizzle/schema";
import { getDb } from "./db";
import { appRouter } from "./routers";

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const invitedEmail = `local-admin-${suffix}@example.test`;
const revokedEmail = `local-admin-revoked-${suffix}@example.test`;
const invitePassword = "ProntoLocalAdmin2026";
const adminCaller = appRouter.createCaller({
  adminAccount: { id: 1, email: "root@pronto.test" }, restaurantOwner: null, user: null,
  req: { session: {} }, res: {},
} as any);
const publicCaller = appRouter.createCaller({ adminAccount: null, restaurantOwner: null, user: null, req: { session: {} }, res: {} } as any);

afterAll(async () => {
  const db = await getDb();
  if (!db) return;
  await db.delete(localAdminInvitations).where(eq(localAdminInvitations.email, invitedEmail));
  await db.delete(localAdminInvitations).where(eq(localAdminInvitations.email, revokedEmail));
  await db.delete(adminAccounts).where(eq(adminAccounts.email, invitedEmail));
});

describe("local Super Admin invitations", () => {
  it("binds a hashed one-time invitation to its selected email and creates a local account", async () => {
    const invitation = await adminCaller.admin.createLocalAdminInvitation({ email: invitedEmail, name: "Admin invité" });
    expect(invitation.token).toMatch(/^[a-f0-9]{64}$/i);
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const tokenHash = createHash("sha256").update(invitation.token).digest("hex");
    const [stored] = await db.select().from(localAdminInvitations).where(eq(localAdminInvitations.tokenHash, tokenHash)).limit(1);
    expect(stored?.email).toBe(invitedEmail);
    expect(stored?.tokenHash).not.toBe(invitation.token);

    await expect(publicCaller.admin.acceptLocalAdminInvitation({
      token: invitation.token, email: "wrong@example.test", name: "Admin invité", password: invitePassword,
    })).rejects.toThrow();

    await expect(publicCaller.admin.acceptLocalAdminInvitation({
      token: invitation.token, email: invitedEmail, name: "Admin invité", password: invitePassword,
    })).resolves.toEqual({ success: true });
    const [account] = await db.select().from(adminAccounts).where(eq(adminAccounts.email, invitedEmail)).limit(1);
    expect(account).toBeDefined();
    expect(await bcrypt.compare(invitePassword, account.passwordHash)).toBe(true);
    const [accepted] = await db.select().from(localAdminInvitations).where(eq(localAdminInvitations.id, stored.id)).limit(1);
    expect(accepted?.status).toBe("accepted");

    await expect(publicCaller.admin.acceptLocalAdminInvitation({
      token: invitation.token, email: invitedEmail, name: "Admin invité", password: invitePassword,
    })).rejects.toThrow();
  });

  it("revokes a pending invitation before it can be used", async () => {
    const invitation = await adminCaller.admin.createLocalAdminInvitation({ email: revokedEmail });
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const tokenHash = createHash("sha256").update(invitation.token).digest("hex");
    const [stored] = await db.select({ id: localAdminInvitations.id }).from(localAdminInvitations).where(eq(localAdminInvitations.tokenHash, tokenHash)).limit(1);
    await expect(adminCaller.admin.revokeLocalAdminInvitation({ id: stored.id })).resolves.toEqual({ success: true });
    await expect(publicCaller.admin.checkLocalAdminInvitation({ token: invitation.token })).resolves.toEqual({ valid: false });
    await expect(publicCaller.admin.acceptLocalAdminInvitation({
      token: invitation.token, email: revokedEmail, name: "Admin révoqué", password: invitePassword,
    })).rejects.toThrow();
  });
});
