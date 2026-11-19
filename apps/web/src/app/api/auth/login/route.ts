import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  supabaseAdmin,
  createAnonServerClient,
  isServerSupabaseConfigured,
} from '@/lib/server/supabase';
import { VALID_ROLES, resolveTrustedTenantRole } from '@/lib/server/auth';
import { syncSupabaseAuthPassword } from '@/lib/server/auth-admin';
import { checkAccountOnboardingStatus } from '@/lib/server/tenant';
import { setSessionCookies } from '@/lib/server/session-cookies';
import { UserRole } from '@crm/shared-types';
import { LoginSchema } from '@crm/validators';

function safeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Safely migrates an existing onboarded user_credentials record (e.g., created via Google OAuth + onboarding)
 * into Supabase Auth ONLY when the submitted password exactly matches the stored onboarding credential.
 * Scrubs the legacy plaintext value immediately after syncing to Supabase Auth.
 */
async function tryMigrateLegacyOnboardingCredential(
  email: string,
  rawIdentifier: string,
  password: string
): Promise<string | null> {
  try {
    const { data: credRows } = await supabaseAdmin
      .from('user_credentials')
      .select('id, user_id, email, full_name, password_hash, tenant_id')
      .or(`email.ilike.${email},user_id.ilike.${rawIdentifier}`)
      .limit(5);

    const matchedCred = credRows?.find(
      (c) =>
        c.password_hash &&
        (c.password_hash === password || safeStringEqual(String(c.password_hash), password))
    );

    if (!matchedCred) {
      return null;
    }

    const targetEmail = (matchedCred.email || email).toLowerCase().trim();
    const fullName = matchedCred.full_name || targetEmail.split('@')[0];

    const synced = await syncSupabaseAuthPassword({ email: targetEmail, password, fullName });
    if (!synced) {
      return null;
    }

    return targetEmail;
  } catch (err) {
    console.warn('[API/auth/login] Legacy credential migration note:', err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  if (!isServerSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Authentication service unavailable: Supabase credentials not configured' },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const rawIdentifier = String(body.email || body.identifier || '').trim();
    let resolvedInputEmail = rawIdentifier.toLowerCase();

    // If caller supplied a User ID (without @), resolve its email from user_credentials or employees table
    if (resolvedInputEmail && !resolvedInputEmail.includes('@')) {
      const { data: idRows } = await supabaseAdmin
        .from('user_credentials')
        .select('email')
        .ilike('user_id', resolvedInputEmail)
        .order('created_at', { ascending: false })
        .limit(1);

      if (idRows && idRows[0]?.email) {
        resolvedInputEmail = idRows[0].email.toLowerCase().trim();
      } else {
        const { data: empRows } = await supabaseAdmin
          .from('employees')
          .select('email')
          .or(`username.ilike.${resolvedInputEmail},employee_id.ilike.${resolvedInputEmail}`)
          .limit(1);

        if (empRows && empRows[0]?.email) {
          resolvedInputEmail = empRows[0].email.toLowerCase().trim();
        }
      }
    }

    if (!resolvedInputEmail.includes('@')) {
      return NextResponse.json(
        { error: `User ID '${rawIdentifier}' was not found. Please verify your User ID or enter your registered email address.` },
        { status: 401 }
      );
    }

    const validation = LoginSchema.safeParse({
      email: resolvedInputEmail,
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

    let { email, password } = validation.data;
    const authClient = createAnonServerClient();

    // 1. Authenticate with Supabase Auth (stateless per-request client)
    let { data: authData, error: authError } = await authClient.auth.signInWithPassword({
      email,
      password,
    });

    // 1b. If user signed up via Google OAuth + set a password during onboarding, verify against
    // stored onboarding credential, migrate password into Supabase Auth, and sign in cleanly.
    if (authError || !authData.session || !authData.user) {
      const migratedEmail = await tryMigrateLegacyOnboardingCredential(email, rawIdentifier, password);
      if (migratedEmail) {
        email = migratedEmail;
        const retry = await authClient.auth.signInWithPassword({ email, password });
        authData = retry.data;
        authError = retry.error;
      }
    }

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
      return NextResponse.json(
        { error: 'Account is disabled. Please contact your dealership administrator.' },
        { status: 403 }
      );
    }

    // 3. Resolve tenant and role from trusted database (memberships -> employees -> onboarded dealership admin)
    const resolved = await resolveTrustedTenantRole(authUser.id, email, appUser, authUser.user_metadata);
    const resolvedTenantId = resolved.tenantId;
    const resolvedRoleKey = resolved.roleKey;
    const branchIds = resolved.branchIds;

    // 4. Reject if no valid tenant association
    if (!resolvedTenantId) {
      return NextResponse.json(
        { error: 'Account has no active dealership membership. Contact your administrator.' },
        { status: 403 }
      );
    }

    // 5. Reject if role is unauthorized or unrecognized
    if (!resolvedRoleKey || !VALID_ROLES.includes(resolvedRoleKey as UserRole)) {
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

    const isOnboarded = await checkAccountOnboardingStatus({
      tenantId: resolvedTenantId,
      email,
      role: resolvedRoleKey,
    });

    // 6. Build response and set all canonical server session cookies
    const response = NextResponse.json({
      success: true,
      token: sessionToken,
      refreshToken: authData.session.refresh_token,
      isOnboarded,
      user: {
        id: authUser.id,
        email: authUser.email,
        fullName,
      },
      tenantId: resolvedTenantId,
      role: resolvedRoleKey,
      branchIds,
    });

    await setSessionCookies(response, {
      accessToken: sessionToken,
      userId: authUser.id,
      tenantId: resolvedTenantId,
      role: resolvedRoleKey,
      isOnboarded,
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
