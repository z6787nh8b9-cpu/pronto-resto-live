/**
 * OAuth Routes for Google and Facebook Authentication
 * Handles restaurant owner authentication via OAuth providers
 */

import { Express, Request, Response } from "express";
import passport from "passport";
import { oauthLimiter, ownerEmailLoginLimiter } from "./rate-limiters";
import { recordSecurityEvent } from "./security-events";
import { passwordPolicyError } from "./password-policy";
import { notifyOwner } from "./_core/notification";
import { createPasswordResetSecret, hashPasswordResetSecret, isPasswordResetExpired, PASSWORD_RESET_TTL_MS } from "./password-reset";
import { requireSameOrigin } from "./_core/origin-guard";


/**
 * Register OAuth routes for restaurant owner authentication
 */
export function registerRestaurantAuthRoutes(app: Express) {
  // Session and Passport are now configured globally in session-middleware.ts
  // No need to configure them here again

  // Google OAuth Routes
  app.get(
    "/api/auth/google",
    oauthLimiter,
    (req: Request, res: Response, next) => {
      // Store invitation token in session if provided
      const invitationToken = req.query.token as string;
      if (invitationToken) {
        req.session.invitationToken = invitationToken;
      }
      next();
    },
    passport.authenticate("google", {
      scope: ["profile", "email"],
    })
  );

  app.get(
    "/api/auth/google/callback",
    oauthLimiter, // SECURITY: Rate limiter (20 attempts max per 15 minutes)
    passport.authenticate("google", {
      failureRedirect: "/login-restaurant?error=google_auth_failed",
    }),
    async (req: Request, res: Response) => {
      // Manually call req.login() to ensure session is created
      if (!req.user) {
        console.error('[OAuth Callback] No user found after authentication!');
        return res.redirect('/login-restaurant?error=auth_failed');
      }
      
      // Force session creation with req.login() and WAIT for it to complete
      req.login(req.user, async (err) => {
        if (err) {
          console.error('[OAuth Callback] req.login() failed:', err);
          return res.redirect('/login-restaurant?error=session_failed');
        }
        // NOW check if user claimed a restaurant via invitation
        const claimedRestaurantId = req.session.claimedRestaurantId;
        
        if (claimedRestaurantId) {
          // Clear the claimed restaurant ID from session
          delete req.session.claimedRestaurantId;
          // Get restaurant slug from database
          try {
            const { getDb } = await import("./db");
            const { restaurants } = await import("../drizzle/schema");
            const { eq } = await import("drizzle-orm");
            const db = await getDb();
            if (!db) throw new Error('Database connection failed');
            
            const restaurant = await db.select({ slug: restaurants.slug })
              .from(restaurants)
              .where(eq(restaurants.id, claimedRestaurantId))
              .limit(1);
            
            if (restaurant.length > 0 && restaurant[0].slug) {
              // Redirect to the restaurant dashboard with slug
              return res.redirect(`/${restaurant[0].slug}/dashboard`);
            } else {
              // Fallback to old format if slug not found
              return res.redirect(`/dashboard/${claimedRestaurantId}`);
            }
          } catch (error) {
            console.error('[OAuth Callback] Error fetching restaurant slug:', error);
            return res.redirect(`/dashboard/${claimedRestaurantId}`);
          }
        } else {
          // Redirect to home or user dashboard
          return res.redirect("/");
        }
      });
    }
  );

  // Facebook OAuth Routes
  app.get(
    "/api/auth/facebook",
    oauthLimiter,
    (req: Request, res: Response, next) => {
      // Store invitation token in session if provided
      const invitationToken = req.query.token as string;
      if (invitationToken) {
        req.session.invitationToken = invitationToken;
      }
      next();
    },
    passport.authenticate("facebook", {
      scope: ["email"],
    })
  );

  app.get(
    "/api/auth/facebook/callback",
    oauthLimiter, // SECURITY: Rate limiter (20 attempts max per 15 minutes)
    passport.authenticate("facebook", {
      failureRedirect: "/login-restaurant?error=facebook_auth_failed",
    }),
    async (req: Request, res: Response) => {
      // Check if user claimed a restaurant via invitation
      const claimedRestaurantId = req.session.claimedRestaurantId;
      
      if (claimedRestaurantId) {
        // Clear the claimed restaurant ID from session
        delete req.session.claimedRestaurantId;
        // Get restaurant slug from database
        try {
          const { getDb } = await import("./db");
          const { restaurants } = await import("../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          const db = await getDb();
          if (!db) throw new Error('Database connection failed');
          
          const restaurant = await db.select({ slug: restaurants.slug })
            .from(restaurants)
            .where(eq(restaurants.id, claimedRestaurantId))
            .limit(1);
          
          if (restaurant.length > 0 && restaurant[0].slug) {
            // Redirect to the restaurant dashboard with slug
            res.redirect(`/${restaurant[0].slug}/dashboard`);
          } else {
            // Fallback to old format if slug not found
            res.redirect(`/dashboard/${claimedRestaurantId}`);
          }
        } catch (error) {
          console.error('[OAuth Callback] Error fetching restaurant slug:', error);
          res.redirect(`/dashboard/${claimedRestaurantId}`);
        }
      } else {
        // Redirect to home or user dashboard
        res.redirect("/");
      }
    }
  );

// Logout route
app.get("/api/auth/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ error: "Session destruction failed" });
        }
        res.clearCookie("pronto.sid", { path: "/" });
        res.redirect("/");
      });
  });
});

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.logout((logoutError) => {
      if (logoutError) return res.status(500).json({ error: "Logout failed" });
      req.session.destroy((sessionError) => {
        if (sessionError) return res.status(500).json({ error: "Session destruction failed" });
        res.clearCookie("pronto.sid", { path: "/" });
        return res.json({ success: true });
      });
    });
  });

