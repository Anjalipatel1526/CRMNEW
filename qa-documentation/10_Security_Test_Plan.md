# 10 — Security Test Plan & Hardening Verification

**Scope:** Authentication, Session Integrity, RBAC, Multi-Tenant Data Isolation (RLS), Secrets Exposure, Input Validation, API Security, and Storage Access Control.

---

## 1. Threat Assessment Summary (From Static & Non-Destructive Audit)

| Threat Area | Finding Reference | Observed Risk Level |
| :--- | :--- | :--- |
| **Authentication Bypass** | `login/page.tsx:74-85` (`/login` accepts any username + >=4-char password as `tenant_admin`), `main.ts:36-84` (ignores `password`) | **Critical** |
| **Plaintext Password Exposure** | `company-store.ts:115` (writes raw password to `user_credentials.password_hash`), `emplogin/page.tsx:79-83` (Quick-Fill exposes `emp.password` before login), `localStorage` | **Critical** |
| **Broken Access Control (UI & API)** | Missing Next.js `middleware.ts`, `Shell.tsx` hides nav without blocking direct URLs (`finance`, `documents`, `reports`, `deals`, `procurement`), unauthenticated Express & `/api/documents`, `/api/employees` | **Critical** |
| **Disabled / Permissive Supabase RLS** | 28/49 tables have NO RLS; 21/49 tables use `USING (true)`; all 4 storage buckets `public: true` | **Critical** |
| **Unvalidated Inputs & Dead Validators** | `@crm/validators` Zod schemas never imported anywhere in `apps/`; Express allows raw JSON payloads | **High** |
| **Permissive CORS** | `app.use(cors())` in `apps/api/src/main.ts:13` allows arbitrary origins | **Medium** |
| **Committed Secret Check** | `.env`, `apps/api/.env`, `apps/web/.env.local` are listed in `.gitignore` (`git status` clean) | **Passed** (No secrets committed to Git history inspected in working tree; `.gitignore` rules verified) |

---

## 2. Security Test Execution & Verification Matrix

| Security Check ID | Category | Test Objective | Verification Method | Execution Status |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Auth Bypass & Brute Force | Verify `/login`, `/emplogin`, and `POST /api/v1/auth/login` reject invalid credentials | Static inspection (`login/page.tsx`) + live Express probe (`qa_probes.ts`) | **Executed — Failed** (Critical bypass & HTTP 500 error confirmed) |
| **SEC-02** | Route & Middleware Protection | Verify unauthenticated requests cannot reach CRM modules or APIs | HTTP `GET` probe across 24 routes (`web_http_probe.ts`) + Express 11-endpoint GET probe | **Executed — Failed** (All 23 valid routes & 8 Express GET endpoints return HTTP `200` unauthenticated) |
| **SEC-03** | Multi-Tenant RLS Isolation | Verify JWT of Tenant A cannot read/write Tenant B records (`customers`, `leads`, `deals`, `user_credentials`) | DDL policy inspection (`supabase_schema.sql`); live staging Supabase cross-tenant tests | **Static Audit Failed** (`USING (true)` + 28 un-RLS tables); **Live DB Test Blocked** (Read-only prod rule) |
| **SEC-04** | BFF Service-Role Privilege Escalation (`/api/documents`, `/api/employees`) | Verify Next.js server routes require valid Supabase user JWT & tenant check | Route source code review; non-destructive read-only restriction on writes | **Code Audit Failed** (Zero session checks on `GET/POST/PATCH/DELETE`); **Live Mutating Exploit Not Executed** |
| **SEC-05** | Storage Signed URLs & Bucket ACLs | Verify KYC/Aadhaar/PAN files & customer signatures require signed short-lived URLs | DDL inspection (`supabase_schema.sql:964-980`) | **Executed — Failed** (All 4 buckets `public: true` with `USING (true)`) |
| **SEC-06** | Server Input Validation & Injection | Verify malformed types, negative amounts, XSS payloads, oversized base64 rejected with HTTP `400` | Code inspection (`grep @crm/validators`) + `qa_probes.ts` HTTP tests | **Executed — Failed** (Express does not use `@crm/validators`; `POST /api/v1/deals` returns `201` on arbitrary JSON) |
| **SEC-07** | Client Session Integrity | Verify `localStorage` edits cannot elevate `role` or `isAdmin` | `auth-context.tsx` & `Shell.tsx` inspection | **Code Audit Failed** (Entire session trusted from `localStorage`) |
| **SEC-08** | Secret Exposure in Bundle / Repo | Verify service role keys are not prefixed `NEXT_PUBLIC_` and `.env*` files are gitignored | Env key-name scan + `.gitignore` + `apps/web/src/lib/supabase.ts` check | **Passed** (`NEXT_PUBLIC_*` only on URL/Anon key; `.env*` gitignored; note `supabaseAdmin` falls back to `supabaseAnonKey` if service role missing) |

---

## 3. Mandatory Pre-Production Security Remediation Gates

Before clearing production deployment, ALL of the following must pass re-verification in a staging environment:
1. Replace custom `localStorage`/plaintext auth with **Supabase Auth** (`signInWithPassword` + HTTP-only cookies or verified JWT headers); drop `user_credentials` plaintext storage and remove `/login` demo fallback + `/emplogin` Quick-Fill passwords.
2. Add **Next.js `src/middleware.ts`** plus **JWT auth middleware on `apps/api`** and **session verification on `/api/documents` and `/api/employees`**.
3. Enable RLS on **all `49/49` tables** and replace all `USING (true)` policies with strict `auth.uid()` / `tenant_id` membership checks (`supabase_schema.sql`); convert KYC/document/signature buckets to `public = false` using signed URLs.
4. Wire `@crm/validators` Zod schemas into every `POST` / `PATCH` API route and lock CORS to explicit allowed origins.

