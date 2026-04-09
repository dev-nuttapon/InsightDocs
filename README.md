# InsightDocs

InsightDocs is a production-oriented monorepo scaffold for an internal enterprise PDF document management system. This foundation is designed for controlled document lifecycles, approval workflows, future audit/search capabilities, and multi-role access control.

## Stack

- Backend: `.NET 10 Web API`
- Frontend: `Vite + React + TypeScript`
- Authentication: `Keycloak`
- Database: `PostgreSQL`
- File Storage: `MinIO`
- Local Environment: `Docker Compose`

## Repository Structure

```text
InsightDocs/
  backend/
    src/
      InsightDocs.Api/
      InsightDocs.Application/
      InsightDocs.Domain/
      InsightDocs.Infrastructure/
    tests/
  frontend/
  deploy/
    docker/
  docs/
```

## Implemented Foundation

- clean architecture backend project split with correct project references
- environment-based backend configuration with `appsettings` and prefixed environment variables
- API health check endpoint and centralized exception handling
- consistent API response and error contracts
- Keycloak-based identity foundation with JWT bearer validation, current-user resolution, and protected API endpoints
- PostgreSQL-backed user profile and business-role management with EF Core migration and seeded default roles
- admin-controlled registration and password reset workflow backed by PostgreSQL and Keycloak admin operations
- frontend app shell with protected routing, Keycloak login flow, callback handling, logout, and authenticated profile display
- admin-only Users & Roles module at `/users` and `/users/:id`
- public auth lifecycle pages at `/register`, `/forgot-password`, `/reset-password`
- admin password reset review screen at `/admin/password-reset-requests`
- document registry at `/documents` with version history and restore workflow
- approval queue at `/approvals` with manager actions and approval history
- signer queue at `/signatures` with sequential PDF signing actions
- document search at `/search` with PostgreSQL metadata and full-text retrieval
- local Docker Compose stack for PostgreSQL, MinIO, and Keycloak
- `.env.example` files for backend and frontend

## Quick Start

### 1. Start dependencies

```bash
cd deploy/docker
docker compose up -d
```

Services:

- PostgreSQL: `localhost:5432`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`
- Keycloak: `http://localhost:8080`

### 2. Run the backend

```bash
cd backend
cp .env.example .env
dotnet restore
dotnet ef database update --project src/InsightDocs.Infrastructure
dotnet run --project src/InsightDocs.Api
```

API endpoints:

- `GET /health`
- `GET /api/system/info`
- `GET /api/auth/me`
- `GET /api/auth/protected`
- `GET /api/auth/admin-check`
- `GET /api/users`
- `GET /api/users/{id}`
- `POST /api/users`
- `PUT /api/users/{id}`
- `POST /api/users/{id}/roles`
- `DELETE /api/users/{id}/roles/{roleName}`
- `POST /api/users/{id}/approve`
- `POST /api/users/{id}/disable`
- `POST /api/users/{id}/enable`
- `POST /api/auth/register`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/admin/password-reset-requests`
- `POST /api/admin/password-reset-requests/{id}/approve`
- `POST /api/admin/password-reset-requests/{id}/reject`
- `GET /api/documents`
- `GET /api/documents/{id}`
- `POST /api/documents`
- `PUT /api/documents/{id}`
- `GET /api/documents/{id}/versions`
- `GET /api/documents/{id}/versions/{versionId}`
- `POST /api/documents/{id}/versions`
- `POST /api/documents/{id}/versions/{versionId}/restore`
- `POST /api/documents/{id}/submit-review`
- `POST /api/documents/{id}/approve`
- `POST /api/documents/{id}/reject`
- `GET /api/approvals/pending`
- `GET /api/documents/{id}/approval-history`
- `POST /api/documents/{id}/signatures/assign`
- `GET /api/documents/{id}/signatures`
- `POST /api/documents/{id}/signatures/{signatureRequestId}/sign`
- `POST /api/documents/{id}/signatures/{signatureRequestId}/reject`
- `GET /api/signatures/pending`
- `GET /api/search/documents`

### 3. Run the frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend URL:

- `http://localhost:5173`

## Configuration

### Backend

Primary configuration sources:

- `backend/src/InsightDocs.Api/appsettings.json`
- `backend/src/InsightDocs.Api/appsettings.Development.json`
- environment variables prefixed with `INSIGHTDOCS_`

Example environment keys:

- `INSIGHTDOCS_ConnectionStrings__DefaultConnection`
- `INSIGHTDOCS_Keycloak__BaseUrl`
- `INSIGHTDOCS_Redis__ConnectionString`
- `INSIGHTDOCS_SecurityAccess__SessionIdleTimeoutMinutes`
- `INSIGHTDOCS_Minio__Endpoint`

For local Docker Compose Keycloak, the committed backend config should usually be overridden to:

- `INSIGHTDOCS_Keycloak__BaseUrl=http://localhost:8080`
- `INSIGHTDOCS_Keycloak__Realm=saas`
- `INSIGHTDOCS_Keycloak__ClientId=insightdocs-admin-api`
- `INSIGHTDOCS_Keycloak__RoleClientId=insightdocs-web`

### Frontend

Frontend configuration uses standard `VITE_` variables for API and Keycloak endpoints.

Recommended local values:

- `VITE_API_BASE_URL=http://localhost:8081`
- `VITE_KEYCLOAK_BASE_URL=http://localhost:8080`
- `VITE_KEYCLOAK_REALM=saas`
- `VITE_KEYCLOAK_CLIENT_ID=insightdocs-web`

## Local Login Flow

1. Start the Docker stack from [deploy/docker/docker-compose.yml](/Users/nuttapon/Github-dev/InsightDocs/deploy/docker/docker-compose.yml)
2. Open Keycloak at `http://localhost:8080`
3. Create realm `saas`
4. Create a public SPA client `insightdocs-web` with redirect URI `http://localhost:5173/*` and web origin `http://localhost:5173`
5. Create or map API audience/client settings for `insightdocs-admin-api`
6. Create a test user and assign roles
7. Start backend and frontend with the local env overrides above
8. Open `http://localhost:5173`, sign in, and confirm the dashboard shows your profile from `/api/auth/me`

## Registration And Password Reset Flow

1. Users submit registration at `/register`
2. Backend creates the Keycloak account disabled and stores the app user as `Pending`
3. Admin reviews and approves the user from `/users/:id`
4. Users submit `/forgot-password`
5. Admin reviews requests at `/admin/password-reset-requests`
6. Approval generates a one-time reset link for manual copy/send
7. User completes `/reset-password?token=...`
8. Backend updates the password in Keycloak and marks the request completed

## Document Version Lifecycle

- documents are application records in PostgreSQL
- each upload creates a new immutable document version row
- original and signed PDF object keys are tracked separately
- restore is append-only: it creates a new current version from a historical version without overwriting prior rows or deleting MinIO objects
- approval status is tracked separately from version history
- `DocumentController` submits reviews, `Manager` approves or rejects
- signatures are tracked per current version with signer order and visible coordinate placement on the PDF itself
- search uses PostgreSQL metadata filters plus full-text search on title, description, and category

See [docs/version-lifecycle.md](/Users/nuttapon/Github-dev/InsightDocs/docs/version-lifecycle.md).
See [docs/signature-workflow.md](/Users/nuttapon/Github-dev/InsightDocs/docs/signature-workflow.md).
See [docs/search-strategy.md](/Users/nuttapon/Github-dev/InsightDocs/docs/search-strategy.md).

## Pending Modules For Later Phases

- audit trails
- certificate-backed signing provider hardening
- richer retrieval/download flows and semantic search
