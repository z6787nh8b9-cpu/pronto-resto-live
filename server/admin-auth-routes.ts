/**
 * Admin OAuth Routes for Google Authentication
 * Handles admin invitation acceptance via Google OAuth
 */

import { Express, Request, Response } from "express";
import passport from "passport";
import { initializeAdminGoogleStrategy } from "./admin-auth-config";

/**
 * Register OAuth routes for admin authentication
 */
export function registerAdminAuthRoutes(app: Express) {
  // Initialize Admin Google Strategy
  initializeAdminGoogleStrategy();

  // Admin Google OAuth Routes
  app.get(
    "/api/auth/admin-google",
    (req: Request, res: Response, next) => {
      // Store invitation token in session
      const invitationToken = req.query.token as string;
      if (!invitationToken) {
        return res.redirect("/invite-admin/error?message=missing_token");
      }
      req.session.adminInvitationToken = invitationToken;
      next();
    },
    passport.authenticate("google-admin", {
      scope: ["profile", "email"],
    })
  );

  app.get(
    "/api/auth/admin-google/callback",
    passport.authenticate("google-admin", {
      failureRedirect: "/invite-admin/error?message=auth_failed",
    }),
    (req: Request, res: Response) => {
      // Redirect to admin panel after successful authentication
      res.redirect("/admin");
    }
  );
}

// Extend session data to include admin invitation token
declare module "express-session" {
  interface SessionData {
    adminInvitationToken?: string;
    adminAccountId?: number;
  }
}
