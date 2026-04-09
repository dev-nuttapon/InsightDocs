# Authentication Phase 1

## Goals

- use Keycloak as the only authentication source of truth
- validate bearer tokens in the backend with Keycloak realm metadata
- let the frontend perform enterprise sign-in through OIDC Authorization Code Flow with PKCE
- expose the authenticated user profile through backend `GET /api/auth/me`
- support admin-controlled registration and password reset workflows without email automation

## Backend

Implemented backend authentication pieces:

- JWT bearer authentication against `Keycloak.BaseUrl` + `Keycloak.Realm`
- authorization policies for authenticated users and admin access
- claims transformation for Keycloak realm and client roles
- `ICurrentUser` abstraction backed by `HttpContext`

Primary auth endpoints:

- `GET /api/auth/me`
- `GET /api/auth/protected`
- `GET /api/auth/admin-check`
- `POST /api/auth/register`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/admin/password-reset-requests`
- `POST /api/admin/password-reset-requests/{id}/approve`
- `POST /api/admin/password-reset-requests/{id}/reject`

## Frontend

Implemented frontend authentication pieces:

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/auth/callback`
- `/unauthorized`
- `/admin/password-reset-requests`
- auth context/provider and protected route wrapper
- PKCE helper and OIDC discovery/token exchange client
- authenticated profile/header UI after `/api/auth/me`
- logout redirect back through Keycloak end-session endpoint when available

## Required Local Configuration

Backend env overrides for Docker Compose local Keycloak:

```bash
INSIGHTDOCS_Keycloak__BaseUrl=http://localhost:8080
INSIGHTDOCS_Keycloak__Realm=saas
INSIGHTDOCS_Keycloak__ClientId=insightdocs-admin-api
INSIGHTDOCS_Keycloak__RoleClientId=insightdocs-web
```

Frontend env values:

```bash
VITE_API_BASE_URL=http://localhost:8081
VITE_KEYCLOAK_BASE_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=saas
VITE_KEYCLOAK_CLIENT_ID=insightdocs-web
VITE_KEYCLOAK_SCOPES=openid profile email
```

## Keycloak Local Setup

1. Start Keycloak from Docker Compose
2. Create realm `saas`
3. Create public client `insightdocs-web`
4. Set client redirect URI to `http://localhost:5173/*`
5. Set web origin to `http://localhost:5173`
6. Ensure access tokens include the roles you want mapped
7. Create a user and assign test roles

## Notes

- `Keycloak.ClientSecret` is kept in backend config for future confidential-client or service-to-service flows, but the Phase 1 SPA login flow does not send a client secret from the browser
- if `Keycloak.ApiAudience` is left empty, backend audience validation is disabled; set it once your Keycloak token audience is finalized
- registration and reset requests do not send email automatically; Admins manually communicate reset links
- reset tokens are secure random strings, time-limited, and one-time use
- registration and password reset lifecycle events are also written into the audit trail for traceability
