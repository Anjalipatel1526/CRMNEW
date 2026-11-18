-- ============================================================================
-- UNAI CRM — ENTERPRISE AUTOMOTIVE DEALERSHIP MANAGEMENT PLATFORM
-- COMPLETE PRODUCTION SUPABASE DATABASE SCHEMA & INITIAL SEED DATA
-- ============================================================================
-- Compatible with Supabase PostgreSQL (Postgres 15+)
-- Run this script in the Supabase Dashboard: SQL Editor -> New Query -> Run
-- ============================================================================

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. CORE TENANCY & MULTI-TENANT ORGANIZATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('provisioning','active','suspended','cancelled')),
  dealer_model TEXT NOT NULL DEFAULT 'mixed' CHECK (dealer_model IN ('new','used','mixed','broker')),
  primary_contact_name TEXT NOT NULL,
  primary_email TEXT NOT NULL,
  primary_phone TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS memberships (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  role_key TEXT NOT NULL,
  branch_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  branch_scope TEXT NOT NULL DEFAULT 'assigned' CHECK (branch_scope IN ('all','assigned')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, user_id)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role_key TEXT NOT NULL,
  permission_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, role_key, permission_key)
);

-- Dealership Company Profile (Filled during onboarding: Legal entity, GSTIN, PAN, Bank, Logo, Signature, Watermark)
CREATE TABLE IF NOT EXISTS company_profiles (
  id TEXT PRIMARY KEY DEFAULT 'company-default-01',
  tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
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

-- Dealership Dynamic Modules (Plugin-in / Plugin-out feature management)
CREATE TABLE IF NOT EXISTS dealership_modules (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  href TEXT NOT NULL,
  icon TEXT NOT NULL,
  is_plugged_in BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Credentials from Onboarding Flow
CREATE TABLE IF NOT EXISTS user_credentials (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dealership Employees Registry
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id TEXT REFERENCES branches(id),
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
-- 2. CRM MODULE (CUSTOMERS, LEADS, ACTIVITIES, APPOINTMENTS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id TEXT REFERENCES branches(id),
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
CREATE INDEX IF NOT EXISTS idx_customers_tenant_phone ON customers(tenant_id, phone);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL REFERENCES branches(id),
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','assigned','contacted','qualified','appointment_set','test_drive','negotiation','converted','lost','nurture')),
  assigned_to TEXT REFERENCES app_users(id),
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
CREATE INDEX IF NOT EXISTS idx_leads_tenant_status ON leads(tenant_id, status);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('customer','lead','vehicle','deal')),
  entity_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('call','email','whatsapp','meeting','note','test_drive','follow_up','task','status_change','system_event')),
  subject TEXT NOT NULL,
  notes TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT REFERENCES app_users(id),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities(tenant_id, entity_type, entity_id);

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL REFERENCES branches(id),
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  lead_id TEXT REFERENCES leads(id),
  vehicle_id TEXT,
  assigned_to TEXT REFERENCES app_users(id),
  appointment_type TEXT NOT NULL CHECK (appointment_type IN ('showroom_visit','test_drive','document_pickup','delivery','service','other')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','confirmed','in_progress','completed','cancelled','no_show')),
  outcome TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test_drives (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  appointment_id TEXT REFERENCES appointments(id) ON DELETE CASCADE,
  vehicle_id TEXT NOT NULL,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
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
-- 3. VEHICLE INVENTORY & CATALOG MODULE
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicle_catalog (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL REFERENCES branches(id),
  catalog_id TEXT REFERENCES vehicle_catalog(id) ON DELETE SET NULL,
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
  current_booking_id TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, stock_number),
  UNIQUE (tenant_id, vin)
);
CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_status ON vehicles(tenant_id, status);

CREATE TABLE IF NOT EXISTS vehicle_photos (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicle_costs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('acquisition','reconditioning','transport','registration','other')),
  description TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicle_locations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  from_branch_id TEXT REFERENCES branches(id),
  to_branch_id TEXT NOT NULL REFERENCES branches(id),
  reason TEXT,
  moved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  moved_by TEXT REFERENCES app_users(id)
);

-- ============================================================================
-- 4. PROCUREMENT & TRADE-IN MODULE
-- ============================================================================

CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address JSONB NOT NULL DEFAULT '{}'::jsonb,
  supplier_type TEXT NOT NULL CHECK (supplier_type IN ('dealer','auction','individual','manufacturer','other')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL REFERENCES branches(id),
  supplier_id TEXT REFERENCES suppliers(id),
  order_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_approval','approved','rejected','fulfilled','cancelled')),
  vehicle_description JSONB NOT NULL,
  expected_cost NUMERIC(14,2) NOT NULL CHECK (expected_cost >= 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  approved_by TEXT REFERENCES app_users(id),
  approved_at TIMESTAMPTZ,
  created_by TEXT REFERENCES app_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, order_number)
);

CREATE TABLE IF NOT EXISTS trade_in_appraisals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vehicle_description JSONB NOT NULL,
  odometer_km INTEGER,
  condition_grade TEXT,
  estimated_value_low NUMERIC(14,2),
  estimated_value_mid NUMERIC(14,2),
  estimated_value_high NUMERIC(14,2),
  offered_price NUMERIC(14,2),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','appraised','accepted','rejected','acquired')),
  deal_id TEXT,
  appraised_by TEXT REFERENCES app_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inspections (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  inspection_type TEXT NOT NULL CHECK (inspection_type IN ('pre_purchase','intake','pdi','periodic','trade_in')),
  inspector_user_id TEXT REFERENCES app_users(id),
  overall_grade TEXT,
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  repair_estimate NUMERIC(14,2) DEFAULT 0,
  photos JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reconditioning_jobs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  inspection_id TEXT REFERENCES inspections(id),
  description TEXT NOT NULL,
  estimated_cost NUMERIC(14,2),
  actual_cost NUMERIC(14,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','cancelled')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. SALES DESK (OPPORTUNITIES, QUOTATIONS, DEALS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS opportunities (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL REFERENCES branches(id),
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  lead_id TEXT REFERENCES leads(id),
  assigned_to TEXT REFERENCES app_users(id),
  title TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'qualification' CHECK (stage IN ('qualification','needs_analysis','proposal','negotiation','closed_won','closed_lost')),
  expected_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  expected_close_date TIMESTAMPTZ,
  vehicle_preference JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL REFERENCES branches(id),
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  opportunity_id TEXT REFERENCES opportunities(id),
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
  created_by TEXT REFERENCES app_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, quote_number)
);

CREATE TABLE IF NOT EXISTS quotation_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  quotation_id TEXT NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('vehicle','accessory','service','fee','insurance','warranty')),
  vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(14,2) NOT NULL,
  discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_rate_percent NUMERIC(5,2) NOT NULL DEFAULT 18,
  tax_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(14,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS discount_approvals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  quotation_id TEXT REFERENCES quotations(id),
  deal_id TEXT,
  requested_amount NUMERIC(14,2) NOT NULL,
  deal_value NUMERIC(14,2) NOT NULL,
  discount_percent NUMERIC(5,2),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  requested_by TEXT REFERENCES app_users(id),
  decided_by TEXT REFERENCES app_users(id),
  decided_at TIMESTAMPTZ,
  decision_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL REFERENCES branches(id),
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
  opportunity_id TEXT REFERENCES opportunities(id) ON DELETE SET NULL,
  quotation_id TEXT REFERENCES quotations(id),
  booking_id TEXT,
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
  created_by TEXT REFERENCES app_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, deal_number)
);

