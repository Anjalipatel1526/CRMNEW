import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySignedSession } from '@/lib/shared/session-signature';
import {
  isPublicPagePath,
  isProtectedPagePath,
  FINANCE_ALLOWED_ROLES,
  ADMIN_ALLOWED_ROLES,
} from '@/config/routes';

/**
 * Basic JWT payload parser without external crypto dependencies (runs cleanly in Edge runtime)
 */
function isTokenValid(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
    if (!payload || !payload.exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicPagePath(pathname)) {
    return NextResponse.next();
  }

  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  let token: string | null = null;
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    token = authHeader.slice(7).trim();
  } else {
    token =
      req.cookies.get('sb-access-token')?.value ||
      req.cookies.get('crm-token')?.value ||
      req.cookies.get('crm_access_token')?.value ||
      null;
  }

  const hasValidToken = Boolean(token && isTokenValid(token));

  if (pathname.startsWith('/api/')) {
    if (!hasValidToken) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required. Please provide a valid session token.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  if (isProtectedPagePath(pathname)) {
    if (!hasValidToken) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const sessionCookie = req.cookies.get('crm-session')?.value;
    const verified = sessionCookie ? await verifySignedSession(sessionCookie) : null;

    if (!verified) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Enforce mandatory onboarding before accessing dashboard or CRM workspace
    if (verified.role === 'tenant_admin' && verified.isOnboarded !== true) {
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }

    if (pathname.startsWith('/finance') && !(FINANCE_ALLOWED_ROLES as readonly string[]).includes(verified.role)) {
      return NextResponse.redirect(new URL('/empportal', req.url));
    }

    if (pathname.startsWith('/employees') && !(ADMIN_ALLOWED_ROLES as readonly string[]).includes(verified.role)) {
      return NextResponse.redirect(new URL('/empportal', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
