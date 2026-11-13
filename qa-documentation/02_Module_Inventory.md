# 02 — Module Inventory

**Repository:** `/home/admin-system/Documents/CRMNEW`  
**Audit Date:** 2026-11-10

---

## 1. Frontend Page Modules (`apps/web/src/app`)

All 23 implemented Next.js page routes + 1 broken seeded route, inspected via source review, `next build`, and read-only HTTP `GET` checks:

| Module ID | Route | Source File | Production Build (`First Load JS`) | Persistence Mechanism | Implementation Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **MOD-01** | `/` | `apps/web/src/app/page.tsx` | `103 kB` (`○`) | Static landing page | Implemented (Landing/Welcome) |
| **MOD-02** | `/login` | `apps/web/src/app/login/page.tsx` | `178 kB` (`○`) | `localStorage` (`crm_active_user_session_v1`, `crm_user_credentials`) | **Critical Defect**: Fallback accepts any user + >=4-char password as `tenant_admin` |
| **MOD-03** | `/emplogin` | `apps/web/src/app/emplogin/page.tsx` | `180 kB` (`○`) | `employee-store` (`crm_employees_v2` + `/api/employees`) | **Critical Defect**: `handleQuickFill` exposes staff passwords on unauthenticated screen |
| **MOD-04** | `/empportal` | `apps/web/src/app/empportal/page.tsx` | `182 kB` (`○`) | `employee-store`, `api-client`, `test-drive-store` | Implemented (`localStorage`-dependent for leaves & access control) |
| **MOD-05** | `/onboarding` | `apps/web/src/app/onboarding/page.tsx` | `180 kB` (`○`) | `company-store`, `modules-registry` + Supabase `user_credentials` | Implemented (writes plaintext password to DB `password_hash`) |
| **MOD-06** | `/dashboard` | `apps/web/src/app/dashboard/page.tsx` | `183 kB` (`○`) | `api-client`, `company-store` | Implemented (uses mixed live/local mock data) |
| **MOD-07** | `/crm/leads` | `apps/web/src/app/crm/leads/page.tsx` | `170 kB` (`○`) | `api-client` (`localStorage` + Supabase `leads`) | **Defect**: Imports `validateLeadTransition` but never invokes it |
| **MOD-08** | `/crm/customers` | `apps/web/src/app/crm/customers/page.tsx` | `171 kB` (`○`) | `api-client` + `test-drive-store` | Implemented |
| **MOD-09** | `/crm/appointments` | `apps/web/src/app/crm/appointments/page.tsx` | `166 kB` (`○`) | `api-client` | **Partial Stub**: Completion button uses `alert(...)` only |
| **MOD-10** | `/vehicles` | `apps/web/src/app/vehicles/page.tsx` | `171 kB` (`○`) | `api-client` | Implemented (images uploaded as base64 in store) |
| **MOD-11** | `/vehicles/procurement` | `apps/web/src/app/vehicles/procurement/page.tsx` | `93.7 kB` (`○`) | Static UI / modal state | **Stub**: Purchase Order & Trade-In submits show `alert(...)` only |
| **MOD-12** | `/sales` *(Seeded link)* | *(Missing `page.tsx`)* | N/A | Seeded in `supabase_schema.sql:1062` | **Defect**: Returns HTTP `404` |
| **MOD-13** | `/sales/deals` | `apps/web/src/app/sales/deals/page.tsx` | `166 kB` (`○`) | `api-client` + hardcoded modal checklist | **Partial Stub**: Gate 1–5 statuses hardcoded; handover authorize uses `alert(...)` |
| **MOD-14** | `/sales/quotations` | `apps/web/src/app/sales/quotations/page.tsx` | `165 kB` (`○`) | `api-client` + `@crm/business-rules` `PricingEngine` | **Defect**: Double-counts `'fee'` items via `PricingEngine.calculateQuotationTotals`; hardcodes `'sales_executive'` role in UI discount check |
| **MOD-15** | `/finance` | `apps/web/src/app/finance/page.tsx` | `180 kB` (`○`) | `api-client` + React `useState` | **Defect**: `handleSaveInvoice` loses invoices/payments on reload; typo `"Product Deskription"` |
| **MOD-16** | `/documents` | `apps/web/src/app/documents/page.tsx` | `164 kB` (`○`) | `document-store` -> `/api/documents` + Realtime | Implemented (stores base64 data URLs inside JSONB metadata) |
| **MOD-17** | `/documents/new` | `apps/web/src/app/documents/new/page.tsx` | `172 kB` (`○`) | `InvoiceDocumentGenerator` | Redirect/wrapper (`onSave` navigates to `/finance` without DB write) |
| **MOD-18** | `/test-drives` | `apps/web/src/app/test-drives/page.tsx` | `160 kB` (`○`) | `test-drive-store` -> Supabase `test_drives` | **Defect**: Inserts hardcoded tenant/vehicle/customer FKs; omits customer/vehicle/DL/status fields |
| **MOD-19** | `/service` | `apps/web/src/app/service/page.tsx` | `165 kB` (`○`) | `api-client` (read/initial) + stub modals | **Partial Stub**: Open job card & "Complete & Bill" call `alert(...)` |
| **MOD-20** | `/marketing` | `apps/web/src/app/marketing/page.tsx` | `164 kB` (`○`) | `api-client` (read) + stub modal | **Stub**: Campaign launch triggers `alert(...)` |
| **MOD-21** | `/reports` | `apps/web/src/app/reports/page.tsx` | `174 kB` (`○`) | `api-client`, `employee-store`, CSV/PDF/Print export | **Defect**: Filters non-existent `Deal.status` & `Lead.status` yielding `₹0` / `0%` metrics |
| **MOD-22** | `/ai` | `apps/web/src/app/ai/page.tsx` | `165 kB` (`○`) | `api-client` leads | **Stub**: AI Follow-Up "Send via WhatsApp" triggers `alert(...)` |
| **MOD-23** | `/employees` | `apps/web/src/app/employees/page.tsx` | `187 kB` (`○`) | `employee-store` -> `/api/employees` + `localStorage` | **Partial Sync**: Passwords, `employeeCode`, salary, leaves, `accessControl` only saved locally |
| **MOD-24** | `/settings` | `apps/web/src/app/settings/page.tsx` | `186 kB` (`○`) | `company-store`, `modules-registry`, `employee-store`, `test-drive-store` | Implemented (large multi-tab management hub) |