-- ============================================================================
-- 6. FINANCE, BOOKINGS & PAYMENTS MODULE
-- ============================================================================

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL REFERENCES branches(id),
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  quotation_id TEXT REFERENCES quotations(id),
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

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL REFERENCES branches(id),
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  booking_id TEXT REFERENCES bookings(id),
  deal_id TEXT REFERENCES deals(id),
  invoice_id TEXT,
  payment_number TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('cash','upi','card','bank_transfer','cheque')),
  status TEXT NOT NULL DEFAULT 'settled' CHECK (status IN ('pending','authorized','settled','failed','partially_refunded','refunded','reversed')),
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  reference_number TEXT,
  notes TEXT,
  recorded_by TEXT REFERENCES app_users(id),
  settled_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, payment_number)
);

CREATE TABLE IF NOT EXISTS payment_allocations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  payment_id TEXT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('booking','invoice','deal')),
  target_id TEXT NOT NULL,
  allocated_amount NUMERIC(14,2) NOT NULL CHECK (allocated_amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL REFERENCES branches(id),
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  deal_id TEXT REFERENCES deals(id),
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

CREATE TABLE IF NOT EXISTS refunds (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  payment_id TEXT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  booking_id TEXT REFERENCES bookings(id),
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval','approved','rejected','executed','failed')),
  approved_by TEXT REFERENCES app_users(id),
  approved_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  provider_reference TEXT,
  created_by TEXT REFERENCES app_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL REFERENCES branches(id),
  category TEXT NOT NULL CHECK (category IN ('vehicle_cost','operations','marketing','salary','utility','rent','insurance','other')),
  description TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
  receipt_document_id TEXT,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending','approved','rejected','paid')),
  approved_by TEXT REFERENCES app_users(id),
  incurred_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by TEXT REFERENCES app_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 7. DOCUMENTS & DELIVERY MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT,
  mime_type TEXT,
  storage_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded','under_review','verified','rejected','expired')),
  expiry_date DATE,
  verified_by TEXT REFERENCES app_users(id),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT REFERENCES app_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(tenant_id, entity_type, entity_id);

CREATE TABLE IF NOT EXISTS deliveries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  deal_id TEXT NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending_clearance' CHECK (status IN ('pending_clearance','pdi_in_progress','pdi_passed','pdi_failed','ready_for_handover','delivered','cancelled')),
  payment_gate_passed BOOLEAN NOT NULL DEFAULT false,
  document_gate_passed BOOLEAN NOT NULL DEFAULT false,
  pdi_gate_passed BOOLEAN NOT NULL DEFAULT false,
  finance_gate_passed BOOLEAN NOT NULL DEFAULT false,
  handover_date TIMESTAMPTZ,
  acknowledgement_method TEXT,
  acknowledgement_reference TEXT,
  delivered_by TEXT REFERENCES app_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pdi_records (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  delivery_id TEXT NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  overall_result TEXT NOT NULL CHECK (overall_result IN ('pass','fail','conditional')),
  repair_items JSONB DEFAULT '[]'::jsonb,
  inspector_user_id TEXT REFERENCES app_users(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS registration_cases (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  delivery_id TEXT NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS insurance_policies (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
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
-- 8. AFTER-SALES SERVICE & WORKSHOP MODULE
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_appointments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL REFERENCES branches(id),
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL CHECK (service_type IN ('scheduled_service','repair','warranty','recall','inspection','other')),
  preferred_date DATE NOT NULL,
  preferred_time_slot TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','confirmed','in_progress','completed','cancelled','no_show')),
  customer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_cards (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL REFERENCES branches(id),
  service_appointment_id TEXT REFERENCES service_appointments(id),
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  job_card_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','waiting_parts','completed','invoiced','cancelled')),
  intake_odometer INTEGER,
  intake_fuel_level TEXT,
  customer_complaints TEXT,
  technician_user_id TEXT REFERENCES app_users(id),
  estimated_completion TIMESTAMPTZ,
  labour_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  parts_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, job_card_number)
);

CREATE TABLE IF NOT EXISTS labour_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_card_id TEXT NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  rate_per_hour NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed'))
);

CREATE TABLE IF NOT EXISTS parts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS part_usage (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_card_id TEXT NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  part_id TEXT NOT NULL REFERENCES parts(id),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(14,2) NOT NULL,
  total NUMERIC(14,2) NOT NULL,
  is_warranty BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS complaints (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
  deal_id TEXT REFERENCES deals(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('quality','service','documentation','billing','other')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','resolved','closed','escalated')),
  assigned_to TEXT REFERENCES app_users(id),
  resolution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 9. MARKETING & AUDIT
-- ============================================================================

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
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
  created_by TEXT REFERENCES app_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  referrer_customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  referred_customer_id TEXT REFERENCES customers(id),
  referred_lead_id TEXT REFERENCES leads(id),
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created','contacted','converted','rewarded','expired')),
  reward_amount NUMERIC(14,2),
  reward_paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, referral_code)
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL,
  actor_user_id TEXT,
  actor_email TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  before_data JSONB,
  after_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_tenant_resource ON audit_events(tenant_id, resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_app_users_lower_email ON app_users(lower(email));
CREATE INDEX IF NOT EXISTS idx_employees_lower_email ON employees(lower(email));
CREATE INDEX IF NOT EXISTS idx_memberships_user_tenant ON memberships(user_id, tenant_id);

-- ============================================================================
-- 10. SUPABASE ROW LEVEL SECURITY (RLS) POLICIES & MULTI-TENANT ISOLATION
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 10.1 AUTHORIZATION HELPER FUNCTIONS
-- ----------------------------------------------------------------------------

-- Returns authenticated user ID from Supabase auth context
CREATE OR REPLACE FUNCTION public.auth_uid()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(auth.uid()::text, '');
$$;

REVOKE ALL ON FUNCTION public.auth_uid() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auth_uid() TO authenticated, service_role;

-- Checks if calling user has an active membership in the given tenant
CREATE OR REPLACE FUNCTION public.is_tenant_member(p_tenant_id TEXT)
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
  
  -- Direct membership lookup
  SELECT EXISTS(
    SELECT 1 FROM public.memberships m
    WHERE m.tenant_id = p_tenant_id
      AND m.user_id = v_auth_id::text
      AND m.is_active = TRUE
  ) INTO v_found;
  
  IF v_found THEN RETURN TRUE; END IF;
  
  -- Membership via app_users email bridge
  SELECT EXISTS(
    SELECT 1 
    FROM auth.users au
    JOIN public.app_users apu ON lower(apu.email) = lower(au.email)
    JOIN public.memberships m ON m.user_id = apu.id AND m.tenant_id = p_tenant_id AND m.is_active = TRUE
    WHERE au.id = v_auth_id
  ) INTO v_found;
  
  IF v_found THEN RETURN TRUE; END IF;
  
  -- Employee record with matching active email
  SELECT EXISTS(
    SELECT 1
    FROM auth.users au
    JOIN public.employees e ON lower(e.email) = lower(au.email)
    WHERE au.id = v_auth_id
      AND e.tenant_id = p_tenant_id
      AND e.is_active = TRUE
  ) INTO v_found;
  
  RETURN v_found;
END;
$$;

REVOKE ALL ON FUNCTION public.is_tenant_member(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_tenant_member(TEXT) TO authenticated, service_role;

-- Resolves user's effective role for a tenant
CREATE OR REPLACE FUNCTION public.get_user_role(p_tenant_id TEXT)
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
  WHERE m.tenant_id = p_tenant_id
    AND m.user_id = v_auth_id::text
    AND m.is_active = TRUE
  LIMIT 1;
  
  IF v_role IS NOT NULL THEN RETURN v_role; END IF;
  
  SELECT m.role_key INTO v_role
  FROM auth.users au
  JOIN public.app_users apu ON lower(apu.email) = lower(au.email)
  JOIN public.memberships m ON m.user_id = apu.id AND m.tenant_id = p_tenant_id AND m.is_active = TRUE
  WHERE au.id = v_auth_id
  LIMIT 1;
  
  IF v_role IS NOT NULL THEN RETURN v_role; END IF;
  
  SELECT e.role INTO v_role
  FROM auth.users au
  JOIN public.employees e ON lower(e.email) = lower(au.email)
  WHERE au.id = v_auth_id
    AND e.tenant_id = p_tenant_id
    AND e.is_active = TRUE
  LIMIT 1;
  
  RETURN v_role;
END;
$$;

REVOKE ALL ON FUNCTION public.get_user_role(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_role(TEXT) TO authenticated, service_role;

-- Checks if user has admin/management role in the tenant
CREATE OR REPLACE FUNCTION public.is_tenant_admin(p_tenant_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role(p_tenant_id) IN ('tenant_admin', 'branch_manager');
$$;

REVOKE ALL ON FUNCTION public.is_tenant_admin(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_tenant_admin(TEXT) TO authenticated, service_role;

-- Returns array of all tenant IDs caller belongs to
CREATE OR REPLACE FUNCTION public.user_tenant_ids()
RETURNS TEXT[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_id UUID;
  v_tids    TEXT[];
BEGIN
  v_auth_id := auth.uid();
  IF v_auth_id IS NULL THEN
    RETURN ARRAY[]::TEXT[];
  END IF;

  SELECT array_agg(DISTINCT tenant_id) INTO v_tids
  FROM (
    SELECT m.tenant_id FROM public.memberships m
    WHERE m.user_id = v_auth_id::text AND m.is_active = TRUE
    UNION
    SELECT m.tenant_id
    FROM auth.users au
    JOIN public.app_users apu ON lower(apu.email) = lower(au.email)
    JOIN public.memberships m ON m.user_id = apu.id AND m.is_active = TRUE
    WHERE au.id = v_auth_id
    UNION
    SELECT e.tenant_id
    FROM auth.users au
    JOIN public.employees e ON lower(e.email) = lower(au.email) AND e.is_active = TRUE
    WHERE au.id = v_auth_id
  ) sub;

  RETURN COALESCE(v_tids, ARRAY[]::TEXT[]);
END;
$$;

REVOKE ALL ON FUNCTION public.user_tenant_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_tenant_ids() TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 10.2 ENABLE ROW LEVEL SECURITY ON ALL DATABASE TABLES
-- ----------------------------------------------------------------------------

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealership_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_in_appraisals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconditioning_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labour_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.part_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 10.3 TENANT-SCOPED AUTHORIZATION POLICIES
-- ----------------------------------------------------------------------------

-- Tenants: visible only to active members, modifiable only by admins
CREATE POLICY "tenant_select" ON public.tenants
  FOR SELECT TO authenticated
  USING (id = ANY(public.user_tenant_ids()));

CREATE POLICY "tenant_update" ON public.tenants
  FOR UPDATE TO authenticated
  USING (public.is_tenant_admin(id))
  WITH CHECK (public.is_tenant_admin(id));

-- Branches: scoped to user's tenant
CREATE POLICY "branch_select" ON public.branches
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "branch_insert" ON public.branches
  FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_admin(tenant_id));

CREATE POLICY "branch_update" ON public.branches
  FOR UPDATE TO authenticated
  USING (public.is_tenant_admin(tenant_id))
  WITH CHECK (public.is_tenant_admin(tenant_id));

CREATE POLICY "branch_delete" ON public.branches
  FOR DELETE TO authenticated
  USING (public.is_tenant_admin(tenant_id));

-- App Users: self-access and dealership colleague lookups
CREATE POLICY "app_users_select" ON public.app_users
  FOR SELECT TO authenticated
  USING (
    id = public.auth_uid()
    OR EXISTS (
      SELECT 1 FROM public.memberships m1
      JOIN public.memberships m2 ON m1.tenant_id = m2.tenant_id
      WHERE m1.user_id = public.auth_uid() AND m1.is_active = TRUE
        AND m2.user_id = app_users.id AND m2.is_active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM auth.users au
      JOIN public.app_users apu ON lower(apu.email) = lower(au.email)
      WHERE au.id = auth.uid() AND apu.id = app_users.id
    )
  );

CREATE POLICY "app_users_update" ON public.app_users
  FOR UPDATE TO authenticated
  USING (
    id = public.auth_uid()
    OR EXISTS (
      SELECT 1 FROM auth.users au
      JOIN public.app_users apu ON lower(apu.email) = lower(au.email)
      WHERE au.id = auth.uid() AND apu.id = app_users.id
    )
  )
  WITH CHECK (
    id = public.auth_uid()
    OR EXISTS (
      SELECT 1 FROM auth.users au
      JOIN public.app_users apu ON lower(apu.email) = lower(au.email)
      WHERE au.id = auth.uid() AND apu.id = app_users.id
    )
  );

-- Memberships: tenant-scoped, management controlled
CREATE POLICY "memberships_select" ON public.memberships
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "memberships_insert" ON public.memberships
  FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_admin(tenant_id));

CREATE POLICY "memberships_update" ON public.memberships
  FOR UPDATE TO authenticated
  USING (public.is_tenant_admin(tenant_id))
  WITH CHECK (public.is_tenant_admin(tenant_id) AND user_id <> public.auth_uid());

CREATE POLICY "memberships_delete" ON public.memberships
  FOR DELETE TO authenticated
  USING (public.is_tenant_admin(tenant_id) AND user_id <> public.auth_uid());

-- Role Permissions: tenant-scoped
CREATE POLICY "role_permissions_select" ON public.role_permissions
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "role_permissions_all" ON public.role_permissions
  FOR ALL TO authenticated
  USING (public.is_tenant_admin(tenant_id))
  WITH CHECK (public.is_tenant_admin(tenant_id));

-- Company Profiles: tenant-scoped
CREATE POLICY "company_profiles_select" ON public.company_profiles
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "company_profiles_all" ON public.company_profiles
  FOR ALL TO authenticated
  USING (public.is_tenant_admin(tenant_id))
  WITH CHECK (public.is_tenant_admin(tenant_id));

-- Dealership Modules: tenant-scoped
CREATE POLICY "modules_select" ON public.dealership_modules
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "modules_modify" ON public.dealership_modules
  FOR ALL TO authenticated
  USING (public.is_tenant_admin(tenant_id))
  WITH CHECK (public.is_tenant_admin(tenant_id));

-- User Credentials: strictly restricted to tenant administrators
CREATE POLICY "user_creds_all" ON public.user_credentials
  FOR ALL TO authenticated
  USING (public.is_tenant_admin(tenant_id))
  WITH CHECK (public.is_tenant_admin(tenant_id));

-- Employees: visible to tenant members, modified by admin
CREATE POLICY "employees_select" ON public.employees
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "employees_modify" ON public.employees
  FOR ALL TO authenticated
  USING (public.is_tenant_admin(tenant_id))
  WITH CHECK (public.is_tenant_admin(tenant_id));

-- Customers: tenant-scoped
CREATE POLICY "customers_select" ON public.customers
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "customers_insert" ON public.customers
  FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY "customers_update" ON public.customers
  FOR UPDATE TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY "customers_delete" ON public.customers
  FOR DELETE TO authenticated
  USING (public.is_tenant_admin(tenant_id));

-- Leads: tenant-scoped
CREATE POLICY "leads_select" ON public.leads
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "leads_insert" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY "leads_update" ON public.leads
  FOR UPDATE TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY "leads_delete" ON public.leads
  FOR DELETE TO authenticated
  USING (public.is_tenant_admin(tenant_id));

-- Activities: tenant-scoped
CREATE POLICY "activities_select" ON public.activities
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "activities_insert" ON public.activities
  FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY "activities_update" ON public.activities
  FOR UPDATE TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

-- Appointments: tenant-scoped
CREATE POLICY "appointments_select" ON public.appointments
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "appointments_insert" ON public.appointments
  FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY "appointments_update" ON public.appointments
  FOR UPDATE TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

-- Test Drives: tenant-scoped
CREATE POLICY "test_drives_select" ON public.test_drives
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "test_drives_insert" ON public.test_drives
  FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY "test_drives_update" ON public.test_drives
  FOR UPDATE TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

-- Vehicle Catalog: tenant-scoped
CREATE POLICY "vehicle_catalog_select" ON public.vehicle_catalog
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "vehicle_catalog_modify" ON public.vehicle_catalog
  FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

-- Vehicles: tenant-scoped
CREATE POLICY "vehicles_select" ON public.vehicles
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "vehicles_insert" ON public.vehicles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY "vehicles_update" ON public.vehicles
  FOR UPDATE TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY "vehicles_delete" ON public.vehicles
  FOR DELETE TO authenticated
  USING (public.is_tenant_admin(tenant_id));

-- Vehicle Photos: tenant-scoped
CREATE POLICY "vehicle_photos_select" ON public.vehicle_photos
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "vehicle_photos_modify" ON public.vehicle_photos
  FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

-- Vehicle Costs: tenant-scoped
CREATE POLICY "vehicle_costs_select" ON public.vehicle_costs
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "vehicle_costs_modify" ON public.vehicle_costs
  FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

-- Vehicle Locations: tenant-scoped
CREATE POLICY "vehicle_locations_select" ON public.vehicle_locations
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "vehicle_locations_insert" ON public.vehicle_locations
  FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id));

-- Suppliers: tenant-scoped
CREATE POLICY "suppliers_select" ON public.suppliers
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "suppliers_modify" ON public.suppliers
  FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

-- Purchase Orders: tenant-scoped
CREATE POLICY "purchase_orders_select" ON public.purchase_orders
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "purchase_orders_modify" ON public.purchase_orders
  FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

-- Trade-in Appraisals: tenant-scoped
CREATE POLICY "trade_in_select" ON public.trade_in_appraisals
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "trade_in_modify" ON public.trade_in_appraisals
  FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

-- Inspections: tenant-scoped
CREATE POLICY "inspections_select" ON public.inspections
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "inspections_modify" ON public.inspections
  FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

-- Reconditioning Jobs: tenant-scoped
CREATE POLICY "recon_select" ON public.reconditioning_jobs
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "recon_modify" ON public.reconditioning_jobs
  FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

-- Opportunities: tenant-scoped
CREATE POLICY "opportunities_select" ON public.opportunities
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "opportunities_modify" ON public.opportunities
  FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

-- Quotations & Items: tenant-scoped
CREATE POLICY "quotations_select" ON public.quotations
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "quotations_modify" ON public.quotations
  FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY "quotation_items_select" ON public.quotation_items
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "quotation_items_modify" ON public.quotation_items
  FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

-- Discount Approvals: tenant-scoped
CREATE POLICY "discounts_select" ON public.discount_approvals
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "discounts_insert" ON public.discount_approvals
  FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY "discounts_update" ON public.discount_approvals
  FOR UPDATE TO authenticated
  USING (public.is_tenant_admin(tenant_id))
  WITH CHECK (public.is_tenant_admin(tenant_id));

-- Deals: tenant-scoped
CREATE POLICY "deals_select" ON public.deals
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "deals_insert" ON public.deals
  FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY "deals_update" ON public.deals
  FOR UPDATE TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY "deals_delete" ON public.deals
  FOR DELETE TO authenticated
  USING (public.is_tenant_admin(tenant_id));

-- Bookings: tenant-scoped
CREATE POLICY "bookings_select" ON public.bookings
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "bookings_modify" ON public.bookings
  FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

-- Payments: tenant-scoped, critical financial records
CREATE POLICY "payments_select" ON public.payments
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "payments_insert" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY "payments_update" ON public.payments
  FOR UPDATE TO authenticated
  USING (public.is_tenant_admin(tenant_id))
  WITH CHECK (public.is_tenant_admin(tenant_id));

CREATE POLICY "payments_delete" ON public.payments
  FOR DELETE TO authenticated
  USING (public.is_tenant_admin(tenant_id));

-- Payment Allocations: tenant-scoped
CREATE POLICY "pay_alloc_select" ON public.payment_allocations
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "pay_alloc_modify" ON public.payment_allocations
  FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

-- Invoices: tenant-scoped
CREATE POLICY "invoices_select" ON public.invoices
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "invoices_modify" ON public.invoices
  FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

-- Refunds: tenant-scoped, management approved
CREATE POLICY "refunds_select" ON public.refunds
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "refunds_insert" ON public.refunds
  FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY "refunds_update" ON public.refunds
  FOR UPDATE TO authenticated
  USING (public.is_tenant_admin(tenant_id))
  WITH CHECK (public.is_tenant_admin(tenant_id));

-- Expenses: tenant-scoped
CREATE POLICY "expenses_select" ON public.expenses
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "expenses_modify" ON public.expenses
  FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

-- Documents: tenant-scoped KYC and agreements
CREATE POLICY "documents_select" ON public.documents
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "documents_insert" ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY "documents_update" ON public.documents
  FOR UPDATE TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY "documents_delete" ON public.documents
  FOR DELETE TO authenticated
  USING (public.is_tenant_admin(tenant_id));

-- Deliveries, PDI, Registration, Insurance: tenant-scoped
CREATE POLICY "deliveries_select" ON public.deliveries
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "deliveries_modify" ON public.deliveries
  FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY "pdi_select" ON public.pdi_records
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "pdi_modify" ON public.pdi_records
  FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY "reg_cases_select" ON public.registration_cases
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "reg_cases_modify" ON public.registration_cases
  FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY "insurance_select" ON public.insurance_policies
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "insurance_modify" ON public.insurance_policies
  FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

-- Service Workshop: tenant-scoped
CREATE POLICY "service_appts_select" ON public.service_appointments
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "service_appts_modify" ON public.service_appointments
  FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY "job_cards_select" ON public.job_cards
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "job_cards_modify" ON public.job_cards
  FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY "labour_select" ON public.labour_items
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "labour_modify" ON public.labour_items
  FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY "parts_select" ON public.parts
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "parts_modify" ON public.parts
  FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY "part_usage_select" ON public.part_usage
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "part_usage_modify" ON public.part_usage
  FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

-- Complaints, Campaigns, Referrals: tenant-scoped
CREATE POLICY "complaints_select" ON public.complaints
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "complaints_modify" ON public.complaints
  FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY "campaigns_select" ON public.campaigns
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "campaigns_modify" ON public.campaigns
  FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY "referrals_select" ON public.referrals
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "referrals_modify" ON public.referrals
  FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

-- Audit Events: immutable append-only log
CREATE POLICY "audit_select" ON public.audit_events
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "audit_insert" ON public.audit_events
  FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id));

-- ============================================================================
-- 11. SUPABASE STORAGE BUCKETS CONFIGURATION (PRIVATE BY DEFAULT)
-- ============================================================================

-- Provision storage buckets with strict privacy flags and size/mime constraints
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
  ('dealership-logos', 'dealership-logos', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']),
  ('vehicle-photos', 'vehicle-photos', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 11.1 dealership-logos: Public read, authenticated upload
CREATE POLICY "logos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'dealership-logos');

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

-- 11.2 vehicle-photos: Public read, authenticated tenant staff upload
CREATE POLICY "photos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'vehicle-photos');

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

-- 11.3 dealership-documents: Strictly authenticated tenant-isolated access (private KYC/contracts)
CREATE POLICY "docs_tenant_read" ON storage.objects
  FOR SELECT TO authenticated 
  USING (
    bucket_id = 'dealership-documents'
    AND (
      (storage.foldername(name))[1] = ANY(public.user_tenant_ids())
      OR public.has_role_on_tenant((storage.foldername(name))[1], 'tenant_admin')
    )
  );

CREATE POLICY "docs_tenant_upload" ON storage.objects
  FOR INSERT TO authenticated 
  WITH CHECK (
    bucket_id = 'dealership-documents'
    AND (storage.foldername(name))[1] = ANY(public.user_tenant_ids())
  );

CREATE POLICY "docs_tenant_update" ON storage.objects
  FOR UPDATE TO authenticated 
  USING (
    bucket_id = 'dealership-documents'
    AND (storage.foldername(name))[1] = ANY(public.user_tenant_ids())
  );

CREATE POLICY "docs_tenant_delete" ON storage.objects
  FOR DELETE TO authenticated 
  USING (
    bucket_id = 'dealership-documents'
    AND (
      public.has_role_on_tenant((storage.foldername(name))[1], 'tenant_admin')
      OR public.has_role_on_tenant((storage.foldername(name))[1], 'branch_manager')
    )
  );

-- 11.4 signatures: Strictly authenticated tenant-isolated access (private digital signatures)
CREATE POLICY "sigs_tenant_read" ON storage.objects
  FOR SELECT TO authenticated 
  USING (
    bucket_id = 'signatures'
    AND (
      (storage.foldername(name))[1] = ANY(public.user_tenant_ids())
      OR public.has_role_on_tenant((storage.foldername(name))[1], 'tenant_admin')
    )
  );

CREATE POLICY "sigs_tenant_upload" ON storage.objects
  FOR INSERT TO authenticated 
  WITH CHECK (
    bucket_id = 'signatures'
    AND (storage.foldername(name))[1] = ANY(public.user_tenant_ids())
  );

CREATE POLICY "sigs_tenant_update" ON storage.objects
  FOR UPDATE TO authenticated 
  USING (
    bucket_id = 'signatures'
    AND (storage.foldername(name))[1] = ANY(public.user_tenant_ids())
  );

CREATE POLICY "sigs_tenant_delete" ON storage.objects
  FOR DELETE TO authenticated 
  USING (
    bucket_id = 'signatures'
    AND public.has_role_on_tenant((storage.foldername(name))[1], 'tenant_admin')
  );

-- ============================================================================
-- 12. INITIAL PRODUCTION SEED DATA
-- ============================================================================

-- Seed Default Tenant
INSERT INTO tenants (id, name, slug, status, dealer_model, primary_contact_name, primary_email, primary_phone, currency, timezone)
VALUES (
  't-apex-001',
  'Apex Luxury Motors',
  'apex-luxury-motors',
  'active',
  'mixed',
  'Vikram Singhania',
  'admin@apexmotors.com',
  '+91 98765 43210',
  'INR',
  'Asia/Kolkata'
) ON CONFLICT (id) DO NOTHING;

-- Seed Default Primary Branch
INSERT INTO branches (id, tenant_id, code, name, timezone, is_active)
VALUES (
  'b-dt-001',
  't-apex-001',
  'DT-01',
  'Apex Downtown Flagship',
  'Asia/Kolkata',
  true
) ON CONFLICT (id) DO NOTHING;

-- Seed Default Admin User
INSERT INTO app_users (id, email, full_name, phone, is_active)
VALUES 
  ('usr-admin-01', 'admin@apexmotors.com', 'Vikram Singhania', '+91 98765 43210', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO memberships (id, tenant_id, user_id, role_key, branch_ids, branch_scope, is_active)
VALUES 
  ('m-01', 't-apex-001', 'usr-admin-01', 'tenant_admin', '["b-dt-001","b-wb-002"]'::jsonb, 'all', true)
ON CONFLICT (id) DO NOTHING;

-- Seed Default Company Profile
INSERT INTO company_profiles (
  id, tenant_id, legal_name, trade_name, dealership_type, email, phone,
  address, city, state, pincode, country, gstin, pan, currency,
  bank_name, account_number, ifsc_code, branch_name,
  watermark_enabled, watermark_opacity, authorized_signatory_name, authorized_signatory_designation,
  is_onboarded
) VALUES (
  'company-default-01',
  't-apex-001',
  'Dealership Solutions Pvt Ltd',
  'Dealership',
  'authorized_franchise',
  'contact@dealership.com',
  '+91 98765 43210',
  'Plot 42, Automotive Corridor',
  'New Delhi',
  'Delhi',
  '110001',
  'India',
  '07AAAAA0000A1Z5',
  'AAAAA0000A',
  'INR (₹)',
  'HDFC Bank Ltd',
  '50200012345678',
  'HDFC0000123',
  'Connaught Place Corporate Branch',
  true,
  0.08,
  'Administrator',
  'Managing Director',
  true
) ON CONFLICT (id) DO NOTHING;

-- Seed Dealership Modules
INSERT INTO dealership_modules (id, tenant_id, label, href, icon, is_plugged_in, description, order_index)
VALUES 
  ('mod-crm', 't-apex-001', 'CRM & Leads', '/crm/leads', 'Users', true, 'Full customer lifecycle, lead funnel & automated assignment', 1),
  ('mod-inventory', 't-apex-001', 'Vehicle Inventory', '/vehicles', 'Car', true, 'Live stockyard tracking, aging alarms & variant matrix', 2),
  ('mod-sales', 't-apex-001', 'Sales Desk', '/sales', 'Briefcase', true, 'Quotations, pricing calculator & deal approval gates', 3),
  ('mod-finance', 't-apex-001', 'Finance & Desk', '/finance', 'Receipt', true, 'Token bookings, customer receipts & ledger allocations', 4),
  ('mod-documents', 't-apex-001', 'Documents', '/documents', 'FileText', true, 'KYC vault, Form 20/21 & digital agreement vault', 5),
  ('mod-aftersales', 't-apex-001', 'Service & Workshop', '/service', 'Wrench', true, 'Workshop intake, digital job cards & technician bays', 6),
  ('mod-delivery', 't-apex-001', 'Delivery Gates', '/delivery', 'Truck', true, '4-gate clearance (Payment, Doc, PDI, Finance)', 7),
  ('mod-marketing', 't-apex-001', 'Marketing & AI', '/marketing', 'Sparkles', true, 'WhatsApp campaigns & smart inventory recommendations', 8),
  ('mod-reports', 't-apex-001', 'Reports & Analytics', '/reports', 'BarChart3', true, 'Revenue velocity, yard margin audits & performance', 9),
  ('mod-settings', 't-apex-001', 'Platform Settings', '/settings', 'Settings', true, 'Dealership profile, branch nodes & security credentials', 10)
ON CONFLICT (id) DO NOTHING;

-- Enable Realtime publication so deleting in Supabase Table Editor instantly updates the frontend
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE employees, documents, test_drives;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN OTHERS THEN NULL;
END $$;