// Get current user route
  app.get("/api/auth/me", (req: Request, res: Response) => {
    if (req.isAuthenticated()) {
      res.json({ user: req.user });
    } else {
      res.json({ user: null });
    }
  });
}

// Extend Express types to include Passport user and custom session data
declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      name: string;
      avatarUrl: string | null;
      provider?: "google" | "facebook" | "email"; // Optional for admins
      providerId?: string | null; // For admins
      authVersion: number; // Credential version checked by Passport on every request
      googleId?: string; // For admins
      invitationId?: number; // For admins
      restaurantId?: number; // For restaurant owners
      createdAt: Date;
      updatedAt: Date;
      lastSignedIn: Date;
    }
  }
}

// Extend session data
declare module "express-session" {
  interface SessionData {
    adminId?: number; // For email/password admin authentication
    adminAuthVersion?: number; // Matches the account credential version for server-side session invalidation
    invitationToken?: string; // For restaurant owner invitation flow
    claimedRestaurantId?: number; // For restaurant owner invitation flow
  }
}

/**
 * Email/Password login route for restaurant owners
 * Validates credentials against restaurant_owners table (provider = 'email')
 */
export function registerEmailLoginRoute(app: Express) {
  app.post("/api/auth/email-login", ownerEmailLoginLimiter, async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      await recordSecurityEvent({ req, principalType: "owner", eventType: "owner.email_login", outcome: "failure" });
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }

    try {
      const { getDb } = await import("./db");
      const { restaurantOwners, restaurants } = await import("../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const bcrypt = await import("bcrypt");

      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Erreur base de données" });

      // Find owner by email with email provider
      const [owner] = await db.select()
        .from(restaurantOwners)
        .where(and(eq(restaurantOwners.email, email), eq(restaurantOwners.provider, "email")))
        .limit(1);

      if (!owner || !owner.passwordHash) {
        await recordSecurityEvent({ req, principalType: "owner", eventType: "owner.email_login", outcome: "failure" });
        return res.status(401).json({ error: "Identifiants invalides" });
      }

      // Verify password
      const valid = await bcrypt.compare(password, owner.passwordHash);
      if (!valid) {
        await recordSecurityEvent({ req, principalType: "owner", principalId: owner.id, eventType: "owner.email_login", outcome: "failure" });
        return res.status(401).json({ error: "Identifiants invalides" });
      }

      // Update lastSignedIn
      await db.update(restaurantOwners)
        .set({ lastSignedIn: new Date() })
        .where(eq(restaurantOwners.id, owner.id));

      // Regenerate before login to prevent session fixation across account changes.
      req.session.regenerate((sessionError) => {
        if (sessionError) {
          console.error("[EmailLogin] Unable to regenerate owner session");
          void recordSecurityEvent({ req, principalType: "owner", principalId: owner.id, eventType: "owner.email_login", outcome: "failure" });
          return res.status(500).json({ error: "Erreur de session" });
        }

      // Create Passport session
      req.login(owner, async (err) => {
        if (err) {
          console.error("[EmailLogin] Unable to create owner session");
          await recordSecurityEvent({ req, principalType: "owner", principalId: owner.id, eventType: "owner.email_login", outcome: "failure" });
          return res.status(500).json({ error: "Erreur de session" });
        }

        await recordSecurityEvent({ req, principalType: "owner", principalId: owner.id, eventType: "owner.email_login", outcome: "success" });

        // Find the restaurant linked to this owner
        const [restaurant] = await db.select({ slug: restaurants.slug })
          .from(restaurants)
          .where(eq(restaurants.ownerId, owner.id))
          .limit(1);

        if (restaurant?.slug) {
          return res.json({ success: true, redirectTo: `/${restaurant.slug}/dashboard` });
        } else {
          return res.json({ success: true, redirectTo: "/" });
        }
      });
      });

    } catch {
      console.error("[EmailLogin] Unexpected authentication failure");
      await recordSecurityEvent({ req, principalType: "system", eventType: "owner.email_login", outcome: "failure" });
      return res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.post("/api/auth/change-password", requireSameOrigin, ownerEmailLoginLimiter, async (req: Request, res: Response) => {
    const ownerId = req.user?.id;
    const { currentPassword, newPassword } = req.body;
    if (!ownerId) return res.status(401).json({ error: "Connexion requise" });
    if (!currentPassword || !newPassword) return res.status(400).json({ error: "Les deux mots de passe sont requis" });

    const policyError = passwordPolicyError(newPassword);
    if (policyError) return res.status(400).json({ error: policyError });

    try {
      const { getDb } = await import("./db");
      const { restaurantOwners } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const bcrypt = await import("bcrypt");
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Erreur base de données" });

      const [owner] = await db.select().from(restaurantOwners).where(eq(restaurantOwners.id, ownerId)).limit(1);
      if (!owner || owner.provider !== "email" || !owner.passwordHash) {
        return res.status(409).json({ error: "Ce compte utilise un fournisseur de connexion externe." });
      }
      if (!(await bcrypt.compare(currentPassword, owner.passwordHash))) {
        await recordSecurityEvent({ req, principalType: "owner", principalId: owner.id, eventType: "owner.password_change", outcome: "failure" });
        return res.status(401).json({ error: "Mot de passe actuel incorrect" });
      }

      const nextAuthVersion = owner.authVersion + 1;
      await db.update(restaurantOwners).set({
        passwordHash: await bcrypt.hash(newPassword, 10),
        authVersion: nextAuthVersion,
      }).where(eq(restaurantOwners.id, owner.id));
      await new Promise<void>((resolve, reject) => req.session.regenerate((error) => error ? reject(error) : resolve()));
      const refreshedOwner = { ...owner, authVersion: nextAuthVersion } as unknown as Express.User;
      await new Promise<void>((resolve, reject) => req.login(refreshedOwner, (error) => error ? reject(error) : resolve()));
      await recordSecurityEvent({ req, principalType: "owner", principalId: owner.id, eventType: "owner.password_change", outcome: "success" });
      return res.json({ success: true });
    } catch {
      await recordSecurityEvent({ req, principalType: "system", eventType: "owner.password_change", outcome: "failure" });
      return res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.post("/api/auth/password-help", ownerEmailLoginLimiter, async (req: Request, res: Response) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const genericResponse = { success: true, message: "Si un compte peut être associé à cette adresse, notre équipe vous contactera prochainement." };

    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(200).json(genericResponse);

    try {
      const { getDb } = await import("./db");
      const { passwordResetTokens, restaurantOwners } = await import("../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const db = await getDb();
      const [owner] = db ? await db.select().from(restaurantOwners)
        .where(and(eq(restaurantOwners.email, email), eq(restaurantOwners.provider, "email"))).limit(1) : [];

      if (owner && db) {
        const secret = createPasswordResetSecret();
        const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
        await db.insert(passwordResetTokens).values({ ownerId: owner.id, tokenHash: hashPasswordResetSecret(secret), expiresAt });

        const fallbackOrigin = `${req.protocol}://${req.get("host")}`;
        const resetUrl = new URL("/reset-password", process.env.PUBLIC_URL || fallbackOrigin);
        resetUrl.searchParams.set("token", secret);
        await notifyOwner({
          title: "PRONTO — lien de récupération d'accès à transmettre après vérification",
          content: `Demande de récupération pour ${email}. Après vérification de l'identité, transmettez ce lien à usage unique (valide une heure) : ${resetUrl.toString()}`,
        });
      }
      await recordSecurityEvent({ req, principalType: "system", eventType: "owner.password_help_request", outcome: "info" });
    } catch {
      // The public response remains neutral even when the notification service is temporarily unavailable.
      await recordSecurityEvent({ req, principalType: "system", eventType: "owner.password_help_request", outcome: "failure" });
    }

    return res.status(200).json(genericResponse);
  });

  app.post("/api/auth/reset-password", ownerEmailLoginLimiter, async (req: Request, res: Response) => {
    const token = typeof req.body?.token === "string" ? req.body.token : "";
    const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
    const policyError = passwordPolicyError(newPassword);
    if (!token || policyError) return res.status(400).json({ error: policyError || "Lien invalide ou expiré" });

    try {
      const { getDb } = await import("./db");
      const { passwordResetTokens, restaurantOwners } = await import("../drizzle/schema");
      const { and, eq, isNull } = await import("drizzle-orm");
      const bcrypt = await import("bcrypt");
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const tokenHash = hashPasswordResetSecret(token);
      const [resetToken] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.tokenHash, tokenHash)).limit(1);
      if (!resetToken || resetToken.usedAt || isPasswordResetExpired(resetToken.expiresAt)) {
        await recordSecurityEvent({ req, principalType: "system", eventType: "owner.password_reset", outcome: "failure" });
        return res.status(400).json({ error: "Lien invalide ou expiré" });
      }

      const claim = await db.update(passwordResetTokens).set({ usedAt: new Date() })
        .where(and(eq(passwordResetTokens.id, resetToken.id), isNull(passwordResetTokens.usedAt)));
      if (Number(claim[0].affectedRows) !== 1) return res.status(400).json({ error: "Lien invalide ou expiré" });

      const [owner] = await db.select().from(restaurantOwners).where(eq(restaurantOwners.id, resetToken.ownerId)).limit(1);
      if (!owner || owner.provider !== "email") return res.status(400).json({ error: "Lien invalide ou expiré" });

      await db.update(restaurantOwners).set({
        passwordHash: await bcrypt.hash(newPassword, 10),
        authVersion: owner.authVersion + 1,
      }).where(eq(restaurantOwners.id, owner.id));
      await recordSecurityEvent({ req, principalType: "owner", principalId: owner.id, eventType: "owner.password_reset", outcome: "success" });
      return res.json({ success: true });
    } catch {
      await recordSecurityEvent({ req, principalType: "system", eventType: "owner.password_reset", outcome: "failure" });
      return res.status(500).json({ error: "Erreur serveur" });
    }
  });
}
