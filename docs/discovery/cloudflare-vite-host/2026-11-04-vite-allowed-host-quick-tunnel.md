# Brownfield Discovery: Cloudflare Quick Tunnel Host

## Metadata

```text
Created: 2026-11-04
Feature: Public local web preview through Cloudflare Quick Tunnel
Subject: Vite host validation for a new Quick Tunnel domain
Source Spec: SPEC.md
Status: Discovery
```

## 1. Feature Scope

The local Vite web server must be reachable through the current Cloudflare Quick Tunnel hostname.

## 2. Domain Concepts

- Local web server: Vite on `127.0.0.1:5173`.
- Public tunnel: `cloudflared tunnel --url http://127.0.0.1:5173`.
- Host validation: Vite `server.allowedHosts`.
- User action: open the generated `trycloudflare.com` URL.

## 3. Existing System Map

```text
Chrome/iPhone
  -> Cloudflare Quick Tunnel
  -> Vite 127.0.0.1:5173
  -> React SPA
```

Vite also proxies `/local-api` to the local API on `127.0.0.1:5174`.

## 4. Database Findings

Database is unrelated to this host-validation failure.

Name: `thu-chi-test-db`
Location: `compose.yaml`
Purpose: Local PostgreSQL test persistence.
Feature relevance: Runtime preflight only; container was healthy during diagnosis.

## 5. Backend Findings

Function/service: Vite development server configuration
File: `vite.config.ts`

Responsibility: Validates the request host and proxies `/local-api`.

Configuration evidence:

```ts
allowedHosts: process.env.TUNNEL_HOST ? [process.env.TUNNEL_HOST] : []
```

Feature relevance: The new tunnel hostname was not present in the Vite process environment.

## 6. Existing Similar Implementations

| Existing implementation | Location | Similarity | Reuse potential | Notes |
|---|---|---|---|---|
| `TUNNEL_HOST` allow-list | `vite.config.ts` | Existing public-tunnel host control | Reuse as-is | Restart Vite with the current tunnel hostname |
| Vite host-validation middleware | `node_modules/vite` | Enforces `server.allowedHosts` | Pattern only | Returned the exact 403 diagnostic |

## 7. Frontend/UI Findings

The frontend is a Vite React SPA. The error occurred before React loaded, so no UI component was involved.

## 8. API Findings

Request method and route: `GET https://frederick-social-until-isaac.trycloudflare.com/`

HTTP status before fix: `403`

Response message (verbatim):

```text
Blocked request. This host ("frederick-social-until-isaac.trycloudflare.com") is not allowed.
To allow this host, add "frederick-social-until-isaac.trycloudflare.com" to `server.allowedHosts` in vite.config.js.
```

Derived concrete error: Vite rejected the Host header because the running Vite process had no matching `TUNNEL_HOST` value.

Evidence: `vite.config.ts` reads `process.env.TUNNEL_HOST`; the running Vite process was started without that environment variable; the public request reproduced the 403.

Confidence: Confirmed

## 9. Business Rules

Rule: Only the intended local web port is public.

Evidence: Cloudflare command targets `http://127.0.0.1:5173`; PostgreSQL has no public port mapping.

Enforced at: Cloudflare command and Docker Compose configuration.

Feature relevance: Preserve this boundary while allowing the current tunnel host.

## 10. Dependency / Impact Map

```text
TUNNEL_HOST environment
  -> vite.config.ts/server.allowedHosts
  -> Vite host-validation middleware
  -> Cloudflare public request
```

The tunnel itself was reachable; only Vite host validation blocked the request.

## 11. Existing Conventions

Database: Docker Compose PostgreSQL test container.

Backend: Local API process on port `5174`; Vite proxies `/local-api`.

Frontend: Vite dev server on port `5173`; source is served directly with hot reload.

Testing: Runtime smoke checks use `curl`; project tests use Node's built-in test runner.

Architecture: Public access is through Cloudflare Quick Tunnel, not a production build.

## 12. Reuse Candidates

- Reuse the existing `TUNNEL_HOST` environment input in `vite.config.ts`.
- Reuse the existing Vite process and source mount; no image build is needed.
- Reuse the current Cloudflare Quick Tunnel process for the newly generated hostname.

## 13. Risks and Constraints

- Quick Tunnel hostnames are ephemeral and change when a new tunnel is created.
- Vite must be restarted when its startup environment changes.
- Setting `allowedHosts: true` would weaken host validation and was not used.

## 14. Unknowns

Product unknowns: None for this diagnosis.

Technical unknowns: Whether the user will keep the current Quick Tunnel hostname or generate another one later.

## 15. Discovery Summary

Existing capabilities: Vite already supports an explicit `TUNNEL_HOST` allow-list and the local API proxy.

Likely reusable pieces: Existing Vite config and Cloudflare command.

Major affected areas: `vite.config.ts` runtime environment and the Vite process lifecycle.

Important constraints: Keep the database private and do not allow arbitrary hosts.

Critical unknowns: The next Quick Tunnel hostname, if the current one is replaced.

Resolution evidence: Vite was restarted with `TUNNEL_HOST=frederick-social-until-isaac.trycloudflare.com`; the public URL then returned HTTP `200` and served the SPA HTML.
