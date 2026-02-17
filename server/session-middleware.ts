/**
 * Global Session Middleware Configuration
 * Configures express-session and Passport.js for ALL routes (including tRPC)
 */

import { Express } from "express";
import session from "express-session";
import passport from "passport";
import { initializePassport } from "./auth-config";

/**
 * Configure session middleware globally for all routes
 * This MUST be called BEFORE registering any routes that need session access
 */
export function configureSessionMiddleware(app: Express) {
  console.log('[Session] Configuring global session middleware');
  
  // Configure express-session for ALL routes
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

  // Initialize Passport with OAuth strategies
  initializePassport();
  app.use(passport.initialize());
  app.use(passport.session());

  console.log('[Session] Global session middleware configured');
}
