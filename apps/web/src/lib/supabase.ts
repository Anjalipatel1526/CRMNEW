import { createClient } from '@supabase/supabase-js';

// Production Supabase Project Public Configuration (Anon Key only)
const DEFAULT_SUPABASE_URL = 'https://rastqlhojjtpuaikxhvm.supabase.co';
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc3RxbGhvamp0cHVhaWt4aHZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3MzgyNDAsImV4cCI6MjEwODMxNDI0MH0.5ijsZ41Ff1029LOOMqQ5_HiGbBBGWHNbEiUnV_jD25c';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

/**
 * Client-Side Supabase Client for UNAI CRM
 * Restricted strictly to publishable/anon operations.
 * Evaluates all queries under PostgreSQL Row-Level Security (RLS).
 * Persistent sessions and token auto-refresh enabled for browser usage.
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
