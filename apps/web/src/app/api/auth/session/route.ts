import { NextRequest, NextResponse } from 'next/server';
import {
  supabaseAdmin,
  createServerClient,
  isServerSupabaseConfigured,
} from '@/lib/server/supabase';
import { VALID_ROLES, resolveTrustedTenantRole } from '@/lib/server/auth';
import { checkAccountOnboardingStatus } from '@/lib/server/tenant';
import { setSessionCookies } from '@/lib/server/session-cookies';
import { deriveTenantIdFromEmail } from '@/lib/shared/tenant-slug';
import { UserRole } from '@crm/shared-types';

/**
 * POST /api/auth/session
 * Bridges a verified Supabase OAuth/client access token into server-managed HttpOnly session cookies
 * so Next.js Edge Middleware and protected BFF APIs recognize Google OAuth logins cleanly.
 */
export async function POST(req: NextRequest) {
  if (!isServerSupabaseConfigured()) {
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

    const resolved = await resolveTrustedTenantRole(authUser.id, email, appUser, authUser.user_metadata);
    const resolvedTenantId = resolved.tenantId || deriveTenantIdFromEmail(email);
    const resolvedRoleKey =
      resolved.roleKey && VALID_ROLES.includes(resolved.roleKey as UserRole)
        ? resolved.roleKey
        : 'tenant_admin';

    const fullName =
      appUser?.full_name ||
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      email.split('@')[0];

    const isOnboarded = await checkAccountOnboardingStatus({
      tenantId: resolvedTenantId,
      email,
      role: resolvedRoleKey,
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

    await setSessionCookies(response, {
      accessToken,
      userId: authUser.id,
      tenantId: resolvedTenantId,
      role: resolvedRoleKey,
      isOnboarded,
    });

    return response;
  } catch (err: any) {
    console.error('[API/auth/session] Session sync error:', err);
    return NextResponse.json({ error: 'Failed to establish session' }, { status: 500 });
  }
}
