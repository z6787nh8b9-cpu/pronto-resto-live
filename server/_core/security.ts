import type { NextFunction, Request, Response } from "express";

export const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "X-Frame-Options": "DENY",
} as const;

const productionContentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https:",
  "frame-src https://www.google.com/recaptcha/",
  "upgrade-insecure-requests",
].join("; ");

export function applySecurityHeaders(req: Request, res: Response, next: NextFunction) {
  for (const [name, value] of Object.entries(securityHeaders)) {
    res.setHeader(name, value);
  }

  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    res.setHeader("Content-Security-Policy", productionContentSecurityPolicy);
  }

  next();
}

export function healthPayload() {
  return { status: "ok" as const };
}
