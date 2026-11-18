-- ============================================================================
-- MIGRATION 003: SUPABASE STORAGE SECURITY REMEDIATION
-- Dealership CRM/ERP - Tenant-Aware Storage Isolation & Bucket Hardening
-- ============================================================================

-- Step 1: Ensure Storage Buckets with Strict Access Controls
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'dealership-documents', 
    'dealership-documents', 
    false, 
    15728640, -- 15MB maximum
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'signatures', 
    'signatures', 
    false, 
    5242880,  -- 5MB maximum
    ARRAY['image/png', 'image/svg+xml', 'image/jpeg']
  ),
  (
    'dealership-logos', 
    'dealership-logos', 
    true, 
    2097152,  -- 2MB maximum
    ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
  ),
  (
    'vehicle-photos', 
    'vehicle-photos', 
    true, 
    10485760, -- 10MB maximum
    ARRAY['image/png', 'image/jpeg', 'image/webp']
  )
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Step 2: Drop Insecure and Legacy Storage Policies
DROP POLICY IF EXISTS "Public Storage Read" ON storage.objects;
DROP POLICY IF EXISTS "Public Storage Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Storage Update" ON storage.objects;
DROP POLICY IF EXISTS "docs_auth_read" ON storage.objects;
DROP POLICY IF EXISTS "docs_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "docs_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "sigs_auth_read" ON storage.objects;
DROP POLICY IF EXISTS "sigs_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "sigs_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "docs_tenant_read" ON storage.objects;
DROP POLICY IF EXISTS "docs_tenant_upload" ON storage.objects;
DROP POLICY IF EXISTS "docs_tenant_update" ON storage.objects;
DROP POLICY IF EXISTS "docs_tenant_delete" ON storage.objects;
DROP POLICY IF EXISTS "sigs_tenant_read" ON storage.objects;
DROP POLICY IF EXISTS "sigs_tenant_upload" ON storage.objects;
DROP POLICY IF EXISTS "sigs_tenant_update" ON storage.objects;
DROP POLICY IF EXISTS "sigs_tenant_delete" ON storage.objects;
DROP POLICY IF EXISTS "logos_public_read" ON storage.objects;
DROP POLICY IF EXISTS "logos_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "logos_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "photos_public_read" ON storage.objects;
DROP POLICY IF EXISTS "photos_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "photos_auth_update" ON storage.objects;

-- Step 3: Granular Tenant-Isolated Policies for dealership-documents (Private)
-- Object path convention: ${tenantId}/${category}/${entityId}/${docId}/${fileName}

-- 3a. Read: Authenticated user belonging to tenant identified by first path segment
CREATE POLICY "docs_tenant_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'dealership-documents'
    AND (
      (storage.foldername(name))[1] = ANY(public.user_tenant_ids())
      OR public.has_role_on_tenant((storage.foldername(name))[1], 'tenant_admin')
    )
  );

-- 3b. Upload (Insert): Authenticated user writing to their tenant path
CREATE POLICY "docs_tenant_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'dealership-documents'
    AND (storage.foldername(name))[1] = ANY(public.user_tenant_ids())
  );

-- 3c. Update: Authenticated user writing to their tenant path
CREATE POLICY "docs_tenant_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'dealership-documents'
    AND (storage.foldername(name))[1] = ANY(public.user_tenant_ids())
  );

-- 3d. Delete: Only tenant_admin or branch_manager of that tenant
CREATE POLICY "docs_tenant_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'dealership-documents'
    AND (
      public.has_role_on_tenant((storage.foldername(name))[1], 'tenant_admin')
      OR public.has_role_on_tenant((storage.foldername(name))[1], 'branch_manager')
    )
  );

-- Step 4: Granular Tenant-Isolated Policies for signatures (Private)
-- Object path convention: ${tenantId}/signatures/${entityId}/${docId}/${fileName}

-- 4a. Read: Authenticated user belonging to the tenant
CREATE POLICY "sigs_tenant_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'signatures'
    AND (
      (storage.foldername(name))[1] = ANY(public.user_tenant_ids())
      OR public.has_role_on_tenant((storage.foldername(name))[1], 'tenant_admin')
    )
  );

-- 4b. Upload (Insert): Authenticated user uploading to their tenant path
CREATE POLICY "sigs_tenant_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'signatures'
    AND (storage.foldername(name))[1] = ANY(public.user_tenant_ids())
  );

-- 4c. Update: Authenticated user updating in their tenant path
CREATE POLICY "sigs_tenant_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'signatures'
    AND (storage.foldername(name))[1] = ANY(public.user_tenant_ids())
  );

-- 4d. Delete: Administrative roles only
CREATE POLICY "sigs_tenant_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'signatures'
    AND public.has_role_on_tenant((storage.foldername(name))[1], 'tenant_admin')
  );

-- Step 5: Public Assets Policies (Logos and Vehicle Photos)
-- 5a. Logos: Public Read, Tenant Admin Write
CREATE POLICY "logos_public_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'dealership-logos');

CREATE POLICY "logos_admin_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'dealership-logos'
    AND (storage.foldername(name))[1] = ANY(public.user_tenant_ids())
  );

CREATE POLICY "logos_admin_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'dealership-logos'
    AND (storage.foldername(name))[1] = ANY(public.user_tenant_ids())
  );

-- 5b. Photos: Public Read, Tenant Staff Write
CREATE POLICY "photos_public_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'vehicle-photos');

CREATE POLICY "photos_staff_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'vehicle-photos'
    AND (storage.foldername(name))[1] = ANY(public.user_tenant_ids())
  );

CREATE POLICY "photos_staff_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'vehicle-photos'
    AND (storage.foldername(name))[1] = ANY(public.user_tenant_ids())
  );
