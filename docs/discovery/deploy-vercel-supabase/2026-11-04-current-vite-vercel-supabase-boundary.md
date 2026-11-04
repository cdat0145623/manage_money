# Brownfield Discovery: Vercel and Supabase Deployment Boundary

## Metadata

```text
Created: 2026-11-04
Feature: Production deployment
Subject: Current Vite build and Supabase production boundary
Source Spec: SPEC.md
Status: Discovery
```

## 1. Feature Scope

Prepare the existing expense app for GitHub-backed Vercel deployment with Supabase hosted database and Auth.

## 2. Domain Concepts

- Frontend: React + Vite + TypeScript SPA.
- Persistence: Supabase Postgres, RLS, and `mutate` RPC.
- Authentication: Supabase Auth in production; local password bridge only for local testing.
- Deployment: GitHub repository connected to Vercel.

## 3. Existing System Map

```text
Vercel static build
  -> React/Vite client
  -> Supabase URL + publishable key
  -> Supabase Auth and RLS-protected tables/RPC
```

Local testing uses Vite's `/local-api` proxy and `scripts/local-api.mjs`; that bridge is not a production dependency.

## 4. Database Findings

Name: `public.expenses`, `public.schedules`, `public.refunds`, `public.budgets`, `public.mutation_receipts`
Location: `supabase/001_initial.sql`

Purpose: Store expenses, recurring schedules, refunds, monthly budgets, and idempotent mutation receipts.

Relevant fields: `user_id`, expense classification fields, schedule fields, budget month/channel, RLS policies.

Relations: Refunds reference expenses; expenses can reference schedules.

Constraints/indexes: Check constraints, composite ownership keys, RLS, user indexes, and unique mutation keys.

Used by: `src/api.ts` through Supabase table reads and the `public.mutate` RPC.

Feature relevance: The migration must be applied to the hosted Supabase project before production login/data tests.

## 5. Backend Findings

Function/service: `src/api.ts`
File: `src/api.ts`

Responsibility: Selects local-test API or Supabase Auth/data access based on `VITE_LOCAL_TEST`.

Callers: `src/App.tsx`.

Dependencies: `@supabase/supabase-js`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.

Side effects: Supabase Auth session reads/sign-in and RPC mutations.

Feature relevance: Production must set `VITE_LOCAL_TEST` to a value other than `true` and provide both Supabase variables.

## 6. Existing Similar Implementations

| Existing implementation | Location | Similarity | Reuse potential | Notes |
|---|---|---|---|---|
| Vite production build | `package.json` | Existing deployable frontend build | Reuse as-is | `npm run build` emits `dist` |
| Supabase client branch | `src/api.ts` | Existing hosted persistence/auth path | Reuse as-is | Already avoids the local API when local-test is false |
| SQL migration | `supabase/001_initial.sql` | Existing production schema/RLS/RPC | Reuse as-is | Apply to hosted Supabase; no seed data included |

## 7. Frontend/UI Findings

The application is a single Vite React entry point at `src/main.tsx`. Page navigation uses hash routes (`#/overview`, etc.), so the initial static deployment does not need server-side Next.js routing or a backend route layer.

## 8. API Findings

Production data/auth path:

- Supabase Auth sign-in through `supabase.auth.signInWithPassword`.
- Reads from `expenses`, `refunds`, `schedules`, and `budgets`.
- Writes through the `public.mutate` RPC.

Local-only path:

- `/local-api/*` proxied by `vite.config.ts` to `127.0.0.1:5174`.
- `scripts/local-api.mjs` reads `output/local-test-password.txt`.

The local-only path must not be selected in the Vercel build.

## 9. Business Rules

Rule: Production data access uses Supabase Auth and RLS.

Evidence: `SPEC.md` and `supabase/001_initial.sql`.

Enforced at: Supabase Auth, table policies, and the `mutate` RPC.

Feature relevance: Do not deploy the local password bridge as production auth.

Rule: Only publishable client configuration belongs in the browser.

Evidence: `SPEC.md` and `.env.example`.

Enforced at: Frontend environment configuration and Supabase key selection.

Feature relevance: Never add a service-role key to GitHub, Vercel client variables, or source.

## 10. Dependency / Impact Map

```text
VITE_LOCAL_TEST
  -> src/api.ts auth/data branch
  -> local API or Supabase

VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY
  -> Supabase client
  -> Auth session and RLS/RPC data access

package.json build script
  -> Vite build
  -> dist output
  -> Vercel static deployment
```

## 11. Existing Conventions

Database: Supabase SQL migration with RLS and SQL RPC.

Backend: No production backend service in v1; local Node bridge is test-only.

Frontend: React + Vite + TypeScript; Vite environment variables use the `VITE_` prefix.

Testing: Node built-in tests plus local runtime/API smoke checks.

Architecture: Client-side calculations from Supabase data; no Next.js server layer.

## 12. Reuse Candidates

- Existing `package.json` build script and `dist` output.
- Existing Supabase client code and SQL migration.
- Existing `.gitignore` protections for `.env*`, `output/`, and `dist/`.
- Existing hash navigation, which avoids a Vercel history-fallback requirement for the current routes.

## 13. Risks and Constraints

- The repository currently has no Git metadata or remote.
- `VITE_LOCAL_TEST=true` would make a Vercel build call a nonexistent local API.
- Hosted Supabase has no schema/data until the migration is applied.
- Auth Site URL and redirect allow-list must include the production Vercel URL; preview URLs are a separate decision.
- Existing local Docker data is not automatically moved to Supabase.
- Node engine is `>=22.12.0` in `package.json`.

## 14. Unknowns

Product unknowns: Default Vercel URL versus a custom production domain; whether local test data should be migrated; whether preview deployments need login access.

Technical unknowns: Supabase project reference, project URL, publishable key, GitHub repository URL, and Vercel team/project scope.

## 15. Discovery Summary

Existing capabilities: The app already has a production Supabase client path, SQL migration/RLS/RPC, and a Vite build.

Likely reusable pieces: Current React/Vite source, `npm run build`, `supabase/001_initial.sql`, and `src/api.ts`.

Major affected areas: Git repository setup, hosted Supabase migration/Auth configuration, and Vercel environment variables.

Important constraints: Keep local-test auth out of production; never expose service-role credentials; preserve the existing client-only architecture.

Critical unknowns: GitHub/Vercel/Supabase account targets and the production domain.
