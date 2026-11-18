import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured } from './supabase';
import { supabaseAdmin, createServerClient } from './supabase-server';
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
 * Cryptographically verifies the session token against Supabase Auth,
 * validates account active status, and resolves verified role & tenant membership from the database.
 * Never trusts client-supplied roles, query parameters, or local storage.
 */
export async function verifySession(req: NextRequest | Request): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
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

    // 3. Look up active membership in memberships table
    const possibleUserIds = [authUser.id];
    if (appUser?.id && appUser.id !== authUser.id) {
      possibleUserIds.push(appUser.id);
    }

    const { data: memberships, error: memErr } = await supabaseAdmin
      .from('memberships')
      .select('id, tenant_id, user_id, role_key, branch_ids, is_active')
      .in('user_id', possibleUserIds);

    let activeMembership = memberships?.find((m) => m.is_active === true);

    let resolvedTenantId = activeMembership?.tenant_id;
    let resolvedRoleKey = activeMembership?.role_key;
    let branchIds: string[] = Array.isArray(activeMembership?.branch_ids) ? activeMembership.branch_ids : [];

    // 4. Fallback check: employees table (staff membership)
    if (!resolvedTenantId || !resolvedRoleKey) {
      const { data: employeeRows } = await supabaseAdmin
        .from('employees')
        .select('id, tenant_id, role, branch_id, status')
        .eq('email', userEmail);

      const emp = employeeRows && employeeRows.length > 0 ? employeeRows[0] : null;
      if (emp && emp.status !== 'inactive' && emp.tenant_id) {
        resolvedTenantId = emp.tenant_id;
        resolvedRoleKey = emp.role || 'sales_executive';
        if (emp.branch_id) branchIds = [emp.branch_id];
      }
    }

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
        membershipId: activeMembership?.id,
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
