-- ============================================================================
-- MIGRATION 006: ENTERPRISE UUID CASCADE DELETION ARCHITECTURE (SELF-HEALING)
-- UNAI CRM — Enterprise Automotive Dealership Management Platform
-- ============================================================================
-- Compatible with Supabase PostgreSQL (Postgres 15+)
-- Run this in the Supabase Dashboard: SQL Editor -> New Query -> Run
-- ============================================================================
-- Architecture Workflow:
-- 1. AUTH IDENTITY: Supabase Auth provisions an auth.users.id (UUID).
-- 2. COMPANY PROFILE ONBOARDING: Upon onboarding completion, the company/tenant
--    record is created with a true UUID (gen_random_uuid()).
-- 3. UNIVERSAL UUID STAMPING: Every single table created across the CRM stores
--    that exact same Company UUID in its tenant_id column.
-- 4. ATOMIC CASCADE DELETION: When a company is deleted via its UUID, PostgreSQL's
--    ON DELETE CASCADE automatically and completely purges all related records
--    across all 45+ tables with zero orphaned data.
-- ============================================================================

-- 0. EXTENSIONS & IMMEDIATE PRE-FLIGHT COLUMN CHECKS
-- Guarantees that whether tables are fresh or already exist from prior schema runs,
-- auth_user_id and owner_uid are added BEFORE any functions or policies execute.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_users') THEN
    ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'memberships') THEN
    ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'company_profiles') THEN
    ALTER TABLE public.company_profiles ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_credentials') THEN
    ALTER TABLE public.user_credentials ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
    ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenants') THEN
    ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS owner_uid UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- 1. CORE TENANCY & MULTI-TENANT ENTITIES
-- ============================================================================

-- Primary Tenant / Dealership Organization Entity
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('provisioning','active','suspended','cancelled')),
  dealer_model TEXT NOT NULL DEFAULT 'mixed' CHECK (dealer_model IN ('new','used','mixed','broker')),
  primary_contact_name TEXT NOT NULL DEFAULT 'Dealership Admin',
  primary_email TEXT NOT NULL,
  primary_phone TEXT NOT NULL DEFAULT '+91 98000 00000',
  currency TEXT NOT NULL DEFAULT 'INR',
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  owner_uid UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dealership Showrooms & Service Branches
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  address JSONB NOT NULL DEFAULT '{}'::jsonb,
  phone TEXT,
  email TEXT,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, code)
);

-- CRM User Registry (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User-to-Tenant Memberships & Roles
CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_key TEXT NOT NULL,
  branch_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  branch_scope TEXT NOT NULL DEFAULT 'assigned' CHECK (branch_scope IN ('all','assigned')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Custom Role Permissions per Tenant
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role_key TEXT NOT NULL,
  permission_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, role_key, permission_key)
);

-- Dealership Company Profile (Filled during 5-step onboarding)
CREATE TABLE IF NOT EXISTS public.company_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  legal_name TEXT NOT NULL DEFAULT '',
  trade_name TEXT NOT NULL DEFAULT '',
  tagline TEXT DEFAULT '',
  dealership_type TEXT NOT NULL DEFAULT 'authorized_franchise',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  support_phone TEXT DEFAULT '',
  website TEXT DEFAULT '',
  address TEXT DEFAULT '',
  city TEXT DEFAULT '',
  state TEXT DEFAULT '',
  pincode TEXT DEFAULT '',
  country TEXT DEFAULT 'India',
  gstin TEXT DEFAULT '',
  pan TEXT DEFAULT '',
  cin TEXT DEFAULT '',
  currency TEXT NOT NULL DEFAULT 'INR (₹)',
  bank_name TEXT DEFAULT '',
  account_number TEXT DEFAULT '',
  ifsc_code TEXT DEFAULT '',
  branch_name TEXT DEFAULT '',
  upi_id TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  watermark_enabled BOOLEAN NOT NULL DEFAULT true,
  watermark_opacity NUMERIC(4,3) NOT NULL DEFAULT 0.08,
  authorized_signatory_name TEXT DEFAULT '',
  authorized_signatory_designation TEXT DEFAULT '',
  signature_url TEXT DEFAULT '',
  is_onboarded BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dealership Dynamic Modules (Plugin-in / Plugin-out system)
