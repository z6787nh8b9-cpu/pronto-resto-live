import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    // Check if user is Manus OAuth admin
    const isManusAdmin = ctx.user && ctx.user.role === 'admin';
    
    // Check if user is Google OAuth invited admin
    const isInvitedAdmin = !!ctx.adminAccount;

    if (!isManusAdmin && !isInvitedAdmin) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
        adminAccount: ctx.adminAccount,
      },
    });
  }),
);

/**
 * Middleware for restaurant owner authentication
 * Allows both restaurant owners AND super admins
 */
const requireRestaurantOwnerOrAdmin = t.middleware(async opts => {
  const { ctx, next } = opts;

  // Check if user is Super Admin (Manus OAuth)
  if ((ctx.user && ctx.user.role === 'admin') || ctx.adminAccount) {
    return next({
      ctx: {
        ...ctx,
        isAdmin: true,
      },
    });
  }

  // Check if user is restaurant owner (Google/Facebook OAuth)
  if (ctx.restaurantOwner) {
    return next({
      ctx: {
        ...ctx,
        restaurantOwner: ctx.restaurantOwner,
        isAdmin: false,
      },
    });
  }

  throw new TRPCError({ code: "UNAUTHORIZED", message: "Vous devez être connecté pour accéder à cette ressource." });
});

export const restaurantOwnerProcedure = t.procedure.use(requireRestaurantOwnerOrAdmin);