---

## 2. Backend & API Endpoints Inventory

### 2.1 Active Next.js App Router Endpoints (`apps/web/src/app/api`)
- `GET / POST / PATCH / DELETE` **`/api/documents`** (`apps/web/src/app/api/documents/route.ts`) — Service-role (`supabaseAdmin`) CRUD on `documents`; unauthenticated; auto-provisions tenant `'t-apex-001'`.
- `GET / POST / DELETE` **`/api/employees`** (`apps/web/src/app/api/employees/route.ts`) — Service-role (`supabaseAdmin`) CRUD on `employees`; unauthenticated; falls back to null foreign keys if FK fails.

### 2.2 Express API Endpoints (`apps/api/src/main.ts` — Disconnected from UI)
- `GET /health`
- `POST /api/v1/auth/login` *(ignores password; Postgres path throws HTTP 500 `column "role" does not exist`)*
- `GET /api/v1/branches`
- `GET / POST /api/v1/customers` *(POST Postgres path throws HTTP 500 `column "customer_type" does not exist`)*
- `GET / POST /api/v1/leads` *(GET Postgres path throws HTTP 500 `column l.assigned_to_id does not exist`)*
- `PATCH /api/v1/leads/:id/stage` *(Supabase branch skips `validateLeadTransition`)*
- `GET / POST /api/v1/vehicles`
- `GET / POST /api/v1/employees` *(non-Supabase POST echoes body without DB insert)*
- `GET / POST /api/v1/company-profile` *(non-Supabase POST echoes body without DB insert)*
- `GET / POST /api/v1/deals` *(non-Supabase POST echoes body without DB insert)*
- `POST /api/v1/quotations/calculate` *(active HTTP calculation using buggy `PricingEngine.calculateQuotationTotals`)*
- `GET /api/v1/finance/payments`, `GET /api/v1/finance/invoices` *(Postgres only; ignores `supabase`)*
- `GET /api/v1/service/job-cards`, `GET /api/v1/service/parts` *(Postgres only; ignores `supabase`)*

---

## 3. Shared Layout, UI Components & Store Modules

- **Layout & Navigation**: `apps/web/src/components/layout/Shell.tsx` (Top nav bar, dynamic plugged-in module pills from `modules-registry.ts`, static `DEFAULT_NOTIFICATIONS`, profile avatar/edit modal, mobile Quick Access grid, mobile Back bar, partial staff redirect guard).
- **Reusable UI Components** (`apps/web/src/components/ui/` & `components/invoices/`):
  - `DataTable.tsx`: Client-side substring search & 10-row pagination; **no column sorting**, **no server pagination**.
  - `Modal.tsx`, `StatusBadge.tsx`, `StatCard.tsx`, `CalendarPicker.tsx`, `WordFadeIn.tsx`, `InvoiceDocumentGenerator.tsx`.
- **Client Data Stores** (`apps/web/src/lib/`):
  - `auth-context.tsx`, `api-client.ts`, `employee-store.ts`, `company-store.ts`, `document-store.ts`, `test-drive-store.ts`, `modules-registry.ts`, `location-data.ts`, `theme-palettes.ts`, `supabase.ts`.

