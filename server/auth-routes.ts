/**
 * OAuth Routes for Google and Facebook Authentication
 * Handles restaurant owner authentication via OAuth providers
 */

import { Express, Request, Response } from "express";
import passport from "passport";


/**
 * Register OAuth routes for restaurant owner authentication
 */
export function registerRestaurantAuthRoutes(app: Express) {
  // Admin login route (classic HTML form POST)
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      // Import dependencies
      const bcrypt = await import("bcrypt");
      const { getDb } = await import("./db");
      const { adminAccounts } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }

      // Find admin by email
      const [admin] = await db
        .select()
        .from(adminAccounts)
        .where(eq(adminAccounts.email, email))
        .limit(1);

      if (!admin) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, admin.passwordHash);

      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Update last signed in
      await db
        .update(adminAccounts)
        .set({ lastSignedIn: new Date() })
        .where(eq(adminAccounts.id, admin.id));

      // Store admin ID in session
      req.session.adminId = admin.id;
      await req.session.save();

      // Redirect to admin panel
      res.redirect("/admin/super");
    } catch (error) {
      console.error("[Admin Login Error]", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  // Session and Passport are now configured globally in session-middleware.ts
  // No need to configure them here again

  // Google OAuth Routes
  app.get(
    "/api/auth/google",
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
    passport.authenticate("google", {
      failureRedirect: "/login?error=google_auth_failed",
    }),
    async (req: Request, res: Response) => {
      console.log('[OAuth Callback] User authenticated:', req.user);
      console.log('[OAuth Callback] Session ID:', req.sessionID);
      console.log('[OAuth Callback] Session data:', req.session);
      
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
        console.log('[OAuth Callback] req.login() successful, session created');
        
        // NOW check if user claimed a restaurant via invitation
        const claimedRestaurantId = req.session.claimedRestaurantId;
        
        console.log('[OAuth Callback] Claimed restaurant ID:', claimedRestaurantId);
        
        if (claimedRestaurantId) {
          // Clear the claimed restaurant ID from session
          delete req.session.claimedRestaurantId;
          console.log('[OAuth Callback] Redirecting to restaurant dashboard...');
          
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
    passport.authenticate("facebook", {
      failureRedirect: "/login?error=facebook_auth_failed",
    }),
    async (req: Request, res: Response) => {
      // Check if user claimed a restaurant via invitation
      const claimedRestaurantId = req.session.claimedRestaurantId;
      
      console.log('[OAuth Callback] Claimed restaurant ID:', claimedRestaurantId);
      
      if (claimedRestaurantId) {
        // Clear the claimed restaurant ID from session
        delete req.session.claimedRestaurantId;
        console.log('[OAuth Callback] Redirecting to restaurant dashboard...');
        
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
      provider?: "google" | "facebook"; // Optional for admins
      providerId?: string; // Optional for admins
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