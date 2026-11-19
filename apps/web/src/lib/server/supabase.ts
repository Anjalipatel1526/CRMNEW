import { createClient, SupabaseClient } from '@supabase/supabase-js';

if (typeof window !== 'undefined') {
  throw new Error('Security Violation: @/lib/server/supabase can only be imported in server-side environments.');
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

export function isServerSupabaseConfigured(): boolean {
  const anonKey = supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return Boolean(
    supabaseUrl &&
      (anonKey || serviceRoleKey) &&
      !supabaseUrl.includes('placeholder') &&
      !supabaseUrl.includes('your-project')
  );
}

let cachedAdminClient: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
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

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin();
    const val = (client as any)[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  },
});

/**
 * Creates a stateless per-request Supabase client (never shares auth state across concurrent requests).
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

  const anonKey = supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  return createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });
}

export function createAnonServerClient() {
  return createServerClient();
}

