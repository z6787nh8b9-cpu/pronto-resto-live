/**
 * Rate limiting middleware for authentication and public API surfaces.
 */

import type { NextFunction, Request, Response } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const authKey = (req: Request) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  return `${ipKeyGenerator(req.ip || "unknown")}:${email}`;
};

const authBlockedResponse = {
  error: "Trop de tentatives de connexion. Réessayez dans 15 minutes.",
};

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

/** Reject cross-site browser mutations before they reach the tRPC application layer. */
export function requireSameOrigin(req: Request, res: Response, next: NextFunction) {
  if (safeMethods.has(req.method)) return next();
  const origin = req.get("origin");
  const host = req.get("host");
  const expectedOrigin = host ? `${req.protocol}://${host}` : null;
  if (!origin || !expectedOrigin || origin !== expectedOrigin) {
    return res.status(403).json({ error: "Origine de requête non autorisée." });
  }
  return next();
}

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

/** Password-help replies are intentionally neutral (200), so every request must count. */
export const passwordHelpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: authKey,
  handler: (_req, res) => res.status(429).json({ error: "Trop de demandes de récupération. Réessayez dans 15 minutes." }),
});

/** Token guessing is keyed to the source IP because no verified email is present. */
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip || "unknown"),
  handler: (_req, res) => res.status(429).json({ error: "Trop de tentatives de réinitialisation. Réessayez dans 15 minutes." }),
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

/** Limits the public LLM entry point separately from the general API budget. */
export const publicChatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip || "unknown"),
  handler: (_req, res) => res.status(429).json({ error: "Trop de messages. Réessayez dans une minute." }),
});

/** Apply the expensive public-chat budget only to its tRPC procedure. */
export function limitPublicChat(req: Request, res: Response, next: NextFunction) {
  return req.path === "/chat.sendMessage" ? publicChatLimiter(req, res, next) : next();
}
