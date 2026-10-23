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
  catalog_id TEXT REFERENCES vehicle_catalog(id),
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
  vehicle_id TEXT REFERENCES vehicles(id),
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
  vehicle_id TEXT REFERENCES vehicles(id),
  opportunity_id TEXT REFERENCES opportunities(id),
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
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
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
  vehicle_id TEXT REFERENCES vehicles(id),
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
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
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
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
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
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
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
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
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
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
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
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
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
  vehicle_id TEXT REFERENCES vehicles(id),
  deal_id TEXT REFERENCES deals(id),
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

-- ============================================================================
-- 10. SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on core tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealership_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Allow full access for anon & authenticated roles during setup/demo
CREATE POLICY "Public Read Access" ON company_profiles FOR SELECT USING (true);
CREATE POLICY "Public Insert/Update Access" ON company_profiles FOR ALL USING (true);

CREATE POLICY "Dealership Modules Public" ON dealership_modules FOR ALL USING (true);
CREATE POLICY "Tenants Access Policy" ON tenants FOR ALL USING (true);
CREATE POLICY "Branches Access Policy" ON branches FOR ALL USING (true);
CREATE POLICY "App Users Access Policy" ON app_users FOR ALL USING (true);
CREATE POLICY "Customers Access Policy" ON customers FOR ALL USING (true);
CREATE POLICY "Leads Access Policy" ON leads FOR ALL USING (true);
CREATE POLICY "Vehicles Access Policy" ON vehicles FOR ALL USING (true);
CREATE POLICY "Deals Access Policy" ON deals FOR ALL USING (true);
CREATE POLICY "Quotations Access Policy" ON quotations FOR ALL USING (true);
CREATE POLICY "Bookings Access Policy" ON bookings FOR ALL USING (true);
CREATE POLICY "Payments Access Policy" ON payments FOR ALL USING (true);
CREATE POLICY "Invoices Access Policy" ON invoices FOR ALL USING (true);
CREATE POLICY "Job Cards Access Policy" ON job_cards FOR ALL USING (true);
CREATE POLICY "Documents Access Policy" ON documents FOR ALL USING (true);
CREATE POLICY "Employees Access Policy" ON employees FOR ALL USING (true);

-- ============================================================================
-- 11. SUPABASE STORAGE BUCKETS CONFIGURATION
-- ============================================================================

