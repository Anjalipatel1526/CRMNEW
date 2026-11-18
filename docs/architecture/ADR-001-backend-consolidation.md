# Architecture Decision Record (ADR-001)

## Title: Backend Consolidation on Next.js App Router BFF and Supabase

- **Status:** Accepted
- **Date:** 2026-11-18
- **Deciders:** Principal Software Architect, Application Security Architect, Senior Full-Stack Engineer
- **Technical Baseline:** UNAI CRM Dealership Platform Audit (UNAI-AUDIT-2026-11-18-01, VULN-03)

---

## Context

The repository historically contained two competing backend implementations:
1. **Next.js App Router Route Handlers (`apps/web/src/app/api/*`)**: Serving as a Backend-For-Frontend (BFF), communicating directly with Supabase via `@supabase/supabase-js` (Auth, PostgreSQL with Row-Level Security, Storage).
2. **Express Standalone API (`apps/api/*`)**: A legacy REST service on port 4000 with separate routes (`/api/v1/*`), redundant Prisma/database connections, and unintegrated authentication logic.

In previous configurations, `apps/web/next.config.mjs` maintained a rewrite proxy:
`/api/v1/:path* -> http://localhost:4000/api/v1/:path*`
This caused architectural ambiguity, split-brain routing, unauthenticated proxy targets, and maintenance overhead. In production deployments (e.g. Vercel), `localhost:4000` is non-existent, leading to silent request timeouts and failures.

## Decision

We adopt **Option A: Next.js App Router BFF + Supabase Architecture** as the single authoritative backend for UNAI CRM.

1. **Elimination of Dead Rewrites:**
   - Removed `/api/v1/:path* -> http://localhost:4000/api/v1/:path*` from `apps/web/next.config.mjs`.
   - All client applications communicate exclusively with Next.js App Router route handlers (`/api/*`).

2. **Unified Data & Security Authority:**
   - Supabase PostgreSQL with strict Row Level Security (RLS) is the sole authoritative system of record.
   - All server-side database access from Next.js route handlers is mediated through `apps/web/src/lib/supabase-server.ts` using authenticated caller sessions (`createServerClient`) or securely guarded administrative client (`getSupabaseAdmin()`).
   - Browser client modules communicate with Supabase using strictly limited publishable Anon credentials or route handlers.

3. **Status of `apps/api`:**
   - `apps/api` is designated as legacy/deprecated and isolated from production builds and deployments.
   - Any remaining business logic previously in `apps/api` has been centralized in `@crm/business-rules` and Next.js route handlers.

4. **Environment Isolation:**
   - Removed hardcoded personal deployment domains from `next.config.mjs`.
   - Domain routing and SSL termination are handled by Edge DNS and hosting configuration, not source code redirects.

## Consequences

### Positive
- **Single Source of Truth:** One unified API surface eliminates divergence in authentication, authorization, and business rules.
- **Improved Security:** Eliminates blind proxying to local unverified ports; all API routes enforce session signature verification and Zod schema validation.
- **Simplified Deployment:** Single Next.js deployment artifact encompasses frontend UI, BFF endpoints, and Edge middleware without requiring secondary container orchestration for Express.
- **Zero In-Cluster Latency:** API routes co-located with Edge runtimes reduce latency.

### Negative / Trade-offs
- Long-running background processes (e.g. video processing or heavy batch scraping) cannot run in short-lived serverless functions.
- *Mitigation:* Background jobs are handled via Supabase pg_cron or dedicated asynchronous edge workers.
