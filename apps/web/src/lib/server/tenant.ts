import { supabaseAdmin } from '@/lib/server/supabase';
import {
  deriveTenantIdFromEmail,
  deriveTenantSlugFromId,
  getPrimaryBranchId,
} from '@/lib/shared/tenant-slug';

export interface TenantBootstrapDetails {
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  address?: string;
  dealerModel?: string;
  contactName?: string;
  ownerUid?: string;
}

function normalizeDealerModel(raw?: string): 'new' | 'used' | 'mixed' | 'broker' {
  const value = (raw || '').toLowerCase();
  if (
    value.includes('franchise') ||
    value.includes('new') ||
    value.includes('luxury') ||
    value.includes('electric')
  ) {
    return 'new';
  }
  if (value.includes('preowned') || value.includes('used')) {
    return 'used';
  }
  if (value === 'new' || value === 'used' || value === 'mixed' || value === 'broker') {
    return value;
  }
  return 'mixed';
}

/**
 * Single authoritative helper to ensure a tenant row and its primary branch exist in Supabase.
 */
export async function ensureTenantAndBranch(
  tenantId: string,
  details: TenantBootstrapDetails = {},
  options: { throwOnTenantError?: boolean } = {}
): Promise<{ tenantId: string; primaryBranchId: string }> {
  const safeSlug = deriveTenantSlugFromId(tenantId);
  const { error: tenantErr } = await supabaseAdmin.from('tenants').upsert(
    {
      id: tenantId,
      name: details.name || 'Dealership Workspace',
      slug: safeSlug,
      status: 'active',
      dealer_model: normalizeDealerModel(details.dealerModel),
      primary_contact_name: details.contactName || 'Dealership Admin',
      primary_email: details.email || 'admin@dealership.com',
      primary_phone: details.phone || '+91 98000 00000',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      owner_uid: details.ownerUid || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (tenantErr) {
    console.error('[ServerTenant] Tenant upsert error:', tenantErr.message);
    if (options.throwOnTenantError) {
      throw new Error(`Failed to create or update tenant: ${tenantErr.message}`);
    }
  }

  const primaryBranchId = getPrimaryBranchId(tenantId);
  const { error: branchErr } = await supabaseAdmin.from('branches').upsert(
    {
      id: primaryBranchId,
      tenant_id: tenantId,
      code: 'MAIN',
      name: details.name || 'Main Showroom',
      address:
        details.address || details.city || details.state
          ? {
              address: details.address || '',
              city: details.city || '',
              state: details.state || '',
            }
          : {},
      phone: details.phone || '',
      email: details.email || '',
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (branchErr) {
    console.warn('[ServerTenant] Branch upsert note:', branchErr.message);
  }

  return { tenantId, primaryBranchId };
}

/**
 * Canonical predicate determining whether a `company_profiles` row represents a completed onboarding.
 */
export function isCompanyProfileOnboarded(
  profile: { is_onboarded?: boolean | null; legal_name?: string | null; trade_name?: string | null } | null | undefined
): boolean {
  if (!profile) return false;
  return Boolean(profile.is_onboarded) && Boolean(String(profile.legal_name || profile.trade_name || '').trim());
}

/**
 * Checks whether a user/tenant has completed onboarding (staff roles belong to an existing tenant).
 */
export async function checkAccountOnboardingStatus(params: {
  tenantId?: string | null;
  email?: string | null;
  role?: string | null;
  authUserId?: string | null;
}): Promise<boolean> {
  if (params.role && params.role !== 'tenant_admin') {
    return true;
  }

  if (params.authUserId) {
    const { data: rowsByUid } = await supabaseAdmin
      .from('company_profiles')
      .select('is_onboarded, legal_name, trade_name, tenant_id, email, auth_user_id')
      .eq('auth_user_id', params.authUserId)
      .limit(1);
    if (rowsByUid && rowsByUid.length > 0 && isCompanyProfileOnboarded(rowsByUid[0])) {
      return true;
    }
  }

  const filters: string[] = [];
  if (params.tenantId && params.tenantId !== 't_default') {
    filters.push(`tenant_id.eq.${params.tenantId}`);
  }
  const normalizedEmail = params.email?.toLowerCase().trim();
  if (normalizedEmail) {
    filters.push(`email.ilike.${normalizedEmail}`);
  }
  if (filters.length === 0) return false;

  const { data: rows } = await supabaseAdmin
    .from('company_profiles')
    .select('is_onboarded, legal_name, trade_name, tenant_id, email, auth_user_id')
    .or(filters.join(','))
    .order('updated_at', { ascending: false })
    .limit(5);

  return Boolean(
    rows?.some((row) =>
      isCompanyProfileOnboarded(row) &&
      (!params.authUserId || !row.auth_user_id || row.auth_user_id === params.authUserId)
    )
  );
}

/**
 * Fetches an onboarded company profile + its `dealership_modules` by tenantId, email, or authUserId.
 */
export async function fetchCompanyProfileWithModules(params: {
  tenantId?: string | null;
  email?: string | null;
  authUserId?: string | null;
}): Promise<{ profile: any | null; modules: any[]; isOnboarded: boolean }> {
  const loadModules = async (tid: string) => {
    const { data } = await supabaseAdmin
      .from('dealership_modules')
      .select('*')
      .eq('tenant_id', tid)
      .order('order_index', { ascending: true });
    return data || [];
  };

  // 1. Direct authoritative lookup by authenticated auth_user_id (prevents cross-tenant leakages)
  if (params.authUserId) {
    const { data: userProfiles } = await supabaseAdmin
      .from('company_profiles')
      .select('*')
      .eq('auth_user_id', params.authUserId)
      .order('updated_at', { ascending: false })
      .limit(5);

    const onboarded = userProfiles?.find((p) => isCompanyProfileOnboarded(p));
    if (onboarded) {
      return {
        profile: onboarded,
        modules: await loadModules(onboarded.tenant_id),
        isOnboarded: true,
      };
    }
  }

  if (params.tenantId && params.tenantId !== 't_default') {
    const { data: tenantProfiles } = await supabaseAdmin
      .from('company_profiles')
      .select('*')
      .eq('tenant_id', params.tenantId)
      .order('updated_at', { ascending: false })
      .limit(5);

    const onboarded = tenantProfiles?.find((p) =>
      isCompanyProfileOnboarded(p) &&
      (!params.authUserId || !p.auth_user_id || p.auth_user_id === params.authUserId)
    );
    if (onboarded) {
      return {
        profile: onboarded,
        modules: await loadModules(onboarded.tenant_id),
        isOnboarded: true,
      };
    }
    if (!params.email) {
      return { profile: tenantProfiles?.[0] || null, modules: [], isOnboarded: false };
    }
  }

  const normalizedEmail = params.email?.toLowerCase().trim();
  if (normalizedEmail) {
    const cleanSlug = deriveTenantIdFromEmail(normalizedEmail);
    const { data: emailProfiles } = await supabaseAdmin
      .from('company_profiles')
      .select('*')
      .or(`email.ilike.${normalizedEmail},tenant_id.eq.${cleanSlug}`)
      .order('updated_at', { ascending: false })
      .limit(5);

    const onboardedEmail = emailProfiles?.find((p) =>
      isCompanyProfileOnboarded(p) &&
      (!params.authUserId || !p.auth_user_id || p.auth_user_id === params.authUserId)
    );
    if (onboardedEmail) {
      return {
        profile: onboardedEmail,
        modules: await loadModules(onboardedEmail.tenant_id),
        isOnboarded: true,
      };
    }

    const { data: credRows } = await supabaseAdmin
      .from('user_credentials')
      .select('tenant_id, auth_user_id')
      .ilike('email', normalizedEmail)
      .limit(1);

    const credTenantId = credRows?.[0]?.tenant_id;
    if (
      credTenantId &&
      (!params.authUserId || !credRows[0].auth_user_id || credRows[0].auth_user_id === params.authUserId)
    ) {
      const { data: credProfiles } = await supabaseAdmin
        .from('company_profiles')
        .select('*')
        .eq('tenant_id', credTenantId)
        .order('updated_at', { ascending: false })
        .limit(5);

      const onboardedCred = credProfiles?.find((p) =>
        isCompanyProfileOnboarded(p) &&
        (!params.authUserId || !p.auth_user_id || p.auth_user_id === params.authUserId)
      );
      if (onboardedCred) {
        return {
          profile: onboardedCred,
          modules: await loadModules(onboardedCred.tenant_id),
          isOnboarded: true,
        };
      }
    }

    return { profile: emailProfiles?.[0] || null, modules: [], isOnboarded: false };
  }

  return { profile: null, modules: [], isOnboarded: false };
}

