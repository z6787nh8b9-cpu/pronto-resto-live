/**
 * Admin Authentication Router
 * Handles simple email/password authentication for invited admins
 */

import { z } from "zod";
import bcrypt from "bcrypt";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { adminAccounts, adminInvitations } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const SALT_ROUNDS = 10;

export const adminAuthRouter = router({
  /**
   * Register a new admin account using an invitation token
   */
  register: publicProcedure
    .input(
      z.object({
        token: z.string().min(1, "Token is required"),
        email: z.string().email("Invalid email"),
        name: z.string().min(1, "Name is required"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verify invitation token exists and is not expired or used
      const [invitation] = await db
        .select()
        .from(adminInvitations)
        .where(eq(adminInvitations.token, input.token))
        .limit(1);

      if (!invitation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invalid invitation token" });
      }

      if (invitation.usedAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This invitation has already been used" });
      }

      if (new Date() > invitation.expiresAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This invitation has expired" });
      }

      // Check if email is already taken
      const [existingAdmin] = await db
        .select()
        .from(adminAccounts)
        .where(eq(adminAccounts.email, input.email))
        .limit(1);

      if (existingAdmin) {
        throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

      // Create admin account
      const result = await db.insert(adminAccounts).values({
        email: input.email,
        name: input.name,
        passwordHash,
        invitationToken: input.token,
      });

      const insertedId = Number(result[0].insertId);

      // Mark invitation as used
      await db
        .update(adminInvitations)
        .set({
          usedAt: new Date(),
          usedBy: input.email,
        })
        .where(eq(adminInvitations.token, input.token));

      // Get the created admin
      const [newAdmin] = await db
        .select()
        .from(adminAccounts)
        .where(eq(adminAccounts.id, insertedId))
        .limit(1);

      if (!newAdmin) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create admin account" });
      }

      // Store admin ID in session
      ctx.req.session.adminId = newAdmin.id;
      await ctx.req.session.save();

      return {
        success: true,
        admin: {
          id: newAdmin.id,
          email: newAdmin.email,
          name: newAdmin.name,
        },
      };
    }),

  /**
   * Login with email and password
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email"),
        password: z.string().min(1, "Password is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      console.log('[Admin Login] Starting login attempt for:', input.email);
      
      const db = await getDb();
      if (!db) {
        console.error('[Admin Login] Database not available');
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      // Find admin by email
      console.log('[Admin Login] Searching for admin in database...');
      const [admin] = await db
        .select()
        .from(adminAccounts)
        .where(eq(adminAccounts.email, input.email))
        .limit(1);

      if (!admin) {
        console.error('[Admin Login] Admin not found for email:', input.email);
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }

      console.log('[Admin Login] Admin found, ID:', admin.id);

      // Verify password
      console.log('[Admin Login] Verifying password...');
      const isValidPassword = await bcrypt.compare(input.password, admin.passwordHash);

      if (!isValidPassword) {
        console.error('[Admin Login] Invalid password for:', input.email);
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }

      console.log('[Admin Login] Password valid, updating last signed in...');

      // Update last signed in
      await db
        .update(adminAccounts)
        .set({ lastSignedIn: new Date() })
        .where(eq(adminAccounts.id, admin.id));

      console.log('[Admin Login] Storing admin ID in session:', admin.id);

      // Store admin ID in session
      ctx.req.session.adminId = admin.id;
      await ctx.req.session.save();

      console.log('[Admin Login] Session saved successfully');

      return {
        success: true,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
        },
      };
    }),

  /**
   * Logout current admin
   */
  logout: publicProcedure.mutation(async ({ ctx }) => {
    if (ctx.req.session.adminId) {
      ctx.req.session.adminId = undefined;
      await ctx.req.session.save();
    }

    return { success: true };
  }),

  /**
   * Login with email only (magic link)
   */
  loginWithEmail: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Find admin by email
      const [admin] = await db
        .select()
        .from(adminAccounts)
        .where(eq(adminAccounts.email, input.email))
        .limit(1);

      if (!admin) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Admin account not found" });
      }

      // Update last signed in
      await db
        .update(adminAccounts)
        .set({ lastSignedIn: new Date() })
        .where(eq(adminAccounts.id, admin.id));

      // Store admin ID in session
      ctx.req.session.adminId = admin.id;
      await ctx.req.session.save();

      return {
        success: true,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
        },
      };
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

    if (!admin) {
      // Admin not found, clear session
      ctx.req.session.adminId = undefined;
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
});