-- Insert storage buckets if not present
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('dealership-logos', 'dealership-logos', true),
  ('vehicle-photos', 'vehicle-photos', true),
  ('dealership-documents', 'dealership-documents', true),
  ('signatures', 'signatures', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access for storage objects
CREATE POLICY "Public Storage Read" ON storage.objects FOR SELECT USING (true);
CREATE POLICY "Public Storage Upload" ON storage.objects FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Storage Update" ON storage.objects FOR UPDATE USING (true);

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

-- Seed Default Branches
INSERT INTO branches (id, tenant_id, code, name, address, phone, email, is_active)
VALUES 
  ('b-dt-001', 't-apex-001', 'DEL-01', 'Downtown Flagship', '{"city": "New Delhi", "state": "Delhi", "pincode": "110001", "line1": "Connaught Place"}'::jsonb, '+91 11 2345 6789', 'downtown@apexmotors.com', true),
  ('b-wb-002', 't-apex-001', 'MUM-02', 'Westbay Hub', '{"city": "Mumbai", "state": "Maharashtra", "pincode": "400050", "line1": "Bandra West"}'::jsonb, '+91 22 8765 4321', 'westbay@apexmotors.com', true)
ON CONFLICT (id) DO NOTHING;

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
  'Apex Automotive Solutions Pvt Ltd',
  'Apex Motors',
  'authorized_franchise',
  'contact@apexmotors.com',
  '+91 98765 43210',
  'Plot 42, Automotive Corridor, Sector 18',
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
  'Vikram Singhania',
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

-- Seed Master Vehicle Catalog
INSERT INTO vehicle_catalog (id, tenant_id, make, model, variant, model_year, body_type, fuel_type, transmission, specs)
VALUES
  ('cat-01', 't-apex-001', 'Porsche', '911 Carrera S', '3.0 Twin-Turbo', 2024, 'Coupe', 'Petrol', 'Automatic', '{"power_bhp": 443, "top_speed_kmh": 308}'::jsonb),
  ('cat-02', 't-apex-001', 'BMW', 'M3 Competition', 'xDrive Sedan', 2024, 'Sedan', 'Petrol', 'Automatic', '{"power_bhp": 503, "top_speed_kmh": 290}'::jsonb),
  ('cat-03', 't-apex-001', 'Mercedes-Benz', 'E-Class', 'E 350d Exclusive', 2023, 'Sedan', 'Diesel', 'Automatic', '{"power_bhp": 286, "torque_nm": 600}'::jsonb),
  ('cat-04', 't-apex-001', 'Tata', 'Nexon EV', 'Empowered Plus LR', 2024, 'SUV', 'Electric', 'Automatic', '{"battery_kwh": 40.5, "range_km": 465}'::jsonb),
  ('cat-05', 't-apex-001', 'Mahindra', 'Thar', 'LX 4x4 Hard Top', 2024, 'SUV', 'Diesel', 'Manual', '{"power_bhp": 130, "drive": "4WD"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Seed Vehicles Inventory
INSERT INTO vehicles (
  id, tenant_id, branch_id, catalog_id, stock_number, vin, registration_number,
  make, model, variant, year, color, mileage_km, fuel_type, transmission,
  ownership_mode, acquisition_cost, total_cost, asking_price, minimum_price, status
) VALUES 
  ('v-001', 't-apex-001', 'b-dt-001', 'cat-01', 'STK-2026-001', 'WP0AB2A98NS240001', 'DL-01-AB-1234', 'Porsche', '911 Carrera S', '3.0L Twin-Turbo', 2024, 'Guards Red', 3200, 'Petrol', 'Automatic', 'owned', 14200000, 14450000, 17800000, 17200000, 'available'),
  ('v-002', 't-apex-001', 'b-dt-001', 'cat-02', 'STK-2026-002', 'WBA33AY08NFP56789', 'DL-03-XY-9999', 'BMW', 'M3 Competition', 'xDrive Sedan', 2024, 'Isle of Man Green', 6400, 'Petrol', 'Automatic', 'owned', 11500000, 11720000, 13800000, 13400000, 'reserved'),
  ('v-003', 't-apex-001', 'b-wb-002', 'cat-03', 'STK-2026-003', 'WDD2130042A891234', 'MH-02-EE-4545', 'Mercedes-Benz', 'E-Class', 'E 350d Exclusive', 2023, 'Obsidian Black', 18500, 'Diesel', 'Automatic', 'owned', 6400000, 6580000, 7850000, 7500000, 'available'),
  ('v-004', 't-apex-001', 'b-dt-001', 'cat-04', 'STK-2026-004', 'MAT625012PLA78901', 'DL-08-EV-1001', 'Tata', 'Nexon EV', 'Empowered Plus LR', 2024, 'Pristine White', 1200, 'Electric', 'Automatic', 'owned', 1650000, 1690000, 1980000, 1920000, 'available'),
  ('v-005', 't-apex-001', 'b-wb-002', 'cat-05', 'STK-2026-005', 'MA1TA2WKLN2P34567', 'MH-04-TR-7007', 'Mahindra', 'Thar', 'LX 4x4 Hard Top', 2024, 'Napoli Black', 4500, 'Diesel', 'Manual', 'owned', 1450000, 1490000, 1740000, 1680000, 'sold')
ON CONFLICT (id) DO NOTHING;

-- Seed CRM Customers
INSERT INTO customers (id, tenant_id, branch_id, type, first_name, last_name, email, phone, company_name, gstin, city, state)
VALUES 
  ('cust-101', 't-apex-001', 'b-dt-001', 'individual', 'Aarav', 'Mehta', 'aarav.mehta@gmail.com', '+91 98111 22334', NULL, NULL, 'New Delhi', 'Delhi'),
  ('cust-102', 't-apex-001', 'b-wb-002', 'business', 'Pooja', 'Deshmukh', 'pooja@zenithventures.in', '+91 98222 33445', 'Zenith Ventures LLP', '27AAHFZ1234P1Z8', 'Mumbai', 'Maharashtra'),
  ('cust-103', 't-apex-001', 'b-dt-001', 'individual', 'Rajesh', 'Kapoor', 'rajesh.kapoor@outlook.com', '+91 98333 44556', NULL, NULL, 'Gurugram', 'Haryana')
ON CONFLICT (id) DO NOTHING;

-- Seed CRM Leads
INSERT INTO leads (id, tenant_id, branch_id, customer_id, source, status, budget_min, budget_max, preferred_make, preferred_model, score, timeline)
VALUES
  ('lead-201', 't-apex-001', 'b-dt-001', 'cust-101', 'Showroom Walk-in', 'negotiation', 15000000, 18000000, 'Porsche', '911 Carrera S', 92, 'Within 7 days'),
  ('lead-202', 't-apex-001', 'b-wb-002', 'cust-102', 'Digital Referral', 'test_drive', 12000000, 14500000, 'BMW', 'M3 Competition', 85, 'Within 15 days'),
  ('lead-203', 't-apex-001', 'b-dt-001', 'cust-103', 'Website Inquiry', 'qualified', 6000000, 8000000, 'Mercedes-Benz', 'E-Class', 74, 'Within 30 days')
ON CONFLICT (id) DO NOTHING;

-- Seed Active Deal
INSERT INTO deals (
  id, tenant_id, branch_id, customer_id, vehicle_id, deal_number, stage,
  vehicle_price, accessories_total, discount_total, tax_total, fees_total, trade_in_credit,
  grand_total, amount_paid, balance_due, currency, finance_type
) VALUES (
  'deal-301',
  't-apex-001',
  'b-dt-001',
  'cust-101',
  'v-001',
  'DEAL-2026-089',
  'delivered',
  17500000,
  350000,
  250000,
  3150000,
  150000,
  0,
  20900000,
  20900000,
  0,
  'INR',
  'cash'
) ON CONFLICT (id) DO NOTHING;
