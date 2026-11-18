import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { supabaseAdmin, createServerClient } from '@/lib/supabase-server';
import { VALID_ROLES, resolveTrustedTenantRole } from '@/lib/server-auth';
import { UserRole } from '@crm/shared-types';
import { signSessionPayload } from '@/lib/session-signature';

/**
 * POST /api/auth/session
 * Bridges a verified Supabase OAuth/client access token into server-managed HttpOnly session cookies
 * so Next.js Edge Middleware and protected BFF APIs recognize Google OAuth logins cleanly.
 */
export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Authentication service unavailable: Supabase credentials not configured' },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const accessToken = String(body?.accessToken || '').trim();

    if (!accessToken) {
      return NextResponse.json({ error: 'Missing access token' }, { status: 400 });
    }

    // 1. Cryptographically verify the token with Supabase Auth
    const serverClient = createServerClient(accessToken);
    const { data: authData, error: authErr } = await serverClient.auth.getUser(accessToken);
    if (authErr || !authData?.user) {
      return NextResponse.json({ error: 'Invalid or expired session token' }, { status: 401 });
    }

    const authUser = authData.user;
    const email = authUser.email?.toLowerCase().trim();
    if (!email) {
      return NextResponse.json({ error: 'Authenticated user has no email address' }, { status: 401 });
    }

    // 2. Check active status in app_users
    const { data: appUsers } = await supabaseAdmin
      .from('app_users')
      .select('id, email, full_name, is_active')
      .or(`id.eq.${authUser.id},email.eq.${email}`);

    const appUser = appUsers && appUsers.length > 0 ? appUsers[0] : null;
    if (appUser && appUser.is_active === false) {
      return NextResponse.json(
        { error: 'Account is disabled. Please contact your dealership administrator.' },
        { status: 403 }
      );
    }

    // 3. Resolve tenant membership & role from database
    const resolved = await resolveTrustedTenantRole(authUser.id, email, appUser, authUser.user_metadata);
    const resolvedTenantId = resolved.tenantId || `t_${email.replace(/[^a-z0-9]/g, '_')}`;
    const resolvedRoleKey = (resolved.roleKey && VALID_ROLES.includes(resolved.roleKey as UserRole))
      ? resolved.roleKey
      : 'tenant_admin';

    const fullName =
      appUser?.full_name ||
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      email.split('@')[0];

    // 4. Check onboarding status across both resolved tenant_id and user email
    const { data: profileRows } = await supabaseAdmin
      .from('company_profiles')
      .select('is_onboarded, tenant_id, email')
      .or(`tenant_id.eq.${resolvedTenantId},email.ilike.${email}`)
      .order('updated_at', { ascending: false })
      .limit(5);

    const isOnboarded = Boolean(profileRows?.some((p) => Boolean(p.is_onboarded)));

    // 5. Mint signed session cookie
    const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
    const signedSessionToken = await signSessionPayload({
      userId: authUser.id,
      tenantId: resolvedTenantId,
      role: resolvedRoleKey,
      exp,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: authUser.id,
        email,
        fullName,
      },
      tenantId: resolvedTenantId,
      role: resolvedRoleKey,
      branchIds: resolved.branchIds,
      isOnboarded,
    });

    const isProd = process.env.NODE_ENV === 'production';

    response.cookies.set('sb-access-token', accessToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      maxAge: 60 * 60 * 24 * 7,
    });

    response.cookies.set('crm-session', signedSessionToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      maxAge: 60 * 60 * 24 * 7,
    });

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
    console.error('[API/auth/session] Session sync error:', err);
    return NextResponse.json({ error: 'Failed to establish session' }, { status: 500 });
  }
}

