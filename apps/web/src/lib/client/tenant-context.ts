'use client';

/**
 * Tenant & User Data Isolation Engine for UNAI CRM
 * 
 * Ensures multi-tenant isolation so that when User A logs in with their ID,
 * User B logging in with another ID cannot see User A's data, records, or profiles.
 */

import { sanitizeTenantSlug } from '../shared/tenant-slug.ts';

export const SESSION_KEY = 'crm_active_user_session_v1';

export function sanitizeSlug(input: string): string {
  return sanitizeTenantSlug(input, 48);
}

/**
 * Resolves the currently active tenant ID based on the logged-in user or staff session.
 * Always returns a unique, deterministic tenant key for the account.
 */
export function getActiveTenantId(): string {
  if (typeof window === 'undefined') return 't_default';

  try {
    // 1. Check local user session
    const rawSession = localStorage.getItem(SESSION_KEY);
    if (rawSession) {
      const session = JSON.parse(rawSession);
      if (session?.tenantId) {
        return session.tenantId;
      }
      // If staff employee, check if tenant is stored with employee session
      if (session?.employeeId) {
        const empTenant = localStorage.getItem(`crm_emp_tenant_${session.employeeId}`);
        if (empTenant) return empTenant;
      }
      if (session?.userId || session?.email) {
        const id = session.userId || session.email;
        return `t_${sanitizeSlug(id)}`;
      }
    }

    // 2. Check Supabase auth tokens in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          const userId = parsed?.user?.id || parsed?.user?.email;
          if (userId) {
            return `t_${sanitizeSlug(userId)}`;
          }
        }
      }
    }

    return 't_default';
  } catch {
    return 't_default';
  }
}

/**
 * Generates a scoped localStorage key for the currently active tenant
 */
export function getScopedKey(baseKey: string): string {
  const tenantId = getActiveTenantId();
  return `${baseKey}_${tenantId}`;
}