CREATE TABLE IF NOT EXISTS public.dealership_modules (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  href TEXT NOT NULL,
  icon TEXT NOT NULL,
  is_plugged_in BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Credentials from Onboarding Flow
CREATE TABLE IF NOT EXISTS public.user_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  password_hash TEXT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dealership Staff Registry
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'sales_executive',
  department TEXT NOT NULL DEFAULT 'Sales',
  is_active BOOLEAN NOT NULL DEFAULT true,
  joined_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. CRM & PIPELINE TABLES (ALL SCOPED BY tenant_id UUID ON DELETE CASCADE)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'individual' CHECK (type IN ('individual','business')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT NOT NULL,
  pan_number TEXT,
  aadhaar_number TEXT,
  company_name TEXT,
  gstin TEXT,
  city TEXT DEFAULT '',
  state TEXT DEFAULT '',
  pincode TEXT DEFAULT '',
  address JSONB NOT NULL DEFAULT '{}'::jsonb,
  consent JSONB NOT NULL DEFAULT '{"whatsapp": true, "sms": true, "email": true}'::jsonb,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','assigned','contacted','qualified','appointment_set','test_drive','negotiation','converted','lost','nurture')),
  assigned_to UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  budget_min NUMERIC(14,2),
  budget_max NUMERIC(14,2),
  preferred_make TEXT,
  preferred_model TEXT,
  preferred_fuel_type TEXT,
  timeline TEXT,
  lost_reason TEXT,
  score NUMERIC(5,2) DEFAULT 50.0,
  next_action_at TIMESTAMPTZ,
  notes TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('customer','lead','vehicle','deal')),
  entity_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('call','email','whatsapp','meeting','note','test_drive','follow_up','task','status_change','system_event')),
  subject TEXT NOT NULL,
  notes TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  vehicle_id UUID,
  assigned_to UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  appointment_type TEXT NOT NULL CHECK (appointment_type IN ('showroom_visit','test_drive','document_pickup','delivery','service','other')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','confirmed','in_progress','completed','cancelled','no_show')),
  outcome TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.test_drives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  start_odometer INTEGER,
  end_odometer INTEGER,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  route TEXT,
  feedback TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. VEHICLE INVENTORY & PROCUREMENT (tenant_id UUID ON DELETE CASCADE)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vehicle_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  variant TEXT NOT NULL,
  model_year INTEGER NOT NULL,
  body_type TEXT NOT NULL,
  fuel_type TEXT NOT NULL,
  transmission TEXT NOT NULL,
  engine_capacity_cc INTEGER,
  specs JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  catalog_id UUID REFERENCES public.vehicle_catalog(id) ON DELETE SET NULL,
  stock_number TEXT NOT NULL,
  vin TEXT NOT NULL,
  registration_number TEXT,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  variant TEXT NOT NULL DEFAULT 'Base',
  year INTEGER NOT NULL,
  color TEXT NOT NULL,
  mileage_km INTEGER NOT NULL DEFAULT 0,
  fuel_type TEXT NOT NULL DEFAULT 'Petrol',
  transmission TEXT NOT NULL DEFAULT 'Manual',
  ownership_mode TEXT NOT NULL DEFAULT 'owned' CHECK (ownership_mode IN ('owned','consignment','broker')),
  acquisition_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  asking_price NUMERIC(14,2) NOT NULL,
  minimum_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('draft','in_transit','inspection','reconditioning','available','reserved','sold','delivered','returned','archived')),
  current_booking_id UUID,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, stock_number),
  UNIQUE (tenant_id, vin)
);

CREATE TABLE IF NOT EXISTS public.vehicle_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vehicle_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('acquisition','reconditioning','transport','registration','other')),
  description TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vehicle_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  from_branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  to_branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  reason TEXT,
  moved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  moved_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address JSONB NOT NULL DEFAULT '{}'::jsonb,
  supplier_type TEXT NOT NULL CHECK (supplier_type IN ('dealer','auction','individual','manufacturer','other')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_approval','approved','rejected','fulfilled','cancelled')),
  vehicle_description JSONB NOT NULL,
  expected_cost NUMERIC(14,2) NOT NULL CHECK (expected_cost >= 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  approved_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, order_number)
);

