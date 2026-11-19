-- ============================================================================
-- MIGRATION 005: LINK SUPABASE AUTH UID (auth.users.id) AS FOREIGN KEY
-- UNAI CRM — Enterprise Automotive Dealership Platform
-- ============================================================================
-- Run this in Supabase Dashboard -> SQL Editor -> New Query -> Run
-- Safe & idempotent: preserves existing TEXT primary keys while enforcing true
-- PostgreSQL Foreign Key constraints to auth.users(id).
-- ============================================================================

-- 1. ADD auth_user_id (UUID FOREIGN KEY -> auth.users(id)) TO CORE TABLES
ALTER TABLE public.app_users
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.company_profiles
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.user_credentials
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS owner_uid UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. UNIQUE & PERFORMANCE INDEXES ON THE AUTH UID FOREIGN KEYS
CREATE UNIQUE INDEX IF NOT EXISTS idx_app_users_auth_user_id
  ON public.app_users (auth_user_id)
  WHERE auth_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_memberships_auth_user_id
  ON public.memberships (auth_user_id, tenant_id);

CREATE INDEX IF NOT EXISTS idx_company_profiles_auth_user_id
  ON public.company_profiles (auth_user_id);

CREATE INDEX IF NOT EXISTS idx_user_credentials_auth_user_id
  ON public.user_credentials (auth_user_id);

CREATE INDEX IF NOT EXISTS idx_employees_auth_user_id
  ON public.employees (auth_user_id);

CREATE INDEX IF NOT EXISTS idx_tenants_owner_uid
  ON public.tenants (owner_uid);

-- 3. BACKFILL EXISTING ROWS FROM auth.users BY MATCHING EMAIL
UPDATE public.app_users apu
SET auth_user_id = au.id
FROM auth.users au
WHERE lower(apu.email) = lower(au.email)
  AND apu.auth_user_id IS NULL;

UPDATE public.memberships m
SET auth_user_id = apu.auth_user_id
FROM public.app_users apu
WHERE m.user_id = apu.id
  AND apu.auth_user_id IS NOT NULL
  AND m.auth_user_id IS NULL;

UPDATE public.company_profiles cp
SET auth_user_id = au.id
FROM auth.users au
WHERE lower(cp.email) = lower(au.email)
  AND cp.auth_user_id IS NULL;

UPDATE public.user_credentials uc
SET auth_user_id = au.id
FROM auth.users au
WHERE lower(uc.email) = lower(au.email)
  AND uc.auth_user_id IS NULL;

UPDATE public.employees e
SET auth_user_id = au.id
FROM auth.users au
WHERE lower(e.email) = lower(au.email)
  AND e.auth_user_id IS NULL;

UPDATE public.tenants t
SET owner_uid = au.id
FROM auth.users au
WHERE lower(t.primary_email) = lower(au.email)
  AND t.owner_uid IS NULL;

