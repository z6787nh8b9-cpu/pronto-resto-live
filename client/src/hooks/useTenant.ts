import { useMemo } from 'react';
import { getTenantContext, getTenantRoute, type TenantContext } from '@shared/tenant';

/**
 * Hook to get the current tenant context from the browser hostname
 */
export function useTenant() {
  const tenantContext = useMemo<TenantContext>(() => {
    if (typeof window === 'undefined') {
      return {
        type: 'unknown',
        hostname: '',
        subdomain: '',
      };
    }
    
    return getTenantContext(window.location.hostname);
  }, []);

  const route = useMemo(() => {
    if (typeof window === 'undefined') {
      return { type: 'admin' as const };
    }
    
    return getTenantRoute(tenantContext, window.location.pathname);
  }, [tenantContext]);

  return {
    ...tenantContext,
    route,
    isAdmin: tenantContext.type === 'admin',
    isRestaurant: tenantContext.type === 'restaurant',
    isDashboard: route.type === 'dashboard',
    isPublic: route.type === 'public',
  };
}
