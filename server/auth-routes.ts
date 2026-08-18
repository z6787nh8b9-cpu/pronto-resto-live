/**
 * OAuth Routes for Google and Facebook Authentication
 * Handles restaurant owner authentication via OAuth providers
 */

import { Express, Request, Response } from "express";
import passport from "passport";
import { oauthLimiter, ownerEmailLoginLimiter } from "./rate-limiters";


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
        res.redirect("/");
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
      providerId?: string | null; // Optional for admins
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
        return res.status(401).json({ error: "Identifiants invalides" });
      }

      // Verify password
      const valid = await bcrypt.compare(password, owner.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: "Identifiants invalides" });
      }

      // Update lastSignedIn
      await db.update(restaurantOwners)
        .set({ lastSignedIn: new Date() })
        .where(eq(restaurantOwners.id, owner.id));

      // Create Passport session
      req.login(owner, async (err) => {
        if (err) {
          console.error('[EmailLogin] req.login() failed:', err);
          return res.status(500).json({ error: "Erreur de session" });
        }

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

    } catch (err: any) {
      console.error('[EmailLogin] Error:', err.message);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  });
}
