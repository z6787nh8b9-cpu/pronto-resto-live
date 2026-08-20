/**
 * Admin Authentication Router
 * Handles local session helpers for Super Admin accounts created only through
 * the hashed, email-bound PRONTO invitation flow.
 */

import { z } from "zod";
import bcrypt from "bcrypt";
import { TRPCError } from "@trpc/server";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { adminAccounts } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { passwordPolicyError } from "../password-policy";
import { recordSecurityEvent } from "../security-events";

const SALT_ROUNDS = 10;

export const adminAuthRouter = router({
  /**
   * Logout current admin
   */
  logout: publicProcedure.mutation(async ({ ctx }) => {
    await new Promise<void>((resolve, reject) => ctx.req.session.destroy((error) => error ? reject(error) : resolve()));
    return { success: true };
  }),

  /**
   * Get current admin from session
   */
  me: publicProcedure.query(async ({ ctx }) => {
    const adminId = ctx.req.session.adminId;

    if (!adminId) {
      return null;
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const [admin] = await db
      .select()
      .from(adminAccounts)
      .where(eq(adminAccounts.id, adminId))
      .limit(1);

    if (!admin || ctx.req.session.adminAuthVersion !== admin.authVersion) {
      // Admin not found, clear session
      ctx.req.session.adminId = undefined;
      ctx.req.session.adminAuthVersion = undefined;
      await ctx.req.session.save();
      return null;
    }

    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      avatarUrl: admin.avatarUrl,
    };
  }),

  changePassword: adminProcedure
    .input(z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.adminAccount) throw new TRPCError({ code: "FORBIDDEN", message: "Ce compte n'utilise pas une connexion par mot de passe." });
      const policyError = passwordPolicyError(input.newPassword);
      if (policyError) throw new TRPCError({ code: "BAD_REQUEST", message: policyError });

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const [account] = await db.select().from(adminAccounts).where(eq(adminAccounts.id, ctx.adminAccount.id)).limit(1);
      if (!account || !(await bcrypt.compare(input.currentPassword, account.passwordHash))) {
        await recordSecurityEvent({ req: ctx.req, principalType: "admin", principalId: ctx.adminAccount.id, eventType: "admin.password_change", outcome: "failure" });
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Mot de passe actuel incorrect" });
      }

      const nextAuthVersion = account.authVersion + 1;
      await db.update(adminAccounts).set({
        passwordHash: await bcrypt.hash(input.newPassword, SALT_ROUNDS),
        authVersion: nextAuthVersion,
      }).where(eq(adminAccounts.id, account.id));
      await new Promise<void>((resolve, reject) => ctx.req.session.regenerate((error) => error ? reject(error) : resolve()));
      ctx.req.session.adminId = account.id;
      ctx.req.session.adminAuthVersion = nextAuthVersion;
      await ctx.req.session.save();
      await recordSecurityEvent({ req: ctx.req, principalType: "admin", principalId: account.id, eventType: "admin.password_change", outcome: "success" });
      return { success: true };
    }),
});
