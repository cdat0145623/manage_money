# Brownfield Discovery: Remove Password Gate

## Metadata

```text
Created: 2026-11-08
Feature: Remove password entry page
Subject: Current frontend auth gate and Supabase RLS dependency
Source Spec: SPEC.md
Status: Discovery
```

## 1. Feature Scope

The user wants the deployed expense app to open without the email/password form. The requested change affects startup authentication, data loading, mutation access, and the logout controls. It does not change expense, budget, allocation, or report calculations.

## 2. Domain Concepts

- User session and authentication state.
- Supabase client session.
- Anonymous or authenticated database role.
- Expenses, schedules, refunds, budgets, and mutation receipts.
- RLS ownership by `user_id`.
- Startup synchronization of recurring schedules.

## 3. Existing System Map

```text
src/main.tsx
  -> src/App.tsx
       -> getSession()
       -> if no session: Login form
       -> if session: mutate("sync") and loadData()
  -> src/api.ts
       -> Supabase Auth session/sign-in
       -> table reads
       -> public.mutate RPC writes
supabase/001_initial.sql
  -> authenticated-only table policies
  -> auth.uid()-owned rows
  -> authenticated-only mutate RPC
```

## 4. Database Findings

Name: `public.expenses`, `public.schedules`, `public.refunds`, `public.budgets`, `public.mutation_receipts`

Location: `supabase/001_initial.sql`

Purpose: Store expense records, recurring schedules, refunds, budgets, and idempotency receipts.

Relevant fields: Each domain table has `user_id DEFAULT auth.uid()`; domain fields include channel, tag, amount, dates, status, and allocation months.

Relations: Refunds reference expenses; expenses can reference schedules; ownership is represented by `user_id`.

Constraints/indexes: Row-level security is enabled. `owner_read` policies are granted to `authenticated` and filter by `auth.uid()`. Anonymous access is not granted. The `mutate` RPC is executable only by `authenticated` and rejects a null `auth.uid()`.

Used by: `src/api.ts` table reads and `public.mutate` calls.

Feature relevance: Removing the frontend form without establishing a Supabase session leaves reads and writes unauthorized. The SQL does not currently expose data to the `anon` role.

## 5. Backend Findings

Function/service: `getSession()`

File: `src/api.ts`

Responsibility: Selects local-test session behavior or reads the Supabase session.

Callers: `App.start()` in `src/App.tsx`.

Dependencies: `localTest`, `supabase.auth.getSession()`.

Side effects: None on the current path.

Feature relevance: Startup depends on its boolean result before rendering the app.

Function/service: `login()`

File: `src/api.ts`

Responsibility: Calls the local password bridge or `supabase.auth.signInWithPassword`.

Callers: `Login` component in `src/App.tsx`.

Dependencies: Local API or Supabase Auth.

Side effects: Creates an authenticated Supabase session or local test session.

Feature relevance: The requested UI removal makes this caller obsolete unless another authentication flow is retained.

Function/service: `loadData()` and `mutate()`

File: `src/api.ts`

Responsibility: Read all domain tables and write through the idempotent RPC.

Callers: Pages and forms in `src/App.tsx` and `src/components.tsx`.

Dependencies: Supabase session and RLS/RPC permissions.

Side effects: Reads persisted data; writes expense, schedule, refund, and budget state.

Feature relevance: Must continue to run under a role accepted by the current RLS or the database contract must change.

## 6. Existing Similar Implementations

| Existing implementation | Location | Similarity | Reuse potential | Notes |
|---|---|---|---|---|
| Local test password bridge | `scripts/local-api.mjs`, `src/api.ts` | Provides a session-like local gate | Pattern only | It is intentionally local-only and is not suitable for hosted Supabase data. |
| Supabase password sign-in | `src/api.ts` and `src/App.tsx` | Existing hosted authentication | Extend | It currently requires the removed form. |
| RLS owner policies | `supabase/001_initial.sql` | Session-backed ownership | Reuse as-is | Keeps data scoped to `auth.uid()`. |

