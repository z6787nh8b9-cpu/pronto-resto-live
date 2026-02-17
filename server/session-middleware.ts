/**
 * Global Session Middleware Configuration
 * Configures express-session and Passport.js for ALL routes (including tRPC)
 */

import { Express } from "express";
import session from "express-session";
import MySQLStore from "express-mysql-session";
import passport from "passport";
import { initializePassport } from "./auth-config";

/**
 * Configure session middleware globally for all routes
 * This MUST be called BEFORE registering any routes that need session access
 */
export function configureSessionMiddleware(app: Express) {
  // Create MySQL session store
  const MySQLStoreConstructor = MySQLStore(session);
  const sessionStore = new MySQLStoreConstructor({
    host: process.env.DATABASE_URL?.match(/mysql:\/\/([^:]+):/)?.[1] || 'localhost',
    port: parseInt(process.env.DATABASE_URL?.match(/:([0-9]+)\//)?.[1] || '3306'),
    user: process.env.DATABASE_URL?.match(/\/\/([^:]+):/)?.[1] || 'root',
    password: process.env.DATABASE_URL?.match(/:([^@]+)@/)?.[1] || '',
    database: process.env.DATABASE_URL?.match(/\/([^?]+)(\?|$)/)?.[1] || 'pronto',
    clearExpired: true,
    checkExpirationInterval: 900000, // 15 minutes
    expiration: 86400000, // 24 hours
    createDatabaseTable: true, // Auto-create sessions table
  });
  
  console.log('[Session] MySQL session store configured');
  
  // Configure express-session for ALL routes
  app.use(
    session({
      store: sessionStore, // Use MySQL store instead of MemoryStore
      secret: process.env.JWT_SECRET || "pronto-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax', // Allow cookie to be sent with top-level navigations
        domain: process.env.NODE_ENV === "production" ? '.pronto.page' : undefined, // Allow cookie on all subdomains in production
      },
    })
  );

  // Initialize Passport with OAuth strategies
  initializePassport();
  app.use(passport.initialize());
  app.use(passport.session());

  console.log('[Session] Global session middleware configured');
}
