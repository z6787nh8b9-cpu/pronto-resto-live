/**
 * OAuth Routes for Google and Facebook Authentication
 * Handles restaurant owner authentication via OAuth providers
 */

import { Express, Request, Response } from "express";
import session from "express-session";
import passport from "passport";
import { initializePassport } from "./auth-config";

/**
 * Register OAuth routes for restaurant owner authentication
 */
export function registerRestaurantAuthRoutes(app: Express) {
  // Configure session middleware
  app.use(
    session({
      secret: process.env.JWT_SECRET || "pronto-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  // Initialize Passport
  initializePassport();
  app.use(passport.initialize());
  app.use(passport.session());

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
    (req: Request, res: Response) => {
      // Check if user claimed a restaurant via invitation
      const claimedRestaurantId = req.session.claimedRestaurantId;
      
      if (claimedRestaurantId) {
        // Clear the claimed restaurant ID from session
        delete req.session.claimedRestaurantId;
        // Redirect to the restaurant dashboard
        res.redirect(`/dashboard/${claimedRestaurantId}`);
      } else {
        // Redirect to home or user dashboard
        res.redirect("/");
      }
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
    (req: Request, res: Response) => {
      // Check if user claimed a restaurant via invitation
      const claimedRestaurantId = req.session.claimedRestaurantId;
      
      if (claimedRestaurantId) {
        // Clear the claimed restaurant ID from session
        delete req.session.claimedRestaurantId;
        // Redirect to the restaurant dashboard
        res.redirect(`/dashboard/${claimedRestaurantId}`);
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
      provider: "google" | "facebook";
      providerId: string;
      createdAt: Date;
      updatedAt: Date;
      lastSignedIn: Date;
    }
  }
}

// Extend session data to include custom properties
declare module "express-session" {
  interface SessionData {
    invitationToken?: string;
    claimedRestaurantId?: number;
  }
}
