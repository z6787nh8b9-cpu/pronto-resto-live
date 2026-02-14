/**
 * Multi-tenant utilities for PRONTO
 * Handles subdomain detection and tenant context
 */

export type TenantType = 'admin' | 'restaurant' | 'public' | 'unknown';

export interface TenantContext {
  type: TenantType;
  slug?: string; // Restaurant slug for restaurant/public contexts
  hostname: string;
  subdomain: string;
}

/**
 * Extract subdomain from hostname
 * Examples:
 * - admin.pronto.page -> admin
 * - hotel-des-nacres.pronto.page -> hotel-des-nacres
 * - localhost:3000 -> localhost
 */
export function getSubdomain(hostname: string): string {
  // Remove port if present
  const cleanHostname = hostname.split(':')[0];
  
  // For localhost development
  if (cleanHostname === 'localhost' || cleanHostname === '127.0.0.1') {
    return 'localhost';
  }
  
  // For Manus development URLs (e.g., 3000-xxx.us2.manus.computer)
  if (cleanHostname.includes('.manus.computer')) {
    return 'localhost';
  }
  
  // Extract subdomain (first part before .pronto.page)
  const parts = cleanHostname.split('.');
  if (parts.length >= 3) {
    return parts[0];
  }
  
  return cleanHostname;
}

/**
 * Determine tenant context from hostname
 */
export function getTenantContext(hostname: string): TenantContext {
  const subdomain = getSubdomain(hostname);
  
  // Admin subdomain
  if (subdomain === 'admin') {
    return {
      type: 'admin',
      hostname,
      subdomain,
    };
  }
  
  // Localhost development - default to admin for testing
  if (subdomain === 'localhost') {
    return {
      type: 'admin',
      hostname,
      subdomain,
    };
  }
  
  // Restaurant subdomain (any other subdomain is treated as a restaurant slug)
  if (subdomain && subdomain !== 'www' && subdomain !== 'pronto') {
    return {
      type: 'restaurant',
      slug: subdomain,
      hostname,
      subdomain,
    };
  }
  
  // Unknown/main domain
  return {
    type: 'unknown',
    hostname,
    subdomain,
  };
}

/**
 * Check if current path is a dashboard route
 */
export function isDashboardRoute(pathname: string): boolean {
  return pathname.startsWith('/dashboard');
}

/**
 * Get the appropriate route based on tenant context and path
 */
export function getTenantRoute(context: TenantContext, pathname: string): {
  type: 'admin' | 'dashboard' | 'public';
  slug?: string;
} {
  // Admin context
  if (context.type === 'admin') {
    return { type: 'admin' };
  }
  
  // Restaurant context
  if (context.type === 'restaurant') {
    if (isDashboardRoute(pathname)) {
      return { type: 'dashboard', slug: context.slug };
    }
    return { type: 'public', slug: context.slug };
  }
  
  // Default to admin
  return { type: 'admin' };
}
