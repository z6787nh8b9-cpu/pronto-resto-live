import type { RequestHandler } from "express";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Reject browser mutations that do not originate from the exact host serving
 * PRONTO. It complements SameSite cookies and intentionally leaves OAuth
 * redirects outside of the protected route groups.
 */
export const requireSameOrigin: RequestHandler = (req, res, next) => {
  if (SAFE_METHODS.has(req.method.toUpperCase())) return next();

  const origin = req.get("origin");
  const host = req.get("host");
  if (!origin || !host) {
    return res.status(403).json({ error: "Origine de requête invalide." });
  }

  const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "http";
  const expectedOrigin = `${protocol}://${host}`;
  if (origin !== expectedOrigin) {
    return res.status(403).json({ error: "Origine de requête invalide." });
  }

  return next();
};
