/**
 * Admin OAuth Authentication Configuration
 * Handles Google OAuth for admin invitations (separate from restaurant owners)
 */

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { getDb } from "./db";
import { adminAccounts, adminInvitations } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// Get OAuth credentials from environment (reuse existing Google credentials)
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

// Base URL for callbacks
let callbackBaseURL = "http://localhost:3000";

export function setAdminCallbackBaseURL(url: string) {
  callbackBaseURL = url;
}

/**
 * Initialize Passport strategy for admin Google OAuth
 */
export function initializeAdminGoogleStrategy() {
  // Google OAuth Strategy for Admins
  passport.use(
    "google-admin",
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: `${callbackBaseURL}/api/auth/admin-google/callback`,
        passReqToCallback: true,
      },
      async (req: any, accessToken, refreshToken, profile, done) => {
        try {
          const db = await getDb();
          if (!db) {
            return done(new Error("Database not available"), undefined);
          }

          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("No email found in Google profile"), undefined);
          }

          const providerId = profile.id;

          // Check if there's an invitation token in the session
          const invitationToken = req.session?.adminInvitationToken;
          if (!invitationToken) {
            return done(new Error("No invitation token found"), undefined);
          }

          // Verify invitation
          const [invitation] = await db
            .select()
            .from(adminInvitations)
            .where(eq(adminInvitations.token, invitationToken))
            .limit(1);

          if (!invitation) {
            return done(new Error("Invalid invitation"), undefined);
          }

          if (invitation.usedAt) {
            return done(new Error("This invitation has already been used"), undefined);
          }

          const now = new Date();
          if (invitation.expiresAt < now) {
            return done(new Error("This invitation has expired"), undefined);
          }

          // Check if admin account already exists with this Google ID
          const [existingAdmin] = await db
            .select()
            .from(adminAccounts)
            .where(eq(adminAccounts.googleId, providerId))
            .limit(1);

          let admin = existingAdmin;

          // If admin doesn't exist, create new admin account
          if (!admin) {
            const [newAdmin] = await db.insert(adminAccounts).values({
              email,
              name: profile.displayName || email,
              avatarUrl: profile.photos?.[0]?.value || null,
              googleId: providerId,
              invitationId: invitation.id,
            });

            const [newAdminData] = await db
              .select()
              .from(adminAccounts)
              .where(eq(adminAccounts.id, newAdmin.insertId))
              .limit(1);
            admin = newAdminData;

            // Mark invitation as used
            await db
              .update(adminInvitations)
              .set({
                usedAt: now,
                usedBy: admin!.id,
              })
              .where(eq(adminInvitations.id, invitation.id));
          } else {
            // Update last sign in
            await db
              .update(adminAccounts)
              .set({ lastSignedIn: now })
              .where(eq(adminAccounts.id, admin.id));
          }

          // Clear invitation token from session
          delete req.session.adminInvitationToken;

          // Store admin session
          req.session.adminAccountId = admin!.id;

          done(null, admin as any);
        } catch (error) {
          done(error as Error, undefined);
        }
      }
    )
  );
}
