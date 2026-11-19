import { NextRequest, NextResponse } from 'next/server';
import { isServerSupabaseConfigured, supabaseAdmin, createServerClient } from '@/lib/server/supabase';
import { UserRole } from '@crm/shared-types';

export const VALID_ROLES: UserRole[] = [
  'tenant_admin',
  'branch_manager',
  'sales_executive',
  'finance_manager',
  'inventory_manager',
  'service_advisor',
  'technician',
  'receptionist',
];

export interface VerifiedSession {
  user: {
    id: string;
    email: string;
    fullName: string;
  };
  tenantId: string;
  role: UserRole;
  branchIds: string[];
  membershipId?: string;
}

export type AuthResult =
  | { success: true; session: VerifiedSession }
  | { success: false; error: string; status: number };

/**
 * Extracts the bearer token or session cookie from an incoming Next.js request.
 */
export function extractToken(req: NextRequest | Request): string | null {
  // 1. Check Authorization header
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) return token;
  }

  // 2. Check cookies
  if ('cookies' in req && req.cookies && typeof req.cookies.get === 'function') {
    const nextReq = req as NextRequest;
    const cookieToken =
      nextReq.cookies.get('sb-access-token')?.value ||
      nextReq.cookies.get('crm-token')?.value ||
      nextReq.cookies.get('crm_access_token')?.value;
    if (cookieToken) return cookieToken;
  }

  // 3. Fallback: parse raw Cookie header string
  const rawCookie = req.headers.get('cookie');
  if (rawCookie) {
    const match = rawCookie.match(/(?:^|;\s*)(?:sb-access-token|crm-token|crm_access_token)=([^;]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
  }

  return null;
}

/**
 * Resolves a verified user's trusted tenant membership and role from Supabase tables.
 * Checks memberships -> employees -> onboarded dealership admin (company_profiles / user_credentials).
 * Auto-provisions a canonical memberships row when an onboarded dealership admin logs in.
 */
export async function resolveTrustedTenantRole(
  authUserId: string,
  userEmail: string,
  appUser?: { id?: string; full_name?: string | null } | null,
  userMetadata?: Record<string, any> | null
): Promise<{
  tenantId?: string;
  roleKey?: string;
  branchIds: string[];
  membershipId?: string;
}> {
  const normalizedEmail = userEmail.toLowerCase().trim();
  const possibleUserIds = [authUserId];
  if (appUser?.id && appUser.id !== authUserId) {
    possibleUserIds.push(appUser.id);
  }

  // 1. Primary: memberships table
  const { data: memberships } = await supabaseAdmin
    .from('memberships')
    .select('id, tenant_id, user_id, role_key, branch_ids, is_active')
    .in('user_id', possibleUserIds);

  const activeMembership = memberships?.find((m) => m.is_active === true);
  if (activeMembership?.tenant_id && activeMembership?.role_key) {
    return {
      tenantId: activeMembership.tenant_id,
      roleKey: activeMembership.role_key,
      branchIds: Array.isArray(activeMembership.branch_ids) ? activeMembership.branch_ids : [],
      membershipId: activeMembership.id,
    };
  }

  // 2. Fallback: employees table (staff membership)
  const { data: employeeRows } = await supabaseAdmin
    .from('employees')
    .select('id, tenant_id, role, branch_id, is_active')
    .ilike('email', normalizedEmail);

  const emp = employeeRows && employeeRows.length > 0 ? employeeRows[0] : null;
  if (emp && emp.is_active !== false && emp.tenant_id) {
    return {
      tenantId: emp.tenant_id,
      roleKey: emp.role || 'sales_executive',
      branchIds: emp.branch_id ? [emp.branch_id] : [],
    };
  }

  // 3. Fallback: onboarded dealership admin in company_profiles, user_credentials, or tenants owner_uid
  let adminTenantId: string | undefined;

  // 3a. Direct check by authentic auth_user_id / owner_uid
  if (authUserId) {
    const [profByUid, credByUid, tenantByUid] = await Promise.all([
      supabaseAdmin.from('company_profiles').select('tenant_id').eq('auth_user_id', authUserId).limit(1),
      supabaseAdmin.from('user_credentials').select('tenant_id').eq('auth_user_id', authUserId).limit(1),
      supabaseAdmin.from('tenants').select('id').eq('owner_uid', authUserId).limit(1),
    ]);
    adminTenantId =
      profByUid.data?.[0]?.tenant_id ||
      credByUid.data?.[0]?.tenant_id ||
      tenantByUid.data?.[0]?.id;
  }

  // 3b. Fallback check by email (strictly ensuring no cross-user auth_user_id collision)
  if (!adminTenantId) {
    const { data: profileRows } = await supabaseAdmin
      .from('company_profiles')
      .select('tenant_id, is_onboarded, email, auth_user_id')
      .ilike('email', normalizedEmail)
      .order('updated_at', { ascending: false })
      .limit(5);

    const matchedProfile =
      profileRows?.find((p: any) => p.tenant_id && p.is_onboarded && (!p.auth_user_id || p.auth_user_id === authUserId)) ||
      profileRows?.find((p: any) => p.tenant_id && (!p.auth_user_id || p.auth_user_id === authUserId));

    if (matchedProfile?.tenant_id) {
      adminTenantId = matchedProfile.tenant_id;
    } else {
      const { data: credRows } = await supabaseAdmin
        .from('user_credentials')
        .select('tenant_id, email, auth_user_id')
        .ilike('email', normalizedEmail)
        .limit(1);

      if (credRows && credRows[0]?.tenant_id && (!credRows[0].auth_user_id || credRows[0].auth_user_id === authUserId)) {
        adminTenantId = credRows[0].tenant_id;
      }
    }
  }

  if (adminTenantId) {
    // Auto-provision canonical app_users + memberships row for future queries & RLS
    try {
      const fullName =
        appUser?.full_name ||
        userMetadata?.full_name ||
        userMetadata?.name ||
        normalizedEmail.split('@')[0];

      const appUserId = appUser?.id || authUserId;
      await supabaseAdmin.from('app_users').upsert(
        {
          id: appUserId,
          email: normalizedEmail,
          full_name: fullName,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      );

      // Re-fetch canonical app_users.id in case email already existed under a different id
      const { data: canonicalUser } = await supabaseAdmin
        .from('app_users')
        .select('id')
        .ilike('email', normalizedEmail)
        .limit(1);

      const membershipUserId = canonicalUser?.[0]?.id || appUserId;

      const { data: createdMembership } = await supabaseAdmin
        .from('memberships')
        .upsert(
          {
            tenant_id: adminTenantId,
            user_id: membershipUserId,
            role_key: 'tenant_admin',
            branch_ids: [],
            branch_scope: 'all',
            is_active: true,
          },
          { onConflict: 'tenant_id,user_id' }
        )
        .select('id')
        .maybeSingle();

      return {
        tenantId: adminTenantId,
        roleKey: 'tenant_admin',
        branchIds: [],
        membershipId: createdMembership?.id,
      };
    } catch (provisionErr) {
      console.warn('[ServerAuth] Auto-provision membership warning:', provisionErr);
      return {
        tenantId: adminTenantId,
        roleKey: 'tenant_admin',
        branchIds: [],
      };
    }
  }

  return { branchIds: [] };
}

/**
 * Cryptographically verifies the session token against Supabase Auth,
 * validates account active status, and resolves verified role & tenant membership from the database.
 * Never trusts client-supplied roles, query parameters, or local storage.
 */
export async function verifySession(req: NextRequest | Request): Promise<AuthResult> {
  if (!isServerSupabaseConfigured()) {
    return {
      success: false,
      error: 'Authentication service unavailable: Supabase credentials not configured',
      status: 503,
    };
  }

  const token = extractToken(req);
  if (!token) {
    return {
      success: false,
      error: 'Authentication required. No session token provided.',
      status: 401,
    };
  }

  try {
    // 1. Verify caller identity with Supabase createServerClient using request session token
    const serverClient = createServerClient(token);
    const { data: authData, error: authErr } = await serverClient.auth.getUser(token);
    if (authErr || !authData || !authData.user) {
      return {
        success: false,
        error: 'Invalid or expired session. Please log in again.',
        status: 401,
      };
    }

    const authUser = authData.user;
    const userEmail = authUser.email?.toLowerCase().trim();
    if (!userEmail) {
      return {
        success: false,
        error: 'Authenticated user has no valid email address.',
        status: 401,
      };
    }

    // 2. Verify account is active in app_users
    const { data: appUsers, error: appUserErr } = await supabaseAdmin
      .from('app_users')
      .select('id, email, full_name, is_active')
      .or(`id.eq.${authUser.id},email.eq.${userEmail}`);

    const appUser = appUsers && appUsers.length > 0 ? appUsers[0] : null;
    if (appUser && appUser.is_active === false) {
      return {
        success: false,
        error: 'Account is disabled. Please contact your dealership administrator.',
        status: 403,
      };
    }

    // 3. Look up active membership in memberships / employees / onboarded dealership admin tables
    const resolved = await resolveTrustedTenantRole(authUser.id, userEmail, appUser, authUser.user_metadata);
    const resolvedTenantId = resolved.tenantId;
    const resolvedRoleKey = resolved.roleKey;
    const branchIds = resolved.branchIds;
    const activeMembershipId = resolved.membershipId;

    // 5. Enforce Tenant Membership requirement
    if (!resolvedTenantId) {
      return {
        success: false,
        error: 'Account has no active dealership membership. Contact your administrator.',
        status: 403,
      };
    }

    // 6. Enforce Role validity requirement
    if (!resolvedRoleKey || !VALID_ROLES.includes(resolvedRoleKey as UserRole)) {
      return {
        success: false,
        error: 'User has an invalid or unauthorized role assignment.',
        status: 403,
      };
    }

    // Return verified session data
    return {
      success: true,
      session: {
        user: {
          id: authUser.id,
          email: userEmail,
          fullName:
            appUser?.full_name ||
            authUser.user_metadata?.full_name ||
            authUser.user_metadata?.name ||
            userEmail.split('@')[0],
        },
        tenantId: resolvedTenantId,
        role: resolvedRoleKey as UserRole,
        branchIds,
        membershipId: activeMembershipId,
      },
    };
  } catch (err: any) {
    console.error('[ServerAuth] Unexpected verification error:', err);
    return {
      success: false,
      error: 'Authentication failed due to internal server error.',
      status: 500,
    };
  }
}

/**
 * Higher-level authentication wrapper for Next.js Route Handlers.
 * Returns either the verified session or an immediate error response.
 */
export async function requireAuth(
  req: NextRequest | Request,
  allowedRoles?: UserRole[]
): Promise<{ session: VerifiedSession } | { errorResponse: NextResponse }> {
  const result = await verifySession(req);

  if (!result.success) {
    return {
      errorResponse: NextResponse.json(
        { error: result.error, code: result.status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN' },
        { status: result.status }
      ),
    };
  }

  // Check role authorization if specified
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(result.session.role)) {
      return {
        errorResponse: NextResponse.json(
          {
            error: `Insufficient permissions. Role '${result.session.role}' is not authorized for this operation.`,
            code: 'FORBIDDEN',
          },
          { status: 403 }
        ),
      };
    }
  }

  return { session: result.session };
}