## 7. Frontend/UI Findings

- `Login` in `src/App.tsx` renders the email/password form and local password notice.
- `App.start()` gates the entire shell on `getSession()`.
- `App` renders sidebar and mobile logout controls through `logout()`.
- `loading-screen` and `fatal-error` styles are shared startup states in `src/style.css`.
- Page forms already call shared `loadData()`/`mutate()` paths, so the auth change is concentrated at startup and session controls.

## 8. API Findings

There is no separate backend API in production. The browser uses:

- Supabase Auth session APIs from `src/api.ts`.
- Supabase table reads for `expenses`, `refunds`, `schedules`, and `budgets`.
- `public.mutate(text,jsonb,uuid)` for writes.

The local `/local-api/*` bridge is selected only when `VITE_LOCAL_TEST === 'true'`.

## 9. Business Rules

Rule: Domain rows are owned by the current Supabase user.

Evidence: `user_id DEFAULT auth.uid()` and `owner_read` policies in `supabase/001_initial.sql`.

Enforced at: Database RLS and RPC checks.

Feature relevance: A no-form flow must still create or restore a valid session, or ownership/security rules must be redesigned.

Rule: Writes require a non-null authenticated user and idempotency request ID.

Evidence: `public.mutate` checks `auth.uid()` and `request_id`.

Enforced at: SQL function.

Feature relevance: Direct anonymous table access is insufficient for the current write path.

## 10. Dependency / Impact Map

```text
Startup auth gate
  -> getSession()
  -> Login form when false
  -> mutate("sync")
  -> loadData()
  -> every page and mutation form
```

Changing only the visible form while leaving session setup unchanged would cause the app to render without a usable data session. Changing database grants would affect every user and every write path.

## 11. Existing Conventions

Database: Supabase SQL migration, UUID IDs, `user_id` ownership, RLS, SQL RPC.

Backend: No separate server in production; Supabase is the persistence/auth boundary.

Frontend: React + Vite + TypeScript; startup state is managed in `App`; hash routing; Supabase client selected by `VITE_*` variables.

Testing: Node built-in tests cover domain/report logic; no existing UI test harness is present in `package.json`.

Architecture: Client-side calculations and Supabase hosted persistence; no Next.js server layer.

## 12. Reuse Candidates

- Reuse `getSession()`/Supabase client boundary for any replacement session bootstrap.
- Reuse existing RLS and `mutate` RPC if the replacement session uses an accepted Supabase role.
- Reuse `loading-screen` and `fatal-error` for startup failures.
- Remove only the obsolete `Login` caller and logout controls after the session behavior is decided.

## 13. Risks and Constraints

- Removing the form without a session breaks all RLS-protected reads and writes.
- Public `anon` policies would expose personal financial data and change the security model.
- Anonymous Auth can preserve RLS but creates device/browser-scoped identities unless a recovery/linking flow is added.
- Existing local-test support depends on `VITE_LOCAL_TEST` and the local API password file.
- Supabase hosted project must have the chosen Auth capability enabled before production smoke testing.

## 14. Unknowns

Product unknowns:

- Whether the user accepts data being scoped to an anonymous browser/device.
- Whether data must remain shareable across devices without a visible login.

Technical unknowns:

- Whether Anonymous Sign-Ins is enabled in the target Supabase project.
- Whether the hosted Supabase migration has already been applied to that project.

## 15. Discovery Summary

Existing capabilities:

- Supabase password authentication, RLS, idempotent RPC writes, local test auth, and a startup auth gate.

Likely reusable pieces:

- The Supabase client, `getSession()` boundary, existing RLS/RPC, and startup loading/error states.

Major affected areas:

- `src/App.tsx` startup/login/logout UI and `src/api.ts` session bootstrap.

Important constraints:

- Current database access is authenticated-only and owner-scoped.

Critical unknowns:

- The replacement no-form session model and whether the user accepts device-scoped anonymous data.
