import type { NextFunction, Request, Response } from "express";

export const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "X-Frame-Options": "DENY",
} as const;

export function applySecurityHeaders(req: Request, res: Response, next: NextFunction) {
  for (const [name, value] of Object.entries(securityHeaders)) {
    res.setHeader(name, value);
  }

  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  next();
}

export function healthPayload() {
  return { status: "ok" as const };
}
