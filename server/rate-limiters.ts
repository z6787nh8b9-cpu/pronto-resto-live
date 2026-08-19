/**
 * Rate limiting middleware for authentication and public API surfaces.
 */

import type { Request } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const authKey = (req: Request) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  return `${ipKeyGenerator(req.ip || "unknown")}:${email}`;
};

const authBlockedResponse = {
  error: "Trop de tentatives de connexion. Réessayez dans 15 minutes.",
};

/** Strict protection for Super Admin password login. */
export const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: authKey,
  handler: (_req, res) => res.status(429).json(authBlockedResponse),
});

/** Protection for owner OAuth redirects and callbacks. */
export const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    res.status(429).json({
      error: "Trop de tentatives de connexion OAuth. Réessayez dans 15 minutes.",
    }),
});

/** Strict protection for business-owner email/password login. */
export const ownerEmailLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: authKey,
  handler: (_req, res) => res.status(429).json(authBlockedResponse),
});

/** Dedicated guardrail for creating or consuming enterprise member invitations. */
export const memberInvitationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    res.status(429).json({ error: "Trop de tentatives liées aux invitations. Réessayez dans 15 minutes." }),
});

/** General guardrail for the tRPC gateway. */
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    res.status(429).json({ error: "Trop de requêtes. Ralentissez." }),
});
