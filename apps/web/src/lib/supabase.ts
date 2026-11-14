import { createClient } from '@supabase/supabase-js';

// Production Supabase Project Config
const DEFAULT_SUPABASE_URL = 'https://rastqlhojjtpuaikxhvm.supabase.co';
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc3RxbGhvamp0cHVhaWt4aHZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3MzgyNDAsImV4cCI6MjEwODMxNDI0MH0.5ijsZ41Ff1029LOOMqQ5_HiGbBBGWHNbEiUnV_jD25c';
const DEFAULT_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc3RxbGhvamp0cHVhaWt4aHZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjczODI0MCwiZXhwIjoyMTA4MzE0MjQwfQ.hphb6uhzUbImW3mL4Vx8DZKV8nGi7lnwPRu9tOICdCY';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

/**
 * Supabase Client for UNAI CRM
 * Configured with persistent sessions and auto-refreshing auth tokens.
 */
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE ||
  DEFAULT_SERVICE_ROLE_KEY;

/**
 * Supabase Admin Client using Service Role Key (bypasses RLS)
 * Safe for server-side API routes and backend syncing.
 */
export const supabaseAdmin = createClient(
  supabaseUrl,
  serviceKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * Checks whether valid Supabase environment credentials are configured
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://placeholder.supabase.co' &&
    !supabaseUrl.includes('your-project')
  );
}
