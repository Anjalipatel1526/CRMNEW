# 01 — Application Architecture Analysis

**Project:** Enterprise Automotive Dealership CRM (`UNAI CRM`)  
**Repository Root:** `/home/admin-system/Documents/CRMNEW`  
**Audit Date:** 2026-11-10  
**Audit Mode:** Strictly Read-Only Static Code & Schema Audit + Non-Destructive Local Verification

---

## 1. High-Level Architecture Overview

The repository is structured as an **npm workspaces monorepo** (`packages/*`, `apps/*` in [package.json](../package.json)):

| Layer | Path | Technology / Runtime | Role in Architecture |
| :--- | :--- | :--- | :--- |
| **Frontend & BFF** | `apps/web` | Next.js `14.2.35`, React `^18.3.1`, TypeScript | UI application (23 Client Component pages) + 2 App Router API routes (`/api/documents`, `/api/employees`) |
| **Express API** | `apps/api` | Express, TypeScript (`tsx`), `@electric-sql/pglite`, `pg`, `@supabase/supabase-js` | Intended REST API on port `4000` (`/api/v1/*`) — **currently bypassed by `apps/web`** |
| **Shared Types** | `packages/shared-types` | TypeScript interfaces & unions | Core domain entities, enums, `UserRole`, `PaginatedResult<T>` |
| **Business Rules** | `packages/business-rules` | Pure TypeScript classes & helpers | Lead/Vehicle/Booking/Payment/Deal state machines & `PricingEngine` |
| **Validators** | `packages/validators` | Zod `^3.23.8` | 16+ Zod request schemas — **currently unused anywhere in `apps/`** |
| **Database / BaaS** | `supabase_schema.sql` & `apps/api/src/database/schema.sql` | PostgreSQL / Supabase + PGlite | Dual schemas with significant drift (`49` tables in root SQL vs `46` in API SQL) |

### Architectural Disconnect Diagram

```text
[Browser Client (apps/web pages - 'use client')]
   │
   ├──► localStorage (crm_active_user_session_v1, crm_store_clean_v2,
   │                  crm_employees_v2, crm_compliance_documents_v1, crm_test_drives_v2, etc.)
   │
   ├──► Direct Browser Supabase Client (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   │      ├── company_profiles, user_credentials (writes plaintext password!), dealership_modules
   │      └── customers, leads, vehicles, test_drives (hardcodes tenant/vehicle/customer IDs)
   │
   ├──► Next.js App Router BFF (/api/documents, /api/employees)
   │      └── Uses supabaseAdmin (SUPABASE_SERVICE_ROLE_KEY || fallback anon key) WITHOUT auth checks
   │
   └──X NextConfig Rewrite (/api/v1/* -> http://localhost:4000/api/v1/*)  [CONFIGURED, NEVER CALLED BY UI]
          │
          └──► apps/api/src/main.ts (Express API)
                 ├── Uses supabase (SUPABASE_ANON_KEY) OR local PGlite / PostgreSQL (db.ts)
                 └── Crashes on several Postgres/PGlite queries due to schema column mismatches
```

---

## 2. Frontend Architecture & Dependencies (`apps/web`)

- **Dependencies** (`apps/web/package.json`): `next ^14.2.35`, `react ^18.3.1`, `react-dom ^18.3.1`, `@supabase/supabase-js ^2.118.0`, `clsx`, `lucide-react`, plus workspace packages `@crm/shared-types`, `@crm/validators`, `@crm/business-rules`.
- **No Testing or Linting Tooling Configured in Web**:
  - `npm run lint --workspace=apps/web` fails/blocks on interactive ESLint initialization (`? How would you like to configure ESLint?`) because no `.eslintrc*` or `eslint.config*` exists.
  - Zero frontend unit, integration, or Playwright/Cypress tests exist.
- **No Next.js Server Middleware**: No `apps/web/src/middleware.ts` exists. Every page in Next.js production build compiled as a static shell (`○` prerendered HTML `29.1 KB – 58.1 KB`) returning HTTP `200` regardless of authentication state.
- **Monolithic Client Architecture**:
  - All 23 page components use `'use client'`. Several exceed 1,500–3,500 lines (`settings/page.tsx`: 3,551 lines; `onboarding/page.tsx`: 2,964 lines; `employees/page.tsx`: 2,822 lines; `vehicles/page.tsx`: 1,811 lines; `crm/leads/page.tsx`: 1,522 lines).
  - Global CSS (`apps/web/src/styles/globals.css`) is `4,504` lines loaded alongside inline critical CSS in `apps/web/src/app/layout.tsx`, plus external `<link>` requests to Google Fonts (`Urbanist`).

---

## 3. Backend & Persistence Architecture

### 3.1 Next.js API Routes (Active BFF)
1. `apps/web/src/app/api/documents/route.ts`: Implements `GET`, `POST`, `PATCH`, `DELETE` directly using `supabaseAdmin`. Resolves or auto-creates default tenant `'t-apex-001'`. Stores base64 `fileDataUrl` inside JSONB `metadata`. Zero session/JWT checks.
2. `apps/web/src/app/api/employees/route.ts`: Implements `GET`, `POST`, `DELETE` using `supabaseAdmin` with default `'t-apex-001'` / `'b-dt-001'`, falling back to `null` FK values if tenant/branch FK constraints fail. Omits `employeeCode`, `salary`, `password`, `isAdmin`, `accessControl`, and `leaveHistory` because the DB table lacks those columns. Zero session/JWT checks.

