# 09 — Performance Test Plan & Observed Baseline

---

## 1. Observed Baseline Metrics (Executed During QA)

### 1.1 Next.js `14.2.35` Production Build Footprint (`npm run build --workspace=apps/web`)
- **Shared First Load JS across all routes**: `87.3 kB` (`chunks/1dd3208c` `53.6 kB` + `chunks/528` `31.7 kB` + `1.95 kB` shared).
- **Route Bundle Sizes (`First Load JS`)**:
  - Lightest routes: `/vehicles/procurement` (`93.7 kB`), `/` (`103 kB`), `/test-drives` (`160 kB`).
  - Heaviest routes: `/employees` (`187 kB`), `/settings` (`186 kB`), `/dashboard` (`183 kB`), `/empportal` (`182 kB`), `/onboarding` & `/finance` & `/emplogin` (`180 kB`).
- **Local Production HTTP `GET` TTFB (`web_http_probe.ts`, 127.0.0.1:3019)**:
  - All 23 existing routes served prerendered static HTML shells (`29.1 KB – 58.1 KB`) in **`9.43 ms – 28.66 ms`**.
  - `/sales` (404 handler): **`120.5 ms`** (`29.5 KB`).
- **Source Size Concentration**:
  - `apps/web/src/styles/globals.css`: **`4,504` lines** loaded globally rather than CSS Modules / route-scoped styles.
  - Page monoliths: `settings/page.tsx` (`3,551` lines), `onboarding/page.tsx` (`2,964` lines), `employees/page.tsx` (`2,822` lines), `vehicles/page.tsx` (`1,811` lines), `crm/leads/page.tsx` (`1,522` lines) bundle large JSX/logic trees per route without dynamic code-splitting (`next/dynamic`) for heavy modals/generators.

---

## 2. Identified Performance & Scalability Risks (Code Inspection)

1. **Unbounded Full-Table Queries (`select('*')` Without Pagination)**:
   - Even though `PaginatedResult<T>` exists in `packages/shared-types/src/index.ts`, browser stores (`api-client.ts`, `document-store.ts`, `employee-store.ts`, `test-drive-store.ts`) and Express endpoints (`main.ts`) execute unbounded `select('*')` queries without `.limit()` or keyset/offset pagination, transferring entire tables to every client.
2. **Base64 File Payloads in `localStorage` & PostgreSQL JSONB**:
   - `document-store.ts` / `/api/documents` and `/vehicles` / `/employees` / `Shell.tsx` encode binary files/avatars/PDFs as base64 strings inside `localStorage` (`crm_compliance_documents_v1`, `crm_employees_v2`, etc.) and JSONB DB columns. Storing a few ~2–3 MB PDFs/photos rapidly exhausts the browser ~5 MB `localStorage` quota (`QuotaExceededError`), causes synchronous JSON parse/stringify UI jank, and bloats API JSON payloads.
3. **Client-Side O(N*M) Scans in Reports & Dashboard**:
   - `reports/page.tsx:151-172` iterates employees and scans all date-filtered leads and deals inside `useMemo` in the browser, which will degrade frame rates as datasets reach 5,000+ leads/deals.
4. **Sequential Queries vs Connection Pooling**:
   - `api/documents/route.ts` and `api/employees/route.ts` issue preliminary tenant/branch lookup queries before executing the primary query on every `POST`.

---

## 3. Recommended Safe Load & Stress Testing Scenarios (Pre-Production Staging Only)

*(Do NOT execute load tests against production Supabase. Run exclusively against an isolated staging Supabase project or local PostgreSQL + Node cluster.)*

| Scenario ID | Target | Test Profile (k6 / Artillery) | Synthetic Dataset Volume | Pass / SLA Target |
| :--- | :--- | :--- | :--- | :--- |
| **PERF-LOAD-01** | Next.js SSR + Static Asset Serving (`/dashboard`, `/crm/leads`, `/vehicles`, `/finance`) | 50 -> 200 virtual users (VUs) over 5 mins | N/A | p95 TTFB < `250 ms`, 0% 5xx, cached chunk hit rate > `95%` |
| **PERF-LOAD-02** | Read API (`GET /api/v1/leads`, `GET /api/v1/vehicles`, `GET /api/documents`, `GET /api/employees`) | 100 concurrent VUs sustained 10 mins | 10,000 leads, 2,500 vehicles, 5,000 documents (metadata only, no base64!) | p95 < `300 ms`, p99 < `600 ms`, server paginated (`limit=25`) |
| **PERF-LOAD-03** | Concurrent Write Stress (`POST /api/v1/leads`, `PATCH stage`, `POST /api/documents` signed URL) | 50 VUs spike bursts (10 req/sec -> 50 req/sec) | Isolated staging DB | p95 < `500 ms`, 0 deadlocks, zero DB connection exhaustion |
| **PERF-UI-04** | Large Table Rendering & Search Filter (`DataTable`, `crm/leads`, `vehicles`, `reports`) | Headless Playwright trace + Chrome Performance CPU 4x slowdown | 5,000 rows loaded in browser | Search keystroke < `50 ms` frame time; memory < `250 MB`; 0 `QuotaExceededError` |
| **PERF-DB-05** | `EXPLAIN ANALYZE` Index Verification | Staging Postgres query plan inspection on filtered tenant/branch/date queries | 50,000 synthetic rows | Zero sequential scans (`Seq Scan`) on large tenant-scoped tables; indexes used on `(tenant_id, branch_id, created_at)` |

