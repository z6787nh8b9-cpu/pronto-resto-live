/**
 * Global Session Middleware Configuration
 * Configures express-session with MySQL session store and Passport.js
 * 
 * CRITICAL CHANGES:
 * - Replaced MemoryStore with express-mysql-session (production-ready)
 * - Added trust proxy (required for HTTPS behind proxy)
 * - Custom cookie name (security: avoid fingerprinting)
 * - Added sameSite protection (CSRF mitigation)
 * - SSL connection to TiDB Cloud (required)
 */

import { Express } from "express";
import session from "express-session";
import MySQLStoreFactory from "express-mysql-session";
import mysql from "mysql2";
import passport from "passport";
import { initializePassport } from "./auth-config";
import { ENV } from "./_core/env";

// Create MySQL session store
const MySQLStore = MySQLStoreFactory(session);

/**
 * Parse DATABASE_URL to extract connection parameters
 * Format: mysql://user:password@host:port/database?ssl=...
 */
function parseDatabaseUrl(url: string) {
  const match = url.match(/^mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);
  if (!match) {
    throw new Error('[Session] Invalid DATABASE_URL format');
  }
  
  const [, user, password, host, port, databaseRaw] = match;
  
  // Extract database name (remove query parameters like ?ssl=...)
  const database = databaseRaw.split('?')[0];
  
  return {
    host,
    port: parseInt(port, 10),
    user,
    password,
    database,
  };
}

// Parse DATABASE_URL
const dbConfig = parseDatabaseUrl(ENV.databaseUrl);

// Create MySQL connection pool with SSL
const connectionPool = mysql.createPool({
  ...dbConfig,
  ssl: {
    rejectUnauthorized: true // TiDB Cloud requires SSL
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// express-mysql-session exposes an older mysql2 type surface. The pool is
// runtime-compatible; the adapter narrows it at this library boundary only.
const sessionStore = new MySQLStore({
  clearExpired: true, // Automatically delete expired sessions
  checkExpirationInterval: 900000, // Check every 15 minutes (900000 ms)
  expiration: 86400000, // Session expiration: 24 hours (86400000 ms)
  createDatabaseTable: true, // Auto-create sessions table if missing
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data'
    }
  }
}, connectionPool as never);

// Handle session store errors
sessionStore.on('error', (error) => {
  console.error('[Session Store] MySQL session store error:', error);
});

/**
 * Configure session middleware globally for all routes
 * This MUST be called BEFORE registering any routes that need session access
 */
export function configureSessionMiddleware(app: Express) {
  console.log('[Session] Configuring MySQL session store with SSL');
  
  // CRITICAL: Trust first proxy (required for HTTPS behind proxy like Manus deployment)
  app.set('trust proxy', 1);
  console.log('[Session] Trust proxy enabled');
  
  // Configure express-session for ALL routes
  app.use(
    session({
      secret: ENV.cookieSecret,
      resave: false, // Don't save session if unmodified
      saveUninitialized: false, // Don't create session until something stored
      rolling: true, // Renew the idle deadline only for an active, authenticated browser session
      name: 'pronto.sid', // Custom cookie name (security: avoid default "connect.sid")
      store: sessionStore, // Use MySQL store instead of MemoryStore
      cookie: {
        secure: ENV.isProduction, // HTTPS only in production, HTTP OK in dev
        httpOnly: true, // Not accessible via JavaScript (XSS protection)
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax', // CSRF protection (allow same-site navigation)
      },
    })
  );

  // Initialize Passport with OAuth strategies
  initializePassport();
  app.use(passport.initialize());
  app.use(passport.session());

  console.log('[Session] MySQL session middleware configured successfully');
}

// Export session store and pool for potential cleanup on shutdown
export { sessionStore, connectionPool };