CREATE TABLE IF NOT EXISTS public.trade_in_appraisals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  vehicle_description JSONB NOT NULL,
  odometer_km INTEGER,
  condition_grade TEXT,
  estimated_value_low NUMERIC(14,2),
  estimated_value_mid NUMERIC(14,2),
  estimated_value_high NUMERIC(14,2),
  offered_price NUMERIC(14,2),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','appraised','accepted','rejected','acquired')),
  deal_id UUID,
  appraised_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  inspection_type TEXT NOT NULL CHECK (inspection_type IN ('pre_purchase','intake','pdi','periodic','trade_in')),
  inspector_user_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  overall_grade TEXT,
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  repair_estimate NUMERIC(14,2) DEFAULT 0,
  photos JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reconditioning_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  inspection_id UUID REFERENCES public.inspections(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  estimated_cost NUMERIC(14,2),
  actual_cost NUMERIC(14,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','cancelled')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. SALES DESK, DEALS & FINANCE (tenant_id UUID ON DELETE CASCADE)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'qualification' CHECK (stage IN ('qualification','needs_analysis','proposal','negotiation','closed_won','closed_lost')),
  expected_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  expected_close_date TIMESTAMPTZ,
  vehicle_preference JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
  quote_number TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','issued','superseded','accepted','rejected','expired')),
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  fees_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  valid_until TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, quote_number)
);

CREATE TABLE IF NOT EXISTS public.quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('vehicle','accessory','service','fee','insurance','warranty')),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(14,2) NOT NULL,
  discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_rate_percent NUMERIC(5,2) NOT NULL DEFAULT 18,
  tax_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(14,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.discount_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE CASCADE,
  deal_id UUID,
  requested_amount NUMERIC(14,2) NOT NULL,
  deal_value NUMERIC(14,2) NOT NULL,
  discount_percent NUMERIC(5,2),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  requested_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  decided_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  decided_at TIMESTAMPTZ,
  decision_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
  booking_id UUID,
  deal_number TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'initiated' CHECK (stage IN ('initiated','documents','finance','pdi','ready','delivered','cancelled')),
  vehicle_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  accessories_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  fees_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  trade_in_credit NUMERIC(14,2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(14,2) NOT NULL DEFAULT 0,
  balance_due NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  finance_type TEXT DEFAULT 'cash' CHECK (finance_type IN ('cash','loan','lease')),
  lender_name TEXT,
  loan_amount NUMERIC(14,2),
  loan_status TEXT,
  cancellation_reason TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, deal_number)
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
  booking_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('draft','pending_payment','confirmed','cancel_requested','cancelled','completed')),
  booking_amount_required NUMERIC(14,2) NOT NULL,
  amount_paid NUMERIC(14,2) NOT NULL DEFAULT 0,
  idempotency_key TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, booking_number)
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  invoice_id UUID,
  payment_number TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('cash','upi','card','bank_transfer','cheque')),
  status TEXT NOT NULL DEFAULT 'settled' CHECK (status IN ('pending','authorized','settled','failed','partially_refunded','refunded','reversed')),
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  reference_number TEXT,
  notes TEXT,
  recorded_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  settled_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, payment_number)
);

