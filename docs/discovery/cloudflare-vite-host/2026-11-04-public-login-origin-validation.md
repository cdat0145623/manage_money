# Brownfield Discovery: Public Local-Test Login

## Metadata

```text
Created: 2026-11-04
Feature: Local-test authentication through Cloudflare Quick Tunnel
Subject: Public login origin validation before password checking
Source Spec: SPEC.md
Status: Discovery
```

## 1. Feature Scope

The local-test login flow must accept requests made from the current Cloudflare public hostname and then validate the password stored in the local password file.

## 2. Domain Concepts

- Local-test password: `output/local-test-password.txt`.
- Local API: `scripts/local-api.mjs` on port `5174`.
- Public origin: `https://frederick-social-until-isaac.trycloudflare.com`.
- Session: HttpOnly `thu_chi_test` cookie.

## 3. Existing System Map

```text
Public browser
  -> Cloudflare Quick Tunnel
  -> Vite /local-api proxy
  -> scripts/local-api.mjs origin check
  -> password comparison
  -> HttpOnly session cookie
```

## 4. Database Findings

The database is not involved in the failed login boundary. It is reached only after a session is created.

Name: `thu-chi-test-db`
Location: `compose.yaml`
Purpose: Local PostgreSQL persistence.
Feature relevance: Runtime preflight only; container remained healthy.

## 5. Backend Findings

Function/service: Local-test HTTP server
File: `scripts/local-api.mjs`

Password loading:

```js
const path='output/local-test-password.txt';
const password=readFileSync(path,'utf8').trim();
```

The password is read once when the process starts. Changing the file requires an API restart.

Origin validation:

```js
const configuredOrigin=(process.env.ALLOWED_ORIGIN||'')...
const allowedOrigin=originHost==='127.0.0.1:5173'||originHost==='localhost:5173'||originHost===host||originHost===configuredOrigin;
```

Feature relevance: The public hostname was not supplied through `ALLOWED_ORIGIN`, so the request was rejected before password comparison.

## 6. Existing Similar Implementations

| Existing implementation | Location | Similarity | Reuse potential | Notes |
|---|---|---|---|---|
| Local origin allow-list | `scripts/local-api.mjs` | Same-origin local login protection | Reuse as-is | Supports `ALLOWED_ORIGIN` for a public origin |
| Local-test client branch | `src/api.ts` | Uses `/local-api/login` when `VITE_LOCAL_TEST=true` | Reuse as-is | No Supabase password check in this mode |

## 7. Frontend/UI Findings

`src/api.ts` selects local-test auth when `import.meta.env.VITE_LOCAL_TEST === 'true'`. The login form sends only the password to `/local-api/login`; the email field is hidden in local-test mode.

## 8. API Findings

Request method and route: `POST /local-api/login`

HTTP status before fix: `403`

Response message (verbatim):

```json
{"error":"Nguồn yêu cầu không hợp lệ."}
```

Derived concrete error: The public origin was rejected by `scripts/local-api.mjs` before the supplied password reached the comparison at line 30.

Evidence: The public request included `Origin: https://frederick-social-until-isaac.trycloudflare.com`; the API process had no matching `ALLOWED_ORIGIN`.

Confidence: Confirmed

Post-fix boundary response with an empty password: HTTP `401`, `{"error":"Mật khẩu chưa đúng."}`.

Post-fix local verification using the password file without printing its value: HTTP `200`.

## 9. Business Rules

Rule: Reject non-local or unconfigured origins before authentication.

Evidence: `scripts/local-api.mjs` checks `allowedOrigin` before the login branch.

Enforced at: Local API request boundary.

Feature relevance: Public login needs the current tunnel hostname in `ALLOWED_ORIGIN`.

Rule: Password changes take effect after API restart.

Evidence: Password is read once at module startup.

Enforced at: `scripts/local-api.mjs` process lifecycle.

Feature relevance: Restart the API after changing `output/local-test-password.txt`.

## 10. Dependency / Impact Map

```text
Cloudflare hostname
  -> Origin header
  -> ALLOWED_ORIGIN in local API
  -> password comparison
  -> thu_chi_test cookie
```

The failure was in the first boundary, so changing the password alone could not fix the public request.

## 11. Existing Conventions

Database: Docker Compose PostgreSQL test database.

Backend: Local Node HTTP bridge with an in-memory session map.

Frontend: `VITE_LOCAL_TEST=true` selects local API authentication.

Testing: `curl` probes the public and local API boundaries; password value is never printed.

Architecture: Vite proxies `/local-api` to the local API; Cloudflare exposes only Vite port `5173`.

## 12. Reuse Candidates

- Reuse `ALLOWED_ORIGIN` when starting the local API.
- Reuse the existing password file and restart behavior.
- Reuse the existing Vite proxy; no frontend change is required for this failure.

## 13. Risks and Constraints

- Quick Tunnel hostnames change when a new tunnel is created.
- Restarting the local API clears its in-memory sessions.
- Password values must not be printed or included in logs.

## 14. Unknowns

Product unknowns: None for this diagnosis.

Technical unknowns: The next public hostname if the current Quick Tunnel is replaced.

## 15. Discovery Summary

Existing capabilities: Local-test authentication, origin allow-listing, and password-file loading already exist.

Likely reusable pieces: `ALLOWED_ORIGIN` and the existing local API process.

Major affected areas: Local API startup environment and Quick Tunnel hostname changes.

Important constraints: Keep password values private and keep the database unexposed.

Critical unknowns: Whether future tunnel restarts will use a different hostname.

Resolution: Restarting the API with `ALLOWED_ORIGIN=https://frederick-social-until-isaac.trycloudflare.com` changed the public login boundary from 403 origin rejection to normal password validation; the current password file was accepted locally with HTTP `200`.
