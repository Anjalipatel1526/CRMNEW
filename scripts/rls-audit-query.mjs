import { loadWorkspaceEnv } from './lib/env.mjs';

loadWorkspaceEnv();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rastqlhojjtpuaikxhvm.supabase.co';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// The Supabase project exposes a pg_graphql and a SQL execution endpoint
// Try using the Supabase pgMeta HTTP API for executing SQL

async function runSQL(sql) {
  // Try Supabase's internal SQL execution endpoint (pgMeta)
  // The service-role key should allow calling /pg which is the Postgres Meta API
  const endpoints = [
    '/pg/query',
    '/rest/v1/rpc/exec_sql',
  ];
  
  for (const ep of endpoints) {
    try {
      const res = await fetch(SUPABASE_URL + ep, {
        method: 'POST',
        headers: {
          'apikey': KEY,
          'Authorization': 'Bearer ' + KEY,
          'Content-Type': 'application/json',
          'X-Connection-Encrypted': 'true'
        },
        body: JSON.stringify({ query: sql })
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (e) {}
  }
  return null;
}

async function main() {
  // Step 1: Create the rls_audit function
  const createFuncSQL = `
CREATE OR REPLACE FUNCTION public.rls_audit()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $fn$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'tables', (
      SELECT json_agg(json_build_object(
        'tn', c.relname,
        'rls', c.relrowsecurity,
        'force', c.relforcerowsecurity
      ) ORDER BY c.relname)
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'
    ),
    'policies', (
      SELECT json_agg(json_build_object(
        'tn', c.relname,
        'pn', p.polname,
        'cmd', CASE p.polcmd WHEN 'r' THEN 'SELECT' WHEN 'a' THEN 'INSERT' WHEN 'w' THEN 'UPDATE' WHEN 'd' THEN 'DELETE' WHEN '*' THEN 'ALL' END,
        'perm', p.polpermissive,
        'q', pg_get_expr(p.polqual, p.polrelid, true),
        'wc', pg_get_expr(p.polwithcheck, p.polrelid, true)
      ) ORDER BY c.relname, p.polname)
      FROM pg_policy p
      JOIN pg_class c ON c.oid = p.polrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
    ),
    'storage', (
      SELECT json_agg(json_build_object(
        'id', id, 'name', name, 'pub', public
      ))
      FROM storage.buckets
    ),
    'storage_policies', (
      SELECT json_agg(json_build_object(
        'tn', c.relname,
        'pn', p.polname,
        'cmd', CASE p.polcmd WHEN 'r' THEN 'SELECT' WHEN 'a' THEN 'INSERT' WHEN 'w' THEN 'UPDATE' WHEN 'd' THEN 'DELETE' WHEN '*' THEN 'ALL' END,
        'q', pg_get_expr(p.polqual, p.polrelid, true),
        'wc', pg_get_expr(p.polwithcheck, p.polrelid, true)
      ) ORDER BY c.relname, p.polname)
      FROM pg_policy p
      JOIN pg_class c ON c.oid = p.polrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'storage'
    )
  ) INTO result;
  RETURN result;
END;
$fn$;
  `;

  // Try direct REST approach to execute raw SQL: use Supabase's /rest/v1/ 
  // The only way with just REST + service key is to:
  // 1. Try to call the function - if 404, function doesn't exist
  // 2. We CAN use pg_tables view and pg_policies view through PostgREST's auto-API

  // Actually, let's just query the information available via PostgREST:
  // pg_tables is available if the schema is exposed

  // Let's probe what schemas/tables PostgREST exposes
  const schemasRes = await fetch(SUPABASE_URL + '/rest/v1/', {
    headers: { apikey: KEY, Authorization: 'Bearer ' + KEY }
  });
  const openapi = await schemasRes.json();
  
  // List all available paths
  if (openapi.paths) {
    const paths = Object.keys(openapi.paths).slice(0, 20);
    console.log('API Paths available:', paths);
  }
  if (openapi.definitions) {
    console.log('Tables:', Object.keys(openapi.definitions).sort());
  }

  // Try to query storage.buckets
  const bucketsRes = await fetch(SUPABASE_URL + '/storage/v1/bucket', {
    headers: { apikey: KEY, Authorization: 'Bearer ' + KEY }
  });
  if (bucketsRes.ok) {
    const buckets = await bucketsRes.json();
    console.log('\nSTORAGE BUCKETS:');
    console.log(JSON.stringify(buckets, null, 2));
  }

  // The key insight: with service_role key but no psql/supabase CLI,
  // we can't create functions via REST API. But we CAN infer RLS status from
  // what the schema file says and what the anon key can access.
  
  // Test: query each table with anon key to see what's accessible
  const ANON = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  const tables = ["activities","app_users","appointments","audit_events","bookings","branches","campaigns","company_profiles","complaints","customers","dealership_modules","deals","deliveries","discount_approvals","documents","employees","expenses","inspections","insurance_policies","invoices","job_cards","labour_items","leads","memberships","opportunities","part_usage","parts","payment_allocations","payments","pdi_records","purchase_orders","quotation_items","quotations","reconditioning_jobs","referrals","refunds","registration_cases","role_permissions","service_appointments","suppliers","tenants","test_drives","trade_in_appraisals","user_credentials","vehicle_catalog","vehicle_costs","vehicle_locations","vehicle_photos","vehicles"];
  
  console.log('\n\nANONYMOUS ACCESS AUDIT (anon key, limit 1 per table):');
  console.log('=' .repeat(80));
  
  for (const t of tables) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?limit=1`, {
        headers: { apikey: ANON, Authorization: 'Bearer ' + ANON }
      });
      const status = r.status;
      let rowCount = '?';
      if (r.ok) {
        const data = await r.json();
        rowCount = data.length;
      }
      const prefix = status === 200 ? '⚠️  ACCESSIBLE' : '✅ BLOCKED';
      console.log(`${prefix} | ${t.padEnd(25)} | HTTP ${status} | Rows returned: ${rowCount}`);
    } catch (e) {
      console.log(`❌ ERROR    | ${t.padEnd(25)} | ${e.message}`);
    }
  }
  
  // Also test: can anon INSERT into tables?
  console.log('\n\nANONYMOUS WRITE AUDIT (attempting INSERT with anon key):');
  console.log('=' .repeat(80));
  
  const writeTests = [
    { table: 'tenants', body: { name: 'HACK', slug: 'hack-test', primary_contact_name: 'x', primary_email: 'x@x', primary_phone: '0' } },
    { table: 'customers', body: { tenant_id: 't-apex-001', first_name: 'HACK', phone: '000' } },
    { table: 'deals', body: { tenant_id: 't-apex-001', branch_id: 'b-dt-001', customer_id: 'x', deal_number: 'HACK-001', vehicle_price: 0 } },
    { table: 'payments', body: { tenant_id: 't-apex-001', branch_id: 'b-dt-001', customer_id: 'x', payment_number: 'HACK-001', method: 'cash', amount: 999999 } },
    { table: 'memberships', body: { tenant_id: 't-apex-001', user_id: 'hack-user', role_key: 'tenant_admin' } },
    { table: 'user_credentials', body: { tenant_id: 't-apex-001', user_id: 'hack-user', full_name: 'HACKER', email: 'hack@x.com' } },
  ];
  
  for (const wt of writeTests) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${wt.table}`, {
        method: 'POST',
        headers: { 
          apikey: ANON, 
          Authorization: 'Bearer ' + ANON, 
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(wt.body)
      });
      const prefix = r.status >= 400 ? '✅ BLOCKED' : '🚨 INSERTED';
      const msg = r.status >= 400 ? (await r.json()).message : '';
      console.log(`${prefix} | INSERT ${wt.table.padEnd(20)} | HTTP ${r.status} | ${msg}`);
    } catch (e) {
      console.log(`❌ ERROR    | INSERT ${wt.table.padEnd(20)} | ${e.message}`);
    }
  }
}

main().catch(e => console.error(e));
