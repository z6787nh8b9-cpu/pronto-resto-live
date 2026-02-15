import { TRPCError } from "@trpc/server";
import { middleware, publicProcedure } from "./trpc";

/**
 * Middleware to ensure user is authenticated and is a restaurant owner
 */
export const restaurateurMiddleware = middleware(async (opts) => {
  const { ctx, next } = opts;
  
  // In development mode, allow access without authentication
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (!isDevelopment) {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
    }
    
    if (ctx.user.role !== 'restaurateur' && ctx.user.role !== 'admin') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Restaurateur access required' });
    }
  }
  
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

/**
 * Middleware to ensure user is admin
 */
export const adminMiddleware = middleware(async (opts) => {
  const { ctx, next } = opts;
  
  // In development mode, allow access without authentication
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (!isDevelopment) {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
    }
    
    if (ctx.user.role !== 'admin') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
    }
  }
  
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// Procedures with authentication
export const restaurateurProcedure = publicProcedure.use(restaurateurMiddleware);
export const adminProcedure = publicProcedure.use(adminMiddleware);
