import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Defense-in-depth: Ensure this server module is NEVER executed in a browser environment
if (typeof window !== 'undefined') {
  throw new Error('Security Violation: @/lib/supabase-server can only be imported in server-side environments.');
}

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://rastqlhojjtpuaikxhvm.supabase.co';

const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE ||
  '';

/**
 * Checks whether the Supabase Service Role administrative environment is configured.
 */
export function isSupabaseAdminConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    serviceRoleKey &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseUrl.includes('your-project')
  );
}

/**
 * Server-Side Supabase Admin Client using Service Role Key (bypasses RLS)
 * Strictly restricted to server-side Route Handlers and Server Actions.
 * Never exported to client-accessible bundles.
 */
let cachedAdminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cachedAdminClient) return cachedAdminClient;

  if (!serviceRoleKey) {
    console.error(
      '[SupabaseServer] CRITICAL: SUPABASE_SERVICE_ROLE_KEY is not defined in the server environment.'
    );
  }

  cachedAdminClient = createClient(
    supabaseUrl,
    serviceRoleKey || 'unconfigured-service-role-key',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  return cachedAdminClient;
}

// Proxy wrapper for backward-compatibility with direct `supabaseAdmin.from(...)` usage
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin();
    const val = (client as any)[prop];
    if (typeof val === 'function') {
      return val.bind(client);
    }
    return val;
  },
});

/**
 * Creates a server-side Supabase client scoped to an incoming request's session token.
 * Authenticated calls made through this client are subject to PostgreSQL RLS policies.
 */
export function createServerClient(tokenOrReq?: string | { headers: Headers; cookies?: any }) {
  let token: string | null = null;
  if (typeof tokenOrReq === 'string') {
    token = tokenOrReq;
  } else if (tokenOrReq && 'headers' in tokenOrReq) {
    const authHeader = tokenOrReq.headers.get('authorization') || tokenOrReq.headers.get('Authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.slice(7).trim();
    }
  }

  const anonKey =
    supabaseAnonKey ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  return createClient(
    supabaseUrl,
    anonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    }
  );
}
