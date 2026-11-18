import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-server';
import { VALID_ROLES } from '@/lib/server-auth';
import { UserRole } from '@crm/shared-types';
import { signSessionPayload } from '@/lib/session-signature';
import { LoginSchema } from '@crm/validators';

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Authentication service unavailable: Supabase credentials not configured' },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const validation = LoginSchema.safeParse({
      email: body.email?.trim()?.toLowerCase(),
      password: body.password,
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: validation.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // 1. Authenticate with Supabase Auth (verifies cryptographic hash)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.session || !authData.user) {
      return NextResponse.json(
        { error: 'Invalid email or password. Please verify your credentials.' },
        { status: 401 }
      );
    }

    const authUser = authData.user;
    const sessionToken = authData.session.access_token;

    // 2. Query app_users to verify account active status
    const { data: appUsers } = await supabaseAdmin
      .from('app_users')
      .select('id, email, full_name, is_active')
      .or(`id.eq.${authUser.id},email.eq.${email}`);

    const appUser = appUsers && appUsers.length > 0 ? appUsers[0] : null;
    if (appUser && appUser.is_active === false) {
      // Sign out immediately
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: 'Account is disabled. Please contact your dealership administrator.' },
        { status: 403 }
      );
    }

    // 3. Resolve tenant and role from trusted database
    const possibleUserIds = [authUser.id];
    if (appUser?.id && appUser.id !== authUser.id) {
      possibleUserIds.push(appUser.id);
    }

    const { data: memberships } = await supabaseAdmin
      .from('memberships')
      .select('id, tenant_id, user_id, role_key, branch_ids, is_active')
      .in('user_id', possibleUserIds);

    const activeMembership = memberships?.find((m) => m.is_active === true);
    let resolvedTenantId = activeMembership?.tenant_id;
    let resolvedRoleKey = activeMembership?.role_key;
    let branchIds: string[] = Array.isArray(activeMembership?.branch_ids) ? activeMembership.branch_ids : [];

    // Fallback: check employees table
    if (!resolvedTenantId || !resolvedRoleKey) {
      const { data: employeeRows } = await supabaseAdmin
        .from('employees')
        .select('id, tenant_id, role, branch_id, status')
        .eq('email', email);

      const emp = employeeRows && employeeRows.length > 0 ? employeeRows[0] : null;
      if (emp && emp.status !== 'inactive' && emp.tenant_id) {
        resolvedTenantId = emp.tenant_id;
        resolvedRoleKey = emp.role || 'sales_executive';
        if (emp.branch_id) branchIds = [emp.branch_id];
      }
    }

    // 4. Reject if no valid tenant association
    if (!resolvedTenantId) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: 'Account has no active dealership membership. Contact your administrator.' },
        { status: 403 }
      );
    }

    // 5. Reject if role is unauthorized or unrecognized
    if (!resolvedRoleKey || !VALID_ROLES.includes(resolvedRoleKey as UserRole)) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: 'User has an invalid or unauthorized role assignment.' },
        { status: 403 }
      );
    }

    const fullName =
      appUser?.full_name ||
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      email.split('@')[0];

    // 6. Generate cryptographically signed session token for Edge Middleware & Server validation
    const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7; // 7 days
    const signedSessionToken = await signSessionPayload({
      userId: authUser.id,
      tenantId: resolvedTenantId,
      role: resolvedRoleKey,
      exp,
    });

    // 7. Build response and set secure session cookies
    const response = NextResponse.json({
      success: true,
      token: sessionToken,
      user: {
        id: authUser.id,
        email: authUser.email,
        fullName,
      },
      tenantId: resolvedTenantId,
      role: resolvedRoleKey,
      branchIds,
    });

    const isProd = process.env.NODE_ENV === 'production';

    // Set HttpOnly cookie for Supabase session bearer token
    response.cookies.set('sb-access-token', sessionToken, {
      path: '/',
      httpOnly: true, // Protected against client-side XSS exfiltration
      sameSite: 'lax',
      secure: isProd,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Set HttpOnly cryptographically signed session cookie (tamper-proof)
    response.cookies.set('crm-session', signedSessionToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      maxAge: 60 * 60 * 24 * 7,
    });

    // Client-side non-authoritative display cookie
    response.cookies.set('crm-role', resolvedRoleKey, {
      path: '/',
      sameSite: 'lax',
      secure: isProd,
      maxAge: 60 * 60 * 24 * 7,
    });

    response.cookies.set('crm-tenant', resolvedTenantId, {
      path: '/',
      sameSite: 'lax',
      secure: isProd,
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: any) {
    console.error('[API/auth/login] Login error:', err);
    return NextResponse.json(
      { error: 'Authentication failed due to internal error.' },
      { status: 500 }
    );
  }
}
