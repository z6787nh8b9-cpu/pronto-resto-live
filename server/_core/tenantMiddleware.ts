import { TRPCError } from "@trpc/server";
import { middleware, publicProcedure } from "./trpc";
import { getTenantContext } from "../../shared/tenant";
import { getRestaurantBySlug } from "../db";

/**
 * Middleware to inject tenant context into tRPC procedures
 */
export const tenantMiddleware = middleware(async (opts) => {
  const { ctx, next } = opts;
  const hostname = ctx.req.headers.host || 'localhost';
  const tenantContext = getTenantContext(hostname);
  
  return next({
    ctx: {
      ...ctx,
      tenant: tenantContext,
    },
  });
});

/**
 * Middleware to ensure user is authenticated and is a restaurant owner
 */
export const restaurateurMiddleware = middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
  }
  
  if (ctx.user.role !== 'restaurateur' && ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Restaurateur access required' });
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

/**
 * Middleware to load restaurant data based on tenant context
 */
export const restaurantMiddleware = middleware(async (opts) => {
  const { ctx, next } = opts;
  const hostname = ctx.req.headers.host || 'localhost';
  const tenantContext = getTenantContext(hostname);
  
  if (tenantContext.type === 'restaurant' && tenantContext.slug) {
    const restaurant = await getRestaurantBySlug(tenantContext.slug);
    
    if (!restaurant) {
      throw new TRPCError({ 
        code: 'NOT_FOUND', 
        message: 'Restaurant not found' 
      });
    }
    
    return next({
      ctx: {
        ...ctx,
        tenant: tenantContext,
        restaurant,
      },
    });
  }
  
  return next({
    ctx: {
      ...ctx,
      tenant: tenantContext,
    },
  });
});

// Procedures with tenant context
export const tenantProcedure = publicProcedure.use(tenantMiddleware);
export const restaurantProcedure = publicProcedure.use(restaurantMiddleware);
export const restaurateurProcedure = publicProcedure.use(tenantMiddleware).use(restaurateurMiddleware);
export const adminProcedure = publicProcedure.use(tenantMiddleware).use(adminMiddleware);
