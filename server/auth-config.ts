/**
 * OAuth Authentication Configuration
 * Handles Google and Facebook OAuth for restaurant owners
 */

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { getDb } from "./db";
import { restaurantOwners, invitations, restaurants } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

// Get OAuth credentials from environment
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET!;

// Base URL for callbacks - use PUBLIC_URL from environment or fallback to localhost
const callbackBaseURL = process.env.PUBLIC_URL || "http://localhost:3000";

console.log('[OAuth Config] Using callback base URL:', callbackBaseURL);

/**
 * Initialize Passport with OAuth strategies
 */
export function initializePassport() {
  // Serialize user to session (supports both restaurant owners and admin accounts)
  passport.serializeUser((user: any, done) => {
    // Differentiate between restaurant owners and admin accounts
    if (user.googleId && !user.facebookId) {
      // Could be either - check if it has invitationId (admin) or restaurantId (owner)
      if (user.invitationId !== undefined) {
        done(null, `admin:${user.id}`);
      } else {
        done(null, `owner:${user.id}`);
      }
    } else if (user.facebookId) {
      done(null, `owner:${user.id}`);
    } else {
      done(null, `owner:${user.id}`); // Default to owner
    }
  });

  // Deserialize user from session (supports both types)
  passport.deserializeUser(async (id: string, done) => {
    try {
      const db = await getDb();
      if (!db) {
        return done(new Error("Database not available"), null);
      }

      const [type, userId] = id.split(':');
      const numericId = parseInt(userId, 10);

      if (type === 'admin') {
        const { adminAccounts } = await import('../drizzle/schema');
        const [admin] = await db.select().from(adminAccounts).where(eq(adminAccounts.id, numericId)).limit(1);
        done(null, admin || null);
      } else {
        const [owner] = await db.select().from(restaurantOwners).where(eq(restaurantOwners.id, numericId)).limit(1);
        done(null, owner || null);
      }
    } catch (error) {
      done(error, null);
    }
  });

  // Google OAuth Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: `${callbackBaseURL}/api/auth/google/callback`,
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

          // Check if restaurant owner already exists
          const [existingOwner] = await db
            .select()
            .from(restaurantOwners)
            .where(
              and(
                eq(restaurantOwners.email, email),
                eq(restaurantOwners.provider, "google")
              )
            )
            .limit(1);
          let owner = existingOwner;

          // If owner doesn't exist, create new owner
          if (!owner) {
            const [newOwner] = await db.insert(restaurantOwners).values({
              email,
              name: profile.displayName || email,
              avatarUrl: profile.photos?.[0]?.value || null,
              provider: "google",
              providerId,
            });

            const [newOwnerData] = await db
              .select()
              .from(restaurantOwners)
              .where(eq(restaurantOwners.id, newOwner.insertId))
              .limit(1);
            owner = newOwnerData;
          } else {
            // Update last sign in
            await db
              .update(restaurantOwners)
              .set({ lastSignedIn: new Date() })
              .where(eq(restaurantOwners.id, owner.id));
          }

          // Check if there's an invitation token in the session
          const invitationToken = req.session?.invitationToken;
          if (invitationToken && owner) {
            // Process invitation
            const [invitation] = await db
              .select()
              .from(invitations)
              .where(eq(invitations.token, invitationToken))
              .limit(1);

            if (invitation && invitation.status === "pending") {
              const now = new Date();
              if (invitation.expiresAt > now) {
                // Mark invitation as accepted
                await db
                  .update(invitations)
                  .set({
                    status: "accepted",
                    acceptedBy: owner.id,
                    acceptedAt: now,
                  })
                  .where(eq(invitations.id, invitation.id));

                // Update restaurant owner
                await db
                  .update(restaurants)
                  .set({ ownerId: owner.id })
                  .where(eq(restaurants.id, invitation.restaurantId));

                // Store restaurant ID in session for redirect
                req.session.claimedRestaurantId = invitation.restaurantId;
              } else {
                // Mark as expired
                await db
                  .update(invitations)
                  .set({ status: "expired" })
                  .where(eq(invitations.id, invitation.id));
              }
            }

            // Clear invitation token from session
            delete req.session.invitationToken;
          }

          done(null, owner);
        } catch (error) {
          done(error as Error, undefined);
        }
      }
    )
  );

  // Facebook OAuth Strategy
  passport.use(
    new FacebookStrategy(
      {
        clientID: FACEBOOK_APP_ID,
        clientSecret: FACEBOOK_APP_SECRET,
        callbackURL: `${callbackBaseURL}/api/auth/facebook/callback`,
        profileFields: ["id", "emails", "name", "picture"],
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
            return done(new Error("No email found in Facebook profile"), undefined);
          }

          const providerId = profile.id;

          // Check if restaurant owner already exists
          const [existingOwner] = await db
            .select()
            .from(restaurantOwners)
            .where(
              and(
                eq(restaurantOwners.email, email),
                eq(restaurantOwners.provider, "facebook")
              )
            )
            .limit(1);
          let owner = existingOwner;

          // If owner doesn't exist, create new owner
          if (!owner) {
            const displayName = `${profile.name?.givenName || ""} ${profile.name?.familyName || ""}`.trim() || email;
            const [newOwner] = await db.insert(restaurantOwners).values({
              email,
              name: displayName,
              avatarUrl: profile.photos?.[0]?.value || null,
              provider: "facebook",
              providerId,
            });

            const [newOwnerData] = await db
              .select()
              .from(restaurantOwners)
              .where(eq(restaurantOwners.id, newOwner.insertId))
              .limit(1);
            owner = newOwnerData;
          } else {
            // Update last sign in
            await db
              .update(restaurantOwners)
              .set({ lastSignedIn: new Date() })
              .where(eq(restaurantOwners.id, owner.id));
          }

          // Check if there's an invitation token in the session
          const invitationToken = req.session?.invitationToken;
          if (invitationToken && owner) {
            // Process invitation
            const [invitation] = await db
              .select()
              .from(invitations)
              .where(eq(invitations.token, invitationToken))
              .limit(1);

            if (invitation && invitation.status === "pending") {
              const now = new Date();
              if (invitation.expiresAt > now) {
                // Mark invitation as accepted
                await db
                  .update(invitations)
                  .set({
                    status: "accepted",
                    acceptedBy: owner.id,
                    acceptedAt: now,
                  })
                  .where(eq(invitations.id, invitation.id));

                // Update restaurant owner
                await db
                  .update(restaurants)
                  .set({ ownerId: owner.id })
                  .where(eq(restaurants.id, invitation.restaurantId));

                // Store restaurant ID in session for redirect
                req.session.claimedRestaurantId = invitation.restaurantId;
              } else {
                // Mark as expired
                await db
                  .update(invitations)
                  .set({ status: "expired" })
                  .where(eq(invitations.id, invitation.id));
              }
            }

            // Clear invitation token from session
            delete req.session.invitationToken;
          }

          done(null, owner);
        } catch (error) {
          done(error as Error, undefined);
        }
      }
    )
  );

  return passport;
}
