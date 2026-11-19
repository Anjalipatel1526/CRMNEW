/**
 * Canonical tenant identifier & slug derivation shared across Edge, Server, and Client layers.
 */

export function isUuid(input?: string | null): boolean {
  if (!input || typeof input !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.trim());
}

export function sanitizeTenantSlug(input: string, maxLength = 36): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, maxLength);
}

export function deriveTenantIdFromEmail(email: string): string {
  const normalized = email
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, '_')
    .slice(0, 36);
  return `t_${normalized || 'dealership'}`;
}

export function deriveTenantSlugFromId(tenantId: string): string {
  return (
    tenantId
      .replace(/^t_/, '')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_') || 'dealership'
  ).slice(0, 48);
}

export function getPrimaryBranchId(tenantId: string): string {
  if (isUuid(tenantId)) {
    return tenantId;
  }
  return `b_${tenantId}_main`;
}
