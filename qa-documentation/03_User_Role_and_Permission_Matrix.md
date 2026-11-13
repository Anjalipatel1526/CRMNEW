# 03 — User Role and Permission Matrix

**Sources Inspected:**
- `packages/shared-types/src/index.ts` (`UserRole`, lines 27–36)
- `packages/business-rules/src/index.ts` (`PricingEngine.validateDiscount`, lines 164–186)
- `apps/web/src/lib/auth-context.tsx` (`UserSession`, `switchRole`, `loginUser`)
- `apps/web/src/lib/employee-store.ts` (`EmployeeAccessControl`, lines 15–26)
- `apps/web/src/components/layout/Shell.tsx` (Navigation filtering & redirect guard, lines 336–460)
- `apps/web/src/app/api/*`, `apps/api/src/main.ts`, `supabase_schema.sql`

---

## 1. System Roles vs Implemented Enforcement Matrix

| Role Key (`UserRole`) | Max Auto-Approved Discount (`PricingEngine.validateDiscount`) | Intended Functional Scope | Actual Frontend Enforcement (`Shell.tsx` / Pages) | Actual Backend & DB RLS Enforcement |
| :--- | :--- | :--- | :--- | :--- |
| **`platform_admin`** | `100.0%` | Global multi-tenant administration | Same UI access as `tenant_admin`; switchable cleanly client-side via `switchRole()` | **None** (`USING (true)` RLS; Express & Next.js BFF lack JWT checks) |
| **`tenant_admin`** | `100.0%` | Full dealership control, onboarding, employees, settings, finance | Full navigation; `/login` fallback grants this role to **any user + >=4 char password** | **None** (any anon client shares full DB access) |
| **`branch_manager`** | `7.5%` | Branch operations, discount approvals up to 7.5%, team oversight | Only differentiated if mapped via non-admin staff `EmployeeAccessControl`; Quotations UI hardcodes `'sales_executive'` | **None** (API does not verify branch ownership) |
| **`sales_executive`** | `2.0%` | Leads, customers, test drives, quotations (<=2% discount), deals | Only constrained if `employeeId && !isAdmin`; allowed direct URL navigation to `/finance`, `/reports`, `/documents`, `/deals` | **None** (`PATCH /api/v1/leads/:id/stage` & Supabase allow any client mutation) |
| **`finance_manager`** | **`0%` (Bug: unmapped in `thresholds`)** | Payments, invoices, refunds, deal finance gate, reports | **Bug**: `PricingEngine.validateDiscount` omits `finance_manager`, returning `maxAllowedPercent: 0` | **None** (`/api/v1/finance/*` and Supabase `payments`/`invoices` open to anonymous callers) |
| **`inventory_manager`** | **`0%` (Unmapped)** | Vehicle catalog, stockyard inventory, procurement, inspections | No role-based UI lock if logged via `/login`; relies solely on `EmployeeAccessControl` nav hiding | **None** |
| **`service_advisor`** | **`0%` (Unmapped)** | Service appointments, job cards, complaints | Same as above; `/service` creation/billing buttons are UI stubs | **None** |
| **`technician`** | **`0%` (Unmapped)** | Workshop job cards, PDI inspection items | Same as above | **None** |
| **`receptionist`** | **`0%` (Unmapped)** | Front-desk intake, appointments, customer directory | Same as above | **None** |
| **Unauthenticated Visitor** | N/A | Only `/`, `/login`, `/emplogin` | **Critical Failure**: `Shell.tsx` never checks `!activeSession`; unauthenticated HTTP `GET` returns `200` on all 23 routes | **Critical Failure**: Anon key grants full SELECT/INSERT/UPDATE/DELETE across 49 tables & 4 public buckets |

---

## 2. Staff Fine-Grained Toggle Matrix (`EmployeeAccessControl`)

Staff logins via `/emplogin` carry per-employee boolean flags unless `emp.isAdmin === true`:

| Flag (`EmployeeAccessControl`) | Target Route(s) | Hidden From Nav Bar When `false` (`Shell.tsx`)? | Blocked When Typing URL Directly in Browser? | Blocked on API / Supabase? |
| :--- | :--- | :--- | :--- | :--- |
| `pipeline` | `/crm/leads` | Yes | **NO** — page loads fully | **NO** |
| `customers` | `/crm/customers` | Yes | **NO** — page loads fully | **NO** |
| `testDrives` | `/test-drives` | Yes | **NO** — page loads fully | **NO** |
| `inventory` | `/vehicles` | Yes | **NO** — page loads fully | **NO** |
| `procurement` | `/vehicles/procurement` | Yes | **NO** — page loads fully | **NO** |
| `deals` | `/sales/deals`, `/sales/quotations` | Yes | **NO** — page loads fully | **NO** |
| `finance` | `/finance` | Yes | **NO** — page loads fully | **NO** |
| `documents` | `/documents`, `/documents/new` | Yes | **NO** — page loads fully | **NO** — `/api/documents` is open |
| `reports` | `/reports` | Yes | **NO** — page loads fully | **NO** |
| `settings` | `/settings` | Yes | **Partial**: Redirects to `/empportal` if `isStaffEmployee` is true | **NO** |
| *(Admin-only)* | `/employees`, `/dashboard`, `/onboarding` | Yes (`!isStaffEmployee`) | **Partial**: Redirects to `/empportal` ONLY if `crm_active_user_session_v1` sets `employeeId && !isAdmin` (bypassable by clearing `localStorage`) | **NO** — `/api/employees` is open |

---

## 3. Summary of Role & Permission Gaps

1. **Privilege Escalation via `localStorage` & `switchRole()`**: Editing `crm_active_user_session_v1` in DevTools (changing `role` to `'tenant_admin'`, setting `isAdmin: true`, or removing `employeeId`) bypasses every UI guard immediately.
2. **Incomplete Route Protection in `Shell.tsx` (lines 354–366)**: Only 4 routes (`/employees`, `/settings`, `/dashboard`, `/onboarding`) trigger client-side `router.replace('/empportal')`, leaving `/finance`, `/reports`, `/documents`, `/vehicles/procurement`, and `/sales/*` exposed to unauthorized staff roles.
3. **Unmapped Roles in Discount Engine**: `PricingEngine.validateDiscount` only maps `sales_executive (2%)`, `branch_manager (7.5%)`, `tenant_admin (100%)`, and `platform_admin (100%)`, causing `finance_manager` and other roles to receive `maxAllowedPercent: 0`. Also, `/sales/quotations/page.tsx:51` hardcodes `'sales_executive'` instead of reading `activeRole`.

