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

// Determine callback URL based on environment
const CALLBACK_URL = process.env.NODE_ENV === "production"
  ? "https://pronto.page/api/auth/admin-google/callback"
  : "http://localhost:3000/api/auth/admin-google/callback";

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
        callbackURL: CALLBACK_URL,
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
            console.log('[Admin OAuth] Creating new admin account for:', email);
            const result = await db.insert(adminAccounts).values({
              email,
              name: profile.displayName || email,
              avatarUrl: profile.photos?.[0]?.value || null,
              googleId: providerId,
              invitationId: invitation.id,
            });

            console.log('[Admin OAuth] Insert result:', result);

            const insertedId = Number(result[0].insertId);
            if (!insertedId) {
              console.error('[Admin OAuth] Failed to get insertId from database');
              return done(new Error('Failed to create admin account'), undefined);
            }

            const [newAdminData] = await db
              .select()
              .from(adminAccounts)
              .where(eq(adminAccounts.id, insertedId))
              .limit(1);
            
            if (!newAdminData) {
              console.error('[Admin OAuth] Failed to retrieve newly created admin');
              return done(new Error('Failed to retrieve admin account'), undefined);
            }
            
            admin = newAdminData;
            console.log('[Admin OAuth] Admin account created successfully:', admin.id);

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

          console.log('[Admin OAuth] Authentication successful for admin:', admin.id);
          return done(null, admin);
        } catch (error) {
          done(error as Error, undefined);
        }
      }
    )
  );
}
