# Frontend

This frontend is a `Vite + React + TypeScript` scaffold for the InsightDocs internal document management interface.

## Structure

- `src/app`: application bootstrap, router, and global styles
- `src/features/auth`: OIDC login flow, callback handling, protected routes, auth context, and API profile loading
- `src/features/auth`: OIDC login flow plus registration, forgot password, reset password, and admin password-reset review screens
- `src/features/dashboard`: initial dashboard placeholder
- `src/features/documents`: document registry, detail screen, version history, upload, and restore actions
- `src/features/approvals`: pending review queue with manager decisions
- `src/features/signatures`: pending signer queue
- `src/features/search`: metadata and full-text document search UI
- `src/features/users`: admin-only user and role management screens plus typed API client
- `src/shared/components/layout`: reusable shell and layout primitives

## Included

- browser routing with `react-router-dom`
- application shell with sidebar navigation and authenticated profile area
- Keycloak authorization code flow with PKCE
- protected routing that checks session state and redirects unauthenticated users into Keycloak
- callback handling on `/auth/callback`
- unauthorized page on `/unauthorized`
- `/api/auth/me` profile fetch after successful login
- `/documents` and `/documents/:id` for version lifecycle operations
- `/approvals` for pending review decisions
- `/signatures` for signer work queue
- `/search` for enterprise search and retrieval
- admin-only `/users` and `/users/:id` management screens
- public `/register`, `/forgot-password`, `/reset-password`
- admin-only `/admin/password-reset-requests`
- environment-based configuration via `VITE_` variables

## Run

```bash
cd frontend
npm install
npm run dev
```

Default URL: `http://localhost:5173`

## Auth Flow

1. Unauthenticated users hitting protected routes are redirected into Keycloak using Authorization Code Flow with PKCE
2. `/login` is still available as an explicit login entry page
3. `/auth/callback` exchanges the authorization code for tokens
4. The app calls backend `GET /api/auth/me`
5. Authenticated user details are shown in the app shell and dashboard

Registration and reset flow:

1. `/register` submits a pending registration request through backend identity provisioning
2. Admin approves the user from user management
3. `/forgot-password` creates a pending password reset request
4. Admin approves or rejects the request at `/admin/password-reset-requests`
5. After approval, Admin copies the generated reset URL and manually sends it to the user
6. `/reset-password?token=...` updates the password through Keycloak

## Required Environment Variables

- `VITE_API_BASE_URL`
- `VITE_KEYCLOAK_BASE_URL`
- `VITE_KEYCLOAK_REALM`
- `VITE_KEYCLOAK_CLIENT_ID`
- `VITE_KEYCLOAK_SCOPES`

## Local Keycloak Setup

For the bundled Docker Compose stack, use:

- `VITE_KEYCLOAK_BASE_URL=http://localhost:8080`
- `VITE_KEYCLOAK_REALM=saas`
- `VITE_KEYCLOAK_CLIENT_ID=insightdocs-web`

The Keycloak SPA client should be configured as a public client with:

- Redirect URI: `http://localhost:5173/*`
- Web Origin: `http://localhost:5173`

## Version UI

- `/documents` lists document records and allows document creation for authorized roles
- `/documents/:id` shows current status, version history, approval history, original/signed PDF availability, upload form, restore action, and submit-review action
- restore is only shown to authorized business roles
- `/approvals` shows the pending manager queue with approve/reject actions and comment entry
- `/documents/:id` also includes signature assignment, placement configuration, and signature history
- `/signatures` lets assigned signers sign or reject their own pending requests
- `/search` provides keyword search, filters, pagination, and quick links back to document detail
