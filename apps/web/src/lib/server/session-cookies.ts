import { NextResponse } from 'next/server';
import { signSessionPayload } from '@/lib/shared/session-signature';

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export interface SessionCookieParams {
  accessToken: string;
  userId: string;
  tenantId: string;
  role: string;
  isOnboarded: boolean;
}

/**
 * Mints the HMAC-signed `crm-session` cookie and sets all canonical session cookies
 * (`sb-access-token`, `crm-session`, `crm-role`, `crm-tenant`) consistently across auth routes.
 */
export async function setSessionCookies(
  response: NextResponse,
  params: SessionCookieParams
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const signedSessionToken = await signSessionPayload({
    userId: params.userId,
    tenantId: params.tenantId,
    role: params.role,
    exp,
    isOnboarded: params.isOnboarded,
  });

  const isProd = process.env.NODE_ENV === 'production';
  const baseOptions = {
    path: '/',
    sameSite: 'lax' as const,
    secure: isProd,
    maxAge: SESSION_MAX_AGE_SECONDS,
  };

  response.cookies.set('sb-access-token', params.accessToken, {
    ...baseOptions,
    httpOnly: true,
  });

  response.cookies.set('crm-session', signedSessionToken, {
    ...baseOptions,
    httpOnly: true,
  });

  response.cookies.set('crm-role', params.role, baseOptions);
  response.cookies.set('crm-tenant', params.tenantId, baseOptions);

  return signedSessionToken;
}

/**
 * Clears every server-managed session cookie on logout (including HttpOnly `crm-session`).
 */
export function clearSessionCookies(response: NextResponse): void {
  response.cookies.delete('sb-access-token');
  response.cookies.delete('crm-session');
  response.cookies.delete('crm-token');
  response.cookies.delete('crm_access_token');
  response.cookies.delete('crm-role');
  response.cookies.delete('crm-tenant');
}

