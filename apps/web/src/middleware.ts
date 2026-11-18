import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySignedSession } from './lib/session-signature';

const PUBLIC_PAGE_PREFIXES = [
  '/login',
  '/emplogin',
  '/onboarding',
  '/auth',
  '/_next',
  '/api/auth',
  '/unai-logo',
  '/favicon.ico',
];

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/finance',
  '/sales',
  '/crm',
  '/vehicles',
  '/documents',
  '/reports',
  '/settings',
  '/service',
  '/marketing',
  '/test-drives',
  '/empportal',
  '/employees',
];

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

  // 1. Allow root path if it redirects or renders welcome
  if (pathname === '/') {
    return NextResponse.next();
  }

  // 2. Allow explicitly public paths
  for (const prefix of PUBLIC_PAGE_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      return NextResponse.next();
    }
  }

  // 3. Extract session token from cookies or Authorization header
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

  const hasValidToken = token && isTokenValid(token);

  // 4. Protect API routes: Return HTTP 401 Unauthorized if unauthenticated
  if (pathname.startsWith('/api/')) {
    if (!hasValidToken) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required. Please provide a valid session token.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // 5. Check if the path is in the protected pages list
  const isProtectedPage = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  );

  if (isProtectedPage) {
    if (!hasValidToken) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Cryptographically verified role-based route guard: protect /finance against restricted roles
    if (pathname.startsWith('/finance')) {
      const sessionCookie = req.cookies.get('crm-session')?.value;
      const verified = sessionCookie ? await verifySignedSession(sessionCookie) : null;
      const allowedFinanceRoles = ['tenant_admin', 'branch_manager', 'finance_manager'];
      if (!verified || !allowedFinanceRoles.includes(verified.role)) {
        return NextResponse.redirect(new URL('/empportal', req.url));
      }
    }

    // Protect administrative employee management against unauthorized staff
    if (pathname.startsWith('/employees')) {
      const sessionCookie = req.cookies.get('crm-session')?.value;
      const verified = sessionCookie ? await verifySignedSession(sessionCookie) : null;
      const allowedAdminRoles = ['tenant_admin', 'branch_manager'];
      if (!verified || !allowedAdminRoles.includes(verified.role)) {
        return NextResponse.redirect(new URL('/empportal', req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images, static assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
