export const PUBLIC_PAGE_PREFIXES = [
  '/login',
  '/emplogin',
  '/onboarding',
  '/auth',
  '/_next',
  '/api/auth',
  '/unai-logo',
  '/favicon.ico',
] as const;

export const STANDALONE_SHELL_PREFIXES = [
  '/',
  '/onboarding',
  '/login',
  '/emplogin',
  '/auth',
] as const;

export const PROTECTED_PAGE_PREFIXES = [
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
  '/ai',
  '/empportal',
  '/employees',
] as const;

export const FINANCE_ALLOWED_ROLES = ['tenant_admin', 'branch_manager', 'finance_manager'] as const;
export const ADMIN_ALLOWED_ROLES = ['tenant_admin', 'branch_manager'] as const;

export function matchesRoutePrefix(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) =>
    prefix === '/' ? pathname === '/' : pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function isPublicPagePath(pathname: string): boolean {
  return pathname === '/' || matchesRoutePrefix(pathname, PUBLIC_PAGE_PREFIXES);
}

export function isProtectedPagePath(pathname: string): boolean {
  return matchesRoutePrefix(pathname, PROTECTED_PAGE_PREFIXES);
}

export function isStandaloneShellPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return matchesRoutePrefix(pathname, STANDALONE_SHELL_PREFIXES);
}

export function isWorkspaceContentPath(pathname: string | null | undefined): boolean {
  return Boolean(pathname) && !isStandaloneShellPath(pathname);
}

export interface StaffAccessPermissions {
  pipeline?: boolean;
  customers?: boolean;
  inventory?: boolean;
  procurement?: boolean;
  deals?: boolean;
  finance?: boolean;
  documents?: boolean;
  reports?: boolean;
  testDrives?: boolean;
}

const STAFF_ADMIN_ONLY_PATHS = ['/employees', '/settings', '/dashboard', '/onboarding'] as const;

const STAFF_ROUTE_PERMISSIONS: ReadonlyArray<{
  matches: (pathname: string) => boolean;
  permission: keyof StaffAccessPermissions;
}> = [
  { matches: (p) => p.startsWith('/finance'), permission: 'finance' },
  { matches: (p) => p.startsWith('/crm/leads'), permission: 'pipeline' },
  { matches: (p) => p.startsWith('/crm/customers'), permission: 'customers' },
  { matches: (p) => p.startsWith('/vehicles/procurement'), permission: 'procurement' },
  {
    matches: (p) => p.startsWith('/vehicles') && !p.startsWith('/vehicles/procurement'),
    permission: 'inventory',
  },
  { matches: (p) => p.startsWith('/sales'), permission: 'deals' },
  { matches: (p) => p.startsWith('/documents'), permission: 'documents' },
  { matches: (p) => p.startsWith('/reports'), permission: 'reports' },
  { matches: (p) => p.startsWith('/test-drives'), permission: 'testDrives' },
];

export function isStaffAllowedOnPath(
  pathname: string,
  access?: StaffAccessPermissions
): boolean {
  if ((STAFF_ADMIN_ONLY_PATHS as readonly string[]).includes(pathname)) {
    return false;
  }
  for (const rule of STAFF_ROUTE_PERMISSIONS) {
    if (rule.matches(pathname) && !access?.[rule.permission]) {
      return false;
    }
  }
  return true;
}