-- 4. AUTO-SYNC TRIGGER: WHENEVER A USER SIGNS UP IN SUPABASE AUTH,
--    AUTOMATICALLY LINK / CREATE THEIR public.app_users ROW WITH auth_user_id = NEW.id
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If an app_users record already exists for this email, attach auth_user_id
  UPDATE public.app_users
  SET
    auth_user_id = NEW.id,
    full_name = COALESCE(NULLIF(full_name, ''), NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    avatar_url = COALESCE(avatar_url, NEW.raw_user_meta_data->>'avatar_url'),
    updated_at = NOW()
  WHERE lower(email) = lower(NEW.email);

  -- Otherwise insert a new app_users row using NEW.id (auth.users.id)
  IF NOT FOUND THEN
    INSERT INTO public.app_users (id, auth_user_id, email, full_name, avatar_url, is_active)
    VALUES (
      NEW.id::text,
      NEW.id,
      lower(NEW.email),
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      NEW.raw_user_meta_data->>'avatar_url',
      TRUE
    )
    ON CONFLICT (email) DO UPDATE
      SET auth_user_id = EXCLUDED.auth_user_id,
          updated_at = NOW();
  END IF;

  -- Also link any matching company_profiles / user_credentials / employees / memberships rows
  UPDATE public.company_profiles
  SET auth_user_id = NEW.id
  WHERE lower(email) = lower(NEW.email) AND auth_user_id IS NULL;

  UPDATE public.user_credentials
  SET auth_user_id = NEW.id
  WHERE lower(email) = lower(NEW.email) AND auth_user_id IS NULL;

  UPDATE public.employees
  SET auth_user_id = NEW.id
  WHERE lower(email) = lower(NEW.email) AND auth_user_id IS NULL;

  UPDATE public.memberships m
  SET auth_user_id = NEW.id
  FROM public.app_users apu
  WHERE m.user_id = apu.id AND apu.auth_user_id = NEW.id AND m.auth_user_id IS NULL;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- 5. UPDATE RLS HELPER FUNCTIONS TO USE THE auth_user_id FOREIGN KEY DIRECTLY
CREATE OR REPLACE FUNCTION public.is_tenant_member(target_tenant_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_id UUID;
  v_found   BOOLEAN := FALSE;
BEGIN
  v_auth_id := auth.uid();
  IF v_auth_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check 1: Direct FK match on memberships.auth_user_id = auth.uid()
  SELECT EXISTS(
    SELECT 1 FROM public.memberships m
    WHERE m.tenant_id = target_tenant_id
      AND (m.auth_user_id = v_auth_id OR m.user_id = v_auth_id::text)
      AND m.is_active = TRUE
  ) INTO v_found;
  IF v_found THEN RETURN TRUE; END IF;

  -- Check 2: Direct FK match on app_users.auth_user_id -> memberships
  SELECT EXISTS(
    SELECT 1
    FROM public.app_users apu
    JOIN public.memberships m ON m.user_id = apu.id
    WHERE apu.auth_user_id = v_auth_id
      AND m.tenant_id = target_tenant_id
      AND m.is_active = TRUE
  ) INTO v_found;
  IF v_found THEN RETURN TRUE; END IF;

  -- Check 3: Direct FK match on employees.auth_user_id = auth.uid()
  SELECT EXISTS(
    SELECT 1
    FROM public.employees e
    WHERE e.auth_user_id = v_auth_id
      AND e.tenant_id = target_tenant_id
      AND e.is_active = TRUE
  ) INTO v_found;
  IF v_found THEN RETURN TRUE; END IF;

  -- Check 4: Direct FK match on company_profiles.auth_user_id
  SELECT EXISTS(
    SELECT 1
    FROM public.company_profiles cp
    WHERE cp.auth_user_id = v_auth_id
      AND cp.tenant_id = target_tenant_id
  ) INTO v_found;

  RETURN v_found;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(target_tenant_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_id UUID;
  v_role    TEXT;
BEGIN
  v_auth_id := auth.uid();
  IF v_auth_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Check 1: Direct FK lookup on memberships.auth_user_id
  SELECT m.role_key INTO v_role
  FROM public.memberships m
  WHERE m.tenant_id = target_tenant_id
    AND (m.auth_user_id = v_auth_id OR m.user_id = v_auth_id::text)
    AND m.is_active = TRUE
  LIMIT 1;
  IF v_role IS NOT NULL THEN RETURN v_role; END IF;

  -- Check 2: Via app_users.auth_user_id -> memberships
  SELECT m.role_key INTO v_role
  FROM public.app_users apu
  JOIN public.memberships m ON m.user_id = apu.id
  WHERE apu.auth_user_id = v_auth_id
    AND m.tenant_id = target_tenant_id
    AND m.is_active = TRUE
  LIMIT 1;
  IF v_role IS NOT NULL THEN RETURN v_role; END IF;

  -- Check 3: Via employees.auth_user_id
  SELECT e.role INTO v_role
  FROM public.employees e
  WHERE e.auth_user_id = v_auth_id
    AND e.tenant_id = target_tenant_id
    AND e.is_active = TRUE
  LIMIT 1;
  IF v_role IS NOT NULL THEN RETURN v_role; END IF;

  -- Check 4: Dealership owner via company_profiles.auth_user_id
  IF EXISTS (
    SELECT 1 FROM public.company_profiles cp
    WHERE cp.auth_user_id = v_auth_id AND cp.tenant_id = target_tenant_id
  ) THEN
    RETURN 'tenant_admin';
  END IF;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.is_tenant_member(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_tenant_member(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_tenant_member(TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.get_user_role(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_role(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(TEXT) TO service_role;