CREATE TABLE IF NOT EXISTS public.payment_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('booking','invoice','deal')),
  target_id UUID NOT NULL,
  allocated_amount NUMERIC(14,2) NOT NULL CHECK (allocated_amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('draft','issued','paid','partially_paid','cancelled')),
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  balance_due NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval','approved','rejected','executed','failed')),
  approved_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  provider_reference TEXT,
  created_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('vehicle_cost','operations','marketing','salary','utility','rent','insurance','other')),
  description TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  receipt_document_id UUID,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending','approved','rejected','paid')),
  approved_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  incurred_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. DOCUMENTS, DELIVERIES & COMPLIANCE (tenant_id UUID ON DELETE CASCADE)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT,
  mime_type TEXT,
  storage_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded','under_review','verified','rejected','expired')),
  expiry_date DATE,
  verified_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending_clearance' CHECK (status IN ('pending_clearance','pdi_in_progress','pdi_passed','pdi_failed','ready_for_handover','delivered','cancelled')),
  payment_gate_passed BOOLEAN NOT NULL DEFAULT false,
  document_gate_passed BOOLEAN NOT NULL DEFAULT false,
  pdi_gate_passed BOOLEAN NOT NULL DEFAULT false,
  finance_gate_passed BOOLEAN NOT NULL DEFAULT false,
  handover_date TIMESTAMPTZ,
  acknowledgement_method TEXT,
  acknowledgement_reference TEXT,
  delivered_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pdi_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  overall_result TEXT NOT NULL CHECK (overall_result IN ('pass','fail','conditional')),
  repair_items JSONB DEFAULT '[]'::jsonb,
  inspector_user_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.registration_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  registration_type TEXT NOT NULL CHECK (registration_type IN ('temporary','permanent','transfer')),
  status TEXT NOT NULL DEFAULT 'pending',
  rto_office TEXT,
  application_number TEXT,
  registration_number TEXT,
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.insurance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  policy_number TEXT,
  policy_type TEXT NOT NULL CHECK (policy_type IN ('comprehensive','third_party','standalone')),
  premium_amount NUMERIC(14,2),
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 6. AFTER-SALES SERVICE & WORKSHOP (tenant_id UUID ON DELETE CASCADE)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.service_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL CHECK (service_type IN ('scheduled_service','repair','warranty','recall','inspection','other')),
  preferred_date DATE NOT NULL,
  preferred_time_slot TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','confirmed','in_progress','completed','cancelled','no_show')),
  customer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.job_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  service_appointment_id UUID REFERENCES public.service_appointments(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  job_card_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','waiting_parts','completed','invoiced','cancelled')),
  intake_odometer INTEGER,
  intake_fuel_level TEXT,
  customer_complaints TEXT,
  technician_user_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  estimated_completion TIMESTAMPTZ,
  labour_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  parts_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, job_card_number)
);

CREATE TABLE IF NOT EXISTS public.labour_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  job_card_id UUID NOT NULL REFERENCES public.job_cards(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  rate_per_hour NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed'))
);

CREATE TABLE IF NOT EXISTS public.parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  part_number TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  unit_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  selling_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, part_number)
);

CREATE TABLE IF NOT EXISTS public.part_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  job_card_id UUID NOT NULL REFERENCES public.job_cards(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES public.parts(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(14,2) NOT NULL,
  total NUMERIC(14,2) NOT NULL,
  is_warranty BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('quality','service','documentation','billing','other')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','resolved','closed','escalated')),
  assigned_to UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  resolution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 7. MARKETING & AUDIT (tenant_id UUID ON DELETE CASCADE)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('email','sms','whatsapp','social','mixed')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','active','paused','completed','cancelled')),
  target_audience JSONB NOT NULL DEFAULT '{}'::jsonb,
  content_template JSONB NOT NULL DEFAULT '{}'::jsonb,
  scheduled_at TIMESTAMPTZ,
  budget NUMERIC(14,2),
  sent_count INTEGER NOT NULL DEFAULT 0,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  response_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  referrer_customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  referred_customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  referred_lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created','contacted','converted','rewarded','expired')),
  reward_amount NUMERIC(14,2),
  reward_paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, referral_code)
);

CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  actor_user_id UUID,
  actor_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  changes JSONB NOT NULL DEFAULT '{}'::jsonb,
  client_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 8. UNCONDITIONAL COLUMN GUARANTEE & EXISTING DATA BACKFILL
-- ============================================================================

ALTER TABLE public.app_users        ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.memberships      ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.company_profiles ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.user_credentials ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.employees        ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.tenants          ADD COLUMN IF NOT EXISTS owner_uid    UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill auth_user_id from auth.users by email if not populated
UPDATE public.app_users apu
SET auth_user_id = au.id
FROM auth.users au
WHERE lower(apu.email) = lower(au.email)
  AND apu.auth_user_id IS NULL;

UPDATE public.memberships m
SET auth_user_id = apu.auth_user_id
FROM public.app_users apu
WHERE m.user_id::text = apu.id::text
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

