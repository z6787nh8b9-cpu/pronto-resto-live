/**
 * Rate Limiting Middleware
 * Protects against brute-force attacks and API abuse
 */

import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for admin login (STRICT)
 * - 5 attempts max per 15 minutes
 * - Prevents brute-force password attacks
 */
export const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts max per window
  message: {
    error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count successful requests
  skipFailedRequests: false, // Count failed requests
  handler: (req, res) => {
    console.log(`[Rate Limit] Admin login blocked for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.'
    });
  }
});

/**
 * Rate limiter for restaurant OAuth (LENIENT)
 * - 20 attempts max per 15 minutes
 * - More permissive for OAuth flows
 */
export const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts max per window
  message: {
    error: 'Trop de tentatives de connexion OAuth. Réessayez dans 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`[Rate Limit] OAuth blocked for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Trop de tentatives de connexion OAuth. Réessayez dans 15 minutes.'
    });
  }
});

/**
 * Rate limiter for tRPC endpoints (GENERAL)
 * - 100 requests max per minute
 * - Prevents API abuse
 */
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests max per minute
  message: {
    error: 'Trop de requêtes. Ralentissez.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`[Rate Limit] API abuse detected for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Trop de requêtes. Ralentissez.'
    });
  }
});
