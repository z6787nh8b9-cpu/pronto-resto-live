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

/** Limits each public establishment chatbot before its menu-context model call. */
export const publicVenueChatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip || "unknown"),
  handler: (_req, res) => res.status(429).json({ error: "Trop de messages. Réessayez dans une minute." }),
});

export function limitPublicVenueChat(req: Request, res: Response, next: NextFunction) {
  return req.path === "/public.chat" ? publicVenueChatLimiter(req, res, next) : next();
}

/** Strict anti-spam budget for public contact and issue requests. */
export const publicChatbotRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip || "unknown"),
  handler: (_req, res) => res.status(429).json({ error: "Trop de demandes. Réessayez dans 15 minutes." }),
});

export function limitPublicChatbotRequests(req: Request, res: Response, next: NextFunction) {
  return req.path === "/chatbotRequests.submit" ? publicChatbotRequestLimiter(req, res, next) : next();
}

/** Limits public contact notifications even when the caller passes reCAPTCHA. */
export const publicContactFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip || "unknown"),
  handler: (_req, res) => res.status(429).json({ error: "Trop de demandes de contact. Réessayez dans 15 minutes." }),
});

export function limitPublicContactForm(req: Request, res: Response, next: NextFunction) {
  return req.path === "/public.submitContactForm" ? publicContactFormLimiter(req, res, next) : next();
}

/** Keeps public view analytics useful without disrupting ordinary navigation. */
export const publicPageViewLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip || "unknown"),
  handler: (_req, res) => res.status(429).json({ error: "Trop de vues enregistrées. Réessayez dans une minute." }),
});

export function limitPublicPageViews(req: Request, res: Response, next: NextFunction) {
  return req.path === "/public.trackPageView" ? publicPageViewLimiter(req, res, next) : next();
}

/** Restricts public event registrations independently from general API traffic. */
export const publicEventRegistrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip || "unknown"),
  handler: (_req, res) => res.status(429).json({ error: "Trop d’inscriptions. Réessayez dans 15 minutes." }),
});

export function limitPublicEventRegistrations(req: Request, res: Response, next: NextFunction) {
  return req.path === "/events.registerForEvent" ? publicEventRegistrationLimiter(req, res, next) : next();
}

/** Restricts public reservation creation independently from general API traffic. */
export const publicReservationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip || "unknown"),
  handler: (_req, res) => res.status(429).json({ error: "Trop de demandes de réservation. Réessayez dans 15 minutes." }),
});

export function limitPublicReservations(req: Request, res: Response, next: NextFunction) {
  return req.path === "/reservations.create" ? publicReservationLimiter(req, res, next) : next();
}
