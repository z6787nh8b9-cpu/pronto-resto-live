import { createHash } from "crypto";
import type { Request } from "express";
import { getDb } from "./db";
import { securityEvents } from "../drizzle/schema";

export type SecurityPrincipal = "admin" | "owner" | "system";
export type SecurityOutcome = "success" | "failure" | "info";

export function hashIp(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  const rawIp = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.ip || "unknown";
  const salt = process.env.JWT_SECRET || "pronto-security-event";
  return createHash("sha256").update(`${salt}:${rawIp}`).digest("hex");
}

export function buildSecurityEventPayload(input: {
  req: Request;
  principalType: SecurityPrincipal;
  principalId?: number | null;
  eventType: string;
  outcome: SecurityOutcome;
}) {
  return {
    principalType: input.principalType,
    principalId: input.principalId ?? null,
    eventType: input.eventType,
    outcome: input.outcome,
    ipHash: hashIp(input.req),
    route: input.req.path,
  };
}

export async function recordSecurityEvent(input: {
  req: Request;
  principalType: SecurityPrincipal;
  principalId?: number | null;
  eventType: string;
  outcome: SecurityOutcome;
}) {
  try {
    const db = await getDb();
    if (!db) return;
    await db.insert(securityEvents).values(buildSecurityEventPayload(input));
  } catch (error) {
    // Security telemetry must never block a legitimate authentication response.
    console.error("[SecurityEvent] Unable to persist authentication event", { eventType: input.eventType });
  }
}
