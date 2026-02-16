import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User, RestaurantOwner } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null; // Manus OAuth user (Super Admin)
  restaurantOwner: RestaurantOwner | null; // Google/Facebook OAuth user
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let restaurantOwner: RestaurantOwner | null = null;

  // Check for Manus OAuth user (Super Admin)
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // Check for Passport.js authenticated restaurant owner
  if (opts.req.user && !user) {
    // req.user is set by Passport.js after Google/Facebook OAuth
    restaurantOwner = opts.req.user as RestaurantOwner;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    restaurantOwner,
  };
}
