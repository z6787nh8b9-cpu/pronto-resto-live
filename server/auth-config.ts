/**
 * OAuth Authentication Configuration
 * Handles Google and Facebook OAuth for restaurant owners.
 */

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { getDb } from "./db";
import { restaurantOwners, invitations, restaurants } from "../drizzle/schema";
import { and, eq, gt, isNull } from "drizzle-orm";
import { hashOwnerInvitationToken, isOwnerInvitationToken } from "./owner-invitation-token";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET!;
const callbackBaseURL = process.env.PUBLIC_URL || "http://localhost:3000";

class InvitationClaimUnavailableError extends Error {}
class OwnerSuspendedError extends Error {}

export async function claimRestaurantInvitation(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  token: string,
  ownerId: number
): Promise<number | null> {
  const tokenHash = hashOwnerInvitationToken(token);
  try {
    return await db.transaction(async (tx) => {
      const now = new Date();
      const invitationClaim = await tx
        .update(invitations)
        .set({ status: "accepted", acceptedBy: ownerId, acceptedAt: now })
        .where(and(
          eq(invitations.tokenHash, tokenHash),
          eq(invitations.status, "pending"),
          gt(invitations.expiresAt, now),
        ));
      if (Number(invitationClaim[0]?.affectedRows) !== 1) {
        throw new InvitationClaimUnavailableError();
      }

      const [claimedInvitation] = await tx
        .select({ restaurantId: invitations.restaurantId })
        .from(invitations)
        .where(eq(invitations.tokenHash, tokenHash))
        .limit(1);
      if (!claimedInvitation) throw new InvitationClaimUnavailableError();

      const restaurantClaim = await tx
        .update(restaurants)
        .set({ ownerId })
        .where(and(
          eq(restaurants.id, claimedInvitation.restaurantId),
          isNull(restaurants.ownerId),
        ));
      if (Number(restaurantClaim[0]?.affectedRows) !== 1) {
        throw new InvitationClaimUnavailableError();
      }
      return claimedInvitation.restaurantId;
    });
  } catch (error) {
    if (error instanceof InvitationClaimUnavailableError) return null;
    throw error;
  }
}

async function upsertGoogleOwner(profile: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const email = profile.emails?.[0]?.value;
  if (!email) throw new Error("No email found in Google profile");

  const [existingOwner] = await db
    .select()
    .from(restaurantOwners)
    .where(and(eq(restaurantOwners.email, email), eq(restaurantOwners.provider, "google")))
    .limit(1);
  if (existingOwner) {
    if (existingOwner.isSuspended) throw new OwnerSuspendedError();
    await db.update(restaurantOwners).set({ lastSignedIn: new Date() }).where(eq(restaurantOwners.id, existingOwner.id));
    return { db, owner: existingOwner, email };
  }

  const [created] = await db.insert(restaurantOwners).values({
    email,
    name: profile.displayName || email,
    avatarUrl: profile.photos?.[0]?.value || null,
    provider: "google",
    providerId: profile.id,
  });
  const [owner] = await db.select().from(restaurantOwners).where(eq(restaurantOwners.id, Number(created.insertId))).limit(1);
  if (!owner) throw new Error("Restaurant owner creation failed");
  return { db, owner, email };
}

async function upsertFacebookOwner(profile: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const email = profile.emails?.[0]?.value;
  if (!email) throw new Error("No email found in Facebook profile");

  const [existingOwner] = await db
    .select()
    .from(restaurantOwners)
    .where(and(eq(restaurantOwners.email, email), eq(restaurantOwners.provider, "facebook")))
    .limit(1);
  if (existingOwner) {
    if (existingOwner.isSuspended) throw new OwnerSuspendedError();
    await db.update(restaurantOwners).set({ lastSignedIn: new Date() }).where(eq(restaurantOwners.id, existingOwner.id));
    return { db, owner: existingOwner, email };
  }

  const displayName = `${profile.name?.givenName || ""} ${profile.name?.familyName || ""}`.trim() || email;
  const [created] = await db.insert(restaurantOwners).values({
    email,
    name: displayName,
    avatarUrl: profile.photos?.[0]?.value || null,
    provider: "facebook",
    providerId: profile.id,
  });
  const [owner] = await db.select().from(restaurantOwners).where(eq(restaurantOwners.id, Number(created.insertId))).limit(1);
  if (!owner) throw new Error("Restaurant owner creation failed");
  return { db, owner, email };
}

async function claimSessionInvitation(req: any, db: NonNullable<Awaited<ReturnType<typeof getDb>>>, ownerId: number) {
  const token = req.session?.invitationToken;
  if (!isOwnerInvitationToken(token)) return;
  const restaurantId = await claimRestaurantInvitation(db, token, ownerId);
  if (restaurantId) req.session.claimedRestaurantId = restaurantId;
  delete req.session.invitationToken;
}

/** Initialize Passport strategies for restaurant owners. */
export function initializePassport() {
  passport.serializeUser((user: any, done) => {
    const authVersion = Number(user.authVersion);
    if (!Number.isSafeInteger(authVersion) || authVersion < 1) {
      return done(new Error("Invalid authentication session version"));
    }
    if (user.googleId && !user.facebookId && user.invitationId !== undefined) {
      done(null, `admin:${user.id}:${authVersion}`);
    } else {
      done(null, `owner:${user.id}:${authVersion}`);
    }
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const db = await getDb();
      if (!db) return done(new Error("Database not available"), null);
      const [type, userId, serializedAuthVersion] = id.split(":");
      const numericId = Number.parseInt(userId, 10);
      const authVersion = Number.parseInt(serializedAuthVersion, 10);
      if (!Number.isSafeInteger(numericId) || !Number.isSafeInteger(authVersion) || authVersion < 1) {
        return done(null, null);
      }
      if (type === "admin") {
        const { adminAccounts } = await import("../drizzle/schema");
        const [admin] = await db.select().from(adminAccounts).where(eq(adminAccounts.id, numericId)).limit(1);
        return done(null, admin && admin.authVersion === authVersion ? admin : null);
      }
      const [owner] = await db.select().from(restaurantOwners).where(eq(restaurantOwners.id, numericId)).limit(1);
      return done(null, owner && !owner.isSuspended && owner.authVersion === authVersion ? owner : null);
    } catch (error) {
      return done(error, null);
    }
  });

  passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: `${callbackBaseURL}/api/auth/google/callback`,
    passReqToCallback: true,
  }, async (req: any, _accessToken, _refreshToken, profile, done) => {
    try {
      const { db, owner } = await upsertGoogleOwner(profile);
      await claimSessionInvitation(req, db, owner.id);
      return done(null, owner);
    } catch (error) {
      return done(error as Error, undefined);
    }
  }));

  passport.use(new FacebookStrategy({
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET,
    callbackURL: `${callbackBaseURL}/api/auth/facebook/callback`,
    profileFields: ["id", "emails", "name", "picture"],
    passReqToCallback: true,
  }, async (req: any, _accessToken, _refreshToken, profile, done) => {
    try {
      const { db, owner } = await upsertFacebookOwner(profile);
      await claimSessionInvitation(req, db, owner.id);
      return done(null, owner);
    } catch (error) {
      return done(error as Error, undefined);
    }
  }));

  return passport;
}