### 3.2 Supabase Client Factory (`apps/web/src/lib/supabase.ts`)
- Exports browser `supabase` using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Exports `supabaseAdmin` using `SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE || supabaseAnonKey` — meaning if service role key env vars are missing, `supabaseAdmin` silently degrades to the anon key.

### 3.3 Express API (`apps/api/src/main.ts` — Unused by UI)
- Port `4000` (`app.use(cors())`, `app.use(express.json())`).
- Dual backend resolution inside route handlers:
  - When `SUPABASE_URL` & `SUPABASE_ANON_KEY` are set, queries/inserts via anon `supabase` client, often hardcoding `tenant_id: 't-apex-001'`, `branch_id: 'b-dt-001'`, and `role: 'tenant_admin'`.
  - When `supabase` is null, falls back to `apps/api/src/database/db.ts` (`DATABASE_URL` Postgres pool or persistent PGlite `.data/pg`).
- **Measured PGlite Compatibility Defects** (executed during QA):
  - `POST /api/v1/auth/login` crashes (`500`): `column "role" does not exist` on `app_users`.
  - `GET /api/v1/leads` crashes (`500`): `column l.assigned_to_id does not exist`.
  - `POST /api/v1/customers` crashes (`500`): `column "customer_type" of relation "customers" does not exist`.
  - `POST /api/v1/deals`, `POST /api/v1/employees`, `POST /api/v1/company-profile` without Supabase simply echo `req.body` as HTTP `200`/`201` without inserting into Postgres/PGlite.

---

## 4. Database Schema, RLS Policies, Triggers, Storage & Realtime

### 4.1 Schema Drift
- `supabase_schema.sql`: **49 tables**, includes `company_profiles`, `dealership_modules`, `user_credentials`, `employees`.
- `apps/api/src/database/schema.sql`: **46 tables**, omits those 4 dealership/auth/employee tables and differs in column definitions referenced by `main.ts`.
- **Database Functions & Triggers**: **0** `CREATE FUNCTION` and **0** `CREATE TRIGGER` statements in `supabase_schema.sql`. All `updated_at` timestamps, audit logs (`audit_events`), and workflow transitions rely entirely on application-layer code.

### 4.2 Row-Level Security (RLS) Audit (`supabase_schema.sql`)
- **Tables with RLS Enabled (`21 / 49`)**:
  `tenants`, `branches`, `app_users`, `company_profiles`, `dealership_modules`, `employees`, `customers`, `leads`, `vehicles`, `deals`, `quotations`, `bookings`, `payments`, `invoices`, `job_cards`, `documents`, `test_drives`, `appointments`, `user_credentials`, `activities`, `vehicle_catalog`.
- **Tables with NO RLS (`28 / 49`)**:
  `memberships`, `role_permissions`, `vehicle_photos`, `vehicle_costs`, `vehicle_locations`, `suppliers`, `purchase_orders`, `trade_in_appraisals`, `inspections`, `reconditioning_jobs`, `opportunities`, `quotation_items`, `discount_approvals`, `payment_allocations`, `refunds`, `expenses`, `deliveries`, `pdi_records`, `registration_cases`, `insurance_policies`, `service_appointments`, `labour_items`, `parts`, `part_usage`, `complaints`, `campaigns`, `referrals`, `audit_events`.
- **Policy Strength**: All `22` table `CREATE POLICY` rules across those 21 tables use **`USING (true)`** (and `WITH CHECK (true)` on documents/employees), granting unrestricted read/write access to any client with `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### 4.3 Storage Buckets & Realtime
- **Buckets**: `dealership-logos`, `vehicle-photos`, `dealership-documents`, `signatures` — all configured `public: true` with permissive `storage.objects` `SELECT` (`USING (true)`), `INSERT` (`WITH CHECK (true)`), and `UPDATE` (`USING (true)`) policies.
- **Realtime**: Subscribed in UI stores for `employees`, `documents`, and `test_drives`.

---

## 5. Authentication, Authorization & External Integrations

- **Authentication State**: Client-only `localStorage` (`crm_active_user_session_v1`) managed by `AuthProvider` (`apps/web/src/lib/auth-context.tsx`). Supabase Auth (`supabase.auth.signInWithPassword`, JWT verification, RLS `auth.uid()`) is **not integrated**.
- **Password Storage**: Stored in plaintext in `Employee.password` (`localStorage`), `company-store.ts` `crm_user_credentials`, and written in plaintext into Supabase `user_credentials.password_hash`.
- **External Integrations**:
  - **Indian Pincode Directory / Location Data** (`apps/web/src/lib/location-data.ts`) — offline lookup array + helper functions.
  - **WhatsApp / SMS / Email Gateways** — **not integrated**; UI buttons in `/marketing` and `/ai` trigger browser `alert(...)` popups only.
  - **Fonts CDN** — `fonts.googleapis.com` / `fonts.gstatic.com` `<link>` tags in `apps/web/src/app/layout.tsx` (blocked offline during `next build` font optimization warning).
- **Environment Variable Names Identified (values never read/printed)**:
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE`, `SUPABASE_SERVICE_ROLE_KEY`.

