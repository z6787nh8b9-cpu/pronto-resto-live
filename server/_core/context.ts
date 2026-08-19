import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User, RestaurantOwner, AdminAccount } from "../../drizzle/schema";
import { resolvePrincipal, type AuthenticatedPrincipal } from "./principal";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null; // Legacy platform identity, intentionally disabled during decoupling
  restaurantOwner: RestaurantOwner | null; // Google/Facebook OAuth user
  adminAccount: AdminAccount | null; // Google OAuth admin (invited)
  principal: AuthenticatedPrincipal | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let restaurantOwner: RestaurantOwner | null = null;
  let adminAccount: AdminAccount | null = null;

  // Check for Passport.js authenticated restaurant owner FIRST
  if (opts.req.user) {
    // req.user is set by Passport.js after Google/Facebook OAuth
    restaurantOwner = opts.req.user as RestaurantOwner;
  }

  // Check for admin account session (email/password invited admin)
  if (opts.req.session?.adminId) {
    const { getDb } = await import("../db");
    const { adminAccounts } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    if (db) {
      const [account] = await db.select().from(adminAccounts).where(eq(adminAccounts.id, opts.req.session.adminId)).limit(1);
      adminAccount = account || null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    restaurantOwner,
    adminAccount,
    principal: resolvePrincipal({ adminAccount, restaurantOwner, user }),
  };
}
