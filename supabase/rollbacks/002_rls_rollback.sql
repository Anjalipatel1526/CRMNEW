-- ============================================================================
-- RLS ROLLBACK MIGRATION
-- UNAI CRM — Rollback script for 001_rls_remediation.sql
-- ============================================================================
-- CAUTION: Rolling back will restore development-mode permissive policies.
-- Use ONLY in emergency staging/recovery environments.
-- ============================================================================

-- 1. Drop granular tenant-scoped policies on all 48 tables
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- 2. Drop helper functions
DROP FUNCTION IF EXISTS public.is_tenant_admin(TEXT);
DROP FUNCTION IF EXISTS public.get_user_role(TEXT);
DROP FUNCTION IF EXISTS public.is_tenant_member(TEXT);
DROP FUNCTION IF EXISTS public.user_tenant_ids();
DROP FUNCTION IF EXISTS public.auth_uid();

-- 3. Restore development baseline policies (from supabase_schema.sql lines 893-958)
CREATE POLICY "Public Read Access" ON public.company_profiles FOR SELECT USING (true);
CREATE POLICY "Public Insert/Update Access" ON public.company_profiles FOR ALL USING (true);
CREATE POLICY "Dealership Modules Public" ON public.dealership_modules FOR ALL USING (true);
CREATE POLICY "Tenants Access Policy" ON public.tenants FOR ALL USING (true);
CREATE POLICY "Branches Access Policy" ON public.branches FOR ALL USING (true);
CREATE POLICY "App Users Access Policy" ON public.app_users FOR ALL USING (true);
CREATE POLICY "Customers Access Policy" ON public.customers FOR ALL USING (true);
CREATE POLICY "Leads Access Policy" ON public.leads FOR ALL USING (true);
CREATE POLICY "Vehicles Access Policy" ON public.vehicles FOR ALL USING (true);
CREATE POLICY "Deals Access Policy" ON public.deals FOR ALL USING (true);
CREATE POLICY "Quotations Access Policy" ON public.quotations FOR ALL USING (true);
CREATE POLICY "Bookings Access Policy" ON public.bookings FOR ALL USING (true);
CREATE POLICY "Payments Access Policy" ON public.payments FOR ALL USING (true);
CREATE POLICY "Invoices Access Policy" ON public.invoices FOR ALL USING (true);
CREATE POLICY "Job Cards Access Policy" ON public.job_cards FOR ALL USING (true);
CREATE POLICY "Documents Access Policy" ON public.documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Employees Access Policy" ON public.employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Test Drives Access Policy" ON public.test_drives FOR ALL USING (true);
CREATE POLICY "Appointments Access Policy" ON public.appointments FOR ALL USING (true);
CREATE POLICY "User Credentials Access Policy" ON public.user_credentials FOR ALL USING (true);
CREATE POLICY "Activities Access Policy" ON public.activities FOR ALL USING (true);
CREATE POLICY "Vehicle Catalog Access Policy" ON public.vehicle_catalog FOR ALL USING (true);

-- 4. Restore storage baseline policies
DROP POLICY IF EXISTS "logos_public_read" ON storage.objects;
DROP POLICY IF EXISTS "logos_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "logos_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "photos_public_read" ON storage.objects;
DROP POLICY IF EXISTS "photos_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "photos_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "docs_auth_read" ON storage.objects;
DROP POLICY IF EXISTS "docs_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "docs_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "sigs_auth_read" ON storage.objects;
DROP POLICY IF EXISTS "sigs_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "sigs_auth_update" ON storage.objects;

CREATE POLICY "Public Storage Read" ON storage.objects FOR SELECT USING (true);
CREATE POLICY "Public Storage Upload" ON storage.objects FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Storage Update" ON storage.objects FOR UPDATE USING (true);
