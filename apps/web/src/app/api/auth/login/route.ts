import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-server';
import { VALID_ROLES, resolveTrustedTenantRole } from '@/lib/server-auth';
import { UserRole } from '@crm/shared-types';
import { signSessionPayload } from '@/lib/session-signature';
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
      .select('user_id, email, full_name, password_hash, tenant_id')
      .or(`email.ilike.${email},user_id.ilike.${rawIdentifier}`)
      .limit(5);

    const matchedCred = credRows?.find(
      (c) =>
        c.password_hash &&
        c.password_hash !== '[SUPABASE_AUTH_MANAGED]' &&
        safeStringEqual(String(c.password_hash), password)
    );

    if (!matchedCred) {
      return null;
    }

    const targetEmail = (matchedCred.email || email).toLowerCase().trim();
    const fullName = matchedCred.full_name || targetEmail.split('@')[0];

    // Check if user already exists in Supabase Auth (e.g., via Google OAuth)
    const { data: listed } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const existingAuthUser = listed?.users?.find(
      (u) => u.email?.toLowerCase().trim() === targetEmail
    );

    if (existingAuthUser) {
      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
        existingAuthUser.id,
        {
          password,
          email_confirm: true,
        }
      );
      if (updateErr) {
        console.error('[API/auth/login] Failed syncing password to auth.users:', updateErr.message);
        return null;
      }
    } else {
      const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: targetEmail,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (createErr) {
        console.error('[API/auth/login] Failed creating auth.users record:', createErr.message);
        return null;
      }
    }

    // Scrub plaintext password from user_credentials now that Supabase Auth holds the bcrypt hash
    await supabaseAdmin
      .from('user_credentials')
      .update({ password_hash: '[SUPABASE_AUTH_MANAGED]' })
      .eq('user_id', matchedCred.user_id);

    return targetEmail;
  } catch (err) {
    console.warn('[API/auth/login] Legacy credential migration note:', err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Authentication service unavailable: Supabase credentials not configured' },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const rawIdentifier = String(body.email || body.identifier || '').trim();
    let resolvedInputEmail = rawIdentifier.toLowerCase();

    // If caller supplied a User ID (without @), resolve its email from user_credentials
    if (resolvedInputEmail && !resolvedInputEmail.includes('@')) {
      const { data: idRows } = await supabaseAdmin
        .from('user_credentials')
        .select('email')
        .ilike('user_id', resolvedInputEmail)
        .limit(1);

      if (idRows && idRows[0]?.email) {
        resolvedInputEmail = idRows[0].email.toLowerCase().trim();
      }
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

    // 1. Authenticate with Supabase Auth (verifies cryptographic hash)
    let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // 1b. If user signed up via Google OAuth + set a password during onboarding, verify against
    // stored onboarding credential, migrate password into Supabase Auth, and sign in cleanly.
    if (authError || !authData.session || !authData.user) {
      const migratedEmail = await tryMigrateLegacyOnboardingCredential(email, rawIdentifier, password);
      if (migratedEmail) {
        email = migratedEmail;
        const retry = await supabase.auth.signInWithPassword({ email, password });
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
      // Sign out immediately
      await supabase.auth.signOut();
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
      refreshToken: authData.session.refresh_token,
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