-- ============================================================================
-- 9. BIDIRECTIONAL CASCADE TRIGGER
--    Deleting a row in company_profiles automatically triggers deletion of the
--    parent tenant row, which in turn cascades to all 45+ tables in the database!
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cascade_delete_company_tenant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.tenant_id IS NOT NULL THEN
    DELETE FROM public.tenants WHERE id::text = OLD.tenant_id::text;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_cascade_delete_company_tenant ON public.company_profiles;
CREATE TRIGGER trg_cascade_delete_company_tenant
  AFTER DELETE ON public.company_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.cascade_delete_company_tenant();

-- ============================================================================
-- 10. PERFORMANCE & UNIQUE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_app_users_auth_user_id        ON public.app_users (auth_user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_auth_user_id      ON public.memberships (auth_user_id);
CREATE INDEX IF NOT EXISTS idx_company_profiles_auth_uid     ON public.company_profiles (auth_user_id);
CREATE INDEX IF NOT EXISTS idx_user_credentials_auth_uid     ON public.user_credentials (auth_user_id);
CREATE INDEX IF NOT EXISTS idx_employees_auth_user_id        ON public.employees (auth_user_id);
CREATE INDEX IF NOT EXISTS idx_tenants_owner_uid             ON public.tenants (owner_uid);

CREATE INDEX IF NOT EXISTS idx_branches_tenant_id            ON public.branches (tenant_id);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant_id         ON public.memberships (tenant_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_tenant_id    ON public.role_permissions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_company_profiles_tenant_id    ON public.company_profiles (tenant_id);
CREATE INDEX IF NOT EXISTS idx_dealership_modules_tenant_id  ON public.dealership_modules (tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_credentials_tenant_id    ON public.user_credentials (tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_tenant_id           ON public.employees (tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id           ON public.customers (tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_id               ON public.leads (tenant_id);
CREATE INDEX IF NOT EXISTS idx_activities_tenant_id          ON public.activities (tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_id        ON public.appointments (tenant_id);
CREATE INDEX IF NOT EXISTS idx_test_drives_tenant_id         ON public.test_drives (tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_catalog_tenant_id     ON public.vehicle_catalog (tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_id            ON public.vehicles (tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_photos_tenant_id      ON public.vehicle_photos (tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_costs_tenant_id       ON public.vehicle_costs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_locations_tenant_id   ON public.vehicle_locations (tenant_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant_id           ON public.suppliers (tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant_id     ON public.purchase_orders (tenant_id);
CREATE INDEX IF NOT EXISTS idx_trade_in_appraisals_tenant_id ON public.trade_in_appraisals (tenant_id);
CREATE INDEX IF NOT EXISTS idx_inspections_tenant_id         ON public.inspections (tenant_id);
CREATE INDEX IF NOT EXISTS idx_reconditioning_jobs_tenant_id ON public.reconditioning_jobs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_tenant_id       ON public.opportunities (tenant_id);
CREATE INDEX IF NOT EXISTS idx_quotations_tenant_id          ON public.quotations (tenant_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_tenant_id     ON public.quotation_items (tenant_id);
CREATE INDEX IF NOT EXISTS idx_discount_approvals_tenant_id  ON public.discount_approvals (tenant_id);
CREATE INDEX IF NOT EXISTS idx_deals_tenant_id               ON public.deals (tenant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tenant_id            ON public.bookings (tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id            ON public.payments (tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_allocations_tenant_id ON public.payment_allocations (tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id            ON public.invoices (tenant_id);
CREATE INDEX IF NOT EXISTS idx_refunds_tenant_id             ON public.refunds (tenant_id);
CREATE INDEX IF NOT EXISTS idx_expenses_tenant_id            ON public.expenses (tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_tenant_id           ON public.documents (tenant_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_tenant_id          ON public.deliveries (tenant_id);
CREATE INDEX IF NOT EXISTS idx_pdi_records_tenant_id         ON public.pdi_records (tenant_id);
CREATE INDEX IF NOT EXISTS idx_registration_cases_tenant_id  ON public.registration_cases (tenant_id);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_tenant_id  ON public.insurance_policies (tenant_id);
CREATE INDEX IF NOT EXISTS idx_service_appts_tenant_id       ON public.service_appointments (tenant_id);
CREATE INDEX IF NOT EXISTS idx_job_cards_tenant_id           ON public.job_cards (tenant_id);
CREATE INDEX IF NOT EXISTS idx_labour_items_tenant_id        ON public.labour_items (tenant_id);
CREATE INDEX IF NOT EXISTS idx_parts_tenant_id               ON public.parts (tenant_id);
CREATE INDEX IF NOT EXISTS idx_part_usage_tenant_id          ON public.part_usage (tenant_id);
CREATE INDEX IF NOT EXISTS idx_complaints_tenant_id          ON public.complaints (tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_tenant_id           ON public.campaigns (tenant_id);
CREATE INDEX IF NOT EXISTS idx_referrals_tenant_id           ON public.referrals (tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_tenant_id        ON public.audit_events (tenant_id);

-- Partial unique index on memberships (tenant_id, auth_user_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_memberships_tenant_auth_user
  ON public.memberships (tenant_id, auth_user_id)
  WHERE auth_user_id IS NOT NULL;

-- ============================================================================
-- 11. RLS HELPER FUNCTIONS & POLICIES
--     (Adheres strictly to parameter name target_tenant_id to avoid Postgres 42P13)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_tenant_member(target_tenant_id UUID)
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

  -- 1. Check memberships via auth_user_id OR fallback user_id
  SELECT EXISTS(
    SELECT 1 FROM public.memberships m
    WHERE m.tenant_id::text = target_tenant_id::text
      AND (
        m.auth_user_id = v_auth_id
        OR m.user_id::text = v_auth_id::text
      )
      AND m.is_active = TRUE
  ) INTO v_found;
  IF v_found THEN RETURN TRUE; END IF;

  -- 2. Check company_profiles via auth_user_id OR email match
  SELECT EXISTS(
    SELECT 1 FROM public.company_profiles cp
    WHERE cp.tenant_id::text = target_tenant_id::text
      AND (
        cp.auth_user_id = v_auth_id
        OR lower(cp.email) = lower((SELECT email FROM auth.users WHERE id = v_auth_id))
      )
  ) INTO v_found;
  IF v_found THEN RETURN TRUE; END IF;

  -- 3. Check employees
  SELECT EXISTS(
    SELECT 1 FROM public.employees e
    WHERE e.tenant_id::text = target_tenant_id::text
      AND (
        e.auth_user_id = v_auth_id
        OR lower(e.email) = lower((SELECT email FROM auth.users WHERE id = v_auth_id))
      )
      AND e.is_active = TRUE
  ) INTO v_found;

  RETURN v_found;
END;
$$;

-- Overload for TEXT tenant ID compatibility
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

  SELECT EXISTS(
    SELECT 1 FROM public.memberships m
    WHERE m.tenant_id::text = target_tenant_id
      AND (
        m.auth_user_id = v_auth_id
        OR m.user_id::text = v_auth_id::text
      )
      AND m.is_active = TRUE
  ) INTO v_found;
  IF v_found THEN RETURN TRUE; END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.company_profiles cp
    WHERE cp.tenant_id::text = target_tenant_id
      AND (
        cp.auth_user_id = v_auth_id
        OR lower(cp.email) = lower((SELECT email FROM auth.users WHERE id = v_auth_id))
      )
  ) INTO v_found;
  IF v_found THEN RETURN TRUE; END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.employees e
    WHERE e.tenant_id::text = target_tenant_id
      AND (
        e.auth_user_id = v_auth_id
        OR lower(e.email) = lower((SELECT email FROM auth.users WHERE id = v_auth_id))
      )
      AND e.is_active = TRUE
  ) INTO v_found;

  RETURN v_found;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(target_tenant_id UUID)
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

  SELECT m.role_key INTO v_role
  FROM public.memberships m
  WHERE m.tenant_id::text = target_tenant_id::text
    AND (
      m.auth_user_id = v_auth_id
      OR m.user_id::text = v_auth_id::text
    )
    AND m.is_active = TRUE
  LIMIT 1;
  IF v_role IS NOT NULL THEN RETURN v_role; END IF;

  IF EXISTS (
    SELECT 1 FROM public.company_profiles cp
    WHERE cp.tenant_id::text = target_tenant_id::text
      AND (
        cp.auth_user_id = v_auth_id
        OR lower(cp.email) = lower((SELECT email FROM auth.users WHERE id = v_auth_id))
      )
  ) THEN
    RETURN 'tenant_admin';
  END IF;

  SELECT e.role INTO v_role
  FROM public.employees e
  WHERE e.tenant_id::text = target_tenant_id::text
    AND (
      e.auth_user_id = v_auth_id
      OR lower(e.email) = lower((SELECT email FROM auth.users WHERE id = v_auth_id))
    )
    AND e.is_active = TRUE
  LIMIT 1;

  RETURN v_role;
END;
$$;

-- Overload for TEXT tenant ID compatibility
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

  SELECT m.role_key INTO v_role
  FROM public.memberships m
  WHERE m.tenant_id::text = target_tenant_id
    AND (
      m.auth_user_id = v_auth_id
      OR m.user_id::text = v_auth_id::text
    )
    AND m.is_active = TRUE
  LIMIT 1;
  IF v_role IS NOT NULL THEN RETURN v_role; END IF;

  IF EXISTS (
    SELECT 1 FROM public.company_profiles cp
    WHERE cp.tenant_id::text = target_tenant_id
      AND (
        cp.auth_user_id = v_auth_id
        OR lower(cp.email) = lower((SELECT email FROM auth.users WHERE id = v_auth_id))
      )
  ) THEN
    RETURN 'tenant_admin';
  END IF;

  SELECT e.role INTO v_role
  FROM public.employees e
  WHERE e.tenant_id::text = target_tenant_id
    AND (
      e.auth_user_id = v_auth_id
      OR lower(e.email) = lower((SELECT email FROM auth.users WHERE id = v_auth_id))
    )
    AND e.is_active = TRUE
  LIMIT 1;

  RETURN v_role;
END;
$$;

REVOKE ALL ON FUNCTION public.is_tenant_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_tenant_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_tenant_member(UUID) TO service_role;

REVOKE ALL ON FUNCTION public.is_tenant_member(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_tenant_member(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_tenant_member(TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.get_user_role(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO service_role;

REVOKE ALL ON FUNCTION public.get_user_role(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_role(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(TEXT) TO service_role;

-- ============================================================================
-- 12. ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE public.tenants               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealership_modules    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credentials      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_drives           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_catalog       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_photos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_costs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_locations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_in_appraisals   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconditioning_jobs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_approvals    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_allocations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_records           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_cases    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_policies    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_appointments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_cards             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labour_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.part_usage            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events          ENABLE ROW LEVEL SECURITY;

-- Base Tenant Isolation Policies
DROP POLICY IF EXISTS tenant_isolation_policy ON public.tenants;
CREATE POLICY tenant_isolation_policy ON public.tenants
  FOR ALL TO authenticated
  USING (is_tenant_member(id))
  WITH CHECK (is_tenant_member(id));

DROP POLICY IF EXISTS company_profiles_isolation ON public.company_profiles;
CREATE POLICY company_profiles_isolation ON public.company_profiles
  FOR ALL TO authenticated
  USING (is_tenant_member(tenant_id) OR auth_user_id = auth.uid())
  WITH CHECK (is_tenant_member(tenant_id) OR auth_user_id = auth.uid());

-- ============================================================================
-- 13. RETROACTIVE FOREIGN KEY CASCADE REINFORCEMENT
--     Ensures that all tables in public schema with a foreign key column
--     named 'tenant_id' explicitly enforce ON DELETE CASCADE.
-- ============================================================================

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN (
    SELECT
      tc.table_schema,
      tc.table_name,
      tc.constraint_name,
      kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND kcu.column_name = 'tenant_id'
  ) LOOP
    BEGIN
      EXECUTE format(
        'ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I;',
        rec.table_schema, rec.table_name, rec.constraint_name
      );
      EXECUTE format(
        'ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;',
        rec.table_schema, rec.table_name, rec.constraint_name
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Constraint update skipped for %.%: %', rec.table_name, rec.constraint_name, SQLERRM;
    END;
  END LOOP;
END $$;
