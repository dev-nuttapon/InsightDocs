# Backend

This backend is a `.NET 10` Web API scaffolded for clean architecture and enterprise-oriented document management foundations.

## Projects

- `src/InsightDocs.Api`: HTTP entry point, middleware, controllers, and API response contracts
- `src/InsightDocs.Application`: application layer extension point for use cases, contracts, and orchestration
- `src/InsightDocs.Domain`: core domain abstractions and entities
- `src/InsightDocs.Infrastructure`: infrastructure registrations and environment-driven configuration bindings

## Dependency Direction

- `InsightDocs.Api -> InsightDocs.Application`
- `InsightDocs.Api -> InsightDocs.Infrastructure`
- `InsightDocs.Infrastructure -> InsightDocs.Application`
- `InsightDocs.Infrastructure -> InsightDocs.Domain`
- `InsightDocs.Application -> InsightDocs.Domain`
- `InsightDocs.Domain` has no outgoing project references

## Foundation Included

- environment-based configuration via `appsettings*.json` and `INSIGHTDOCS_` prefixed environment variables
- health check endpoint at `/health`
- centralized exception handling middleware
- consistent success/error response models
- CORS baseline for the frontend URL
- configuration sections for `ConnectionStrings`, `Keycloak`, `Redis`, `SecurityAccess`, and `Minio`
- Keycloak integration placeholders without mock endpoints
- EF Core PostgreSQL persistence for application-owned user status and workflow records

## Identity And Authentication

- JWT bearer authentication against the configured Keycloak realm
- claims transformation that maps Keycloak `realm_access` and `resource_access.{RoleClientId}` roles into ASP.NET Core role claims
- `ICurrentUser` abstraction for subject, username, email, and resolved roles
- protected endpoints:
  - `GET /api/auth/me`
  - `GET /api/auth/protected`
  - `GET /api/auth/admin-check`

Public lifecycle endpoints:

- `POST /api/auth/register`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

## User And Access Management

Keycloak is the source of truth for identity and role membership. PostgreSQL stores the local application access record, approval state, and workflow metadata that InsightDocs owns.

Admin APIs:

- `GET /api/users`
- `GET /api/users/{id}`
- `POST /api/users`
- `PUT /api/users/{id}`
- `POST /api/users/{id}/approve`
- `POST /api/users/{id}/disable`
- `POST /api/users/{id}/enable`

Authorization policies use roles issued by Keycloak. User admin pages surface Keycloak roles for visibility but do not manage role assignment inside the application database.

## Registration And Password Reset

- registration creates a Keycloak user and matching PostgreSQL app user with `Pending` status
- newly registered Keycloak users are created disabled until an Admin approves them
- password reset requests are stored in PostgreSQL and reviewed by Admins
- approved reset requests generate a one-time reset token and an admin-copyable reset URL
- reset password completion updates the password in Keycloak and marks the request as `Completed`

## Document Version Control

- application documents are stored in PostgreSQL and version files are written to MinIO
- `DocumentVersion` tracks original and signed PDF object keys separately
- each re-upload creates a new version with the next version number
- restore is append-only and creates a new current version from the selected historical version
- content changes move the document workflow state back to `Draft`

Document APIs:

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
- `GET /api/audit-logs`
- `GET /api/audit-logs/{id}`
- `GET /api/dashboard/summary`
- `GET /api/dashboard/recent-documents`
- `GET /api/dashboard/recent-activities`
- `POST /api/documents/{id}/archive`

## Approval Workflow

- workflow statuses: `Draft`, `InReview`, `Approved`, `Rejected`, `Archived`
- `DocumentController` and `Admin` can submit a document for review
- `Manager` and `Admin` can approve or reject
- invalid transitions are blocked with conflict responses
- approval comments and timestamps are recorded in PostgreSQL
- signing is still separate; signed PDFs are blocked until approval is complete

## PDF Signature Workflow

- signature requests are stored per document version
- each request tracks signer, order, page, x/y, width, and height
- signers can only act on the current approved version
- MinIO stores each newly signed PDF output
- the current implementation writes a visible signature block into the PDF file itself through `IPdfDigitalSignatureService`
- the provider abstraction is ready to be swapped for a certificate-backed signing engine later

## Search And Retrieval

- `GET /api/search/documents`
- PostgreSQL metadata and full-text search across title, description, and category
- enterprise filters for category, status, owner, controller, signer, and archived state
- paged results with current version number and signature summary
- search orchestration sits behind `ISearchService` so semantic retrieval can be added later without breaking the API contract

## Audit Log

- `AuditLog` is stored in PostgreSQL as an append-only compliance trail
- important auth, document, approval, signature, and archive events are written from service-layer orchestration
- `GET /api/audit-logs` supports filters for actor, action, document, and date range
- `GET /api/audit-logs/{id}` returns the full stored metadata payload for an event
- there are no edit or delete APIs for audit entries

## Dashboard

- `GET /api/dashboard/summary`
- `GET /api/dashboard/recent-documents`
- `GET /api/dashboard/recent-activities`
- summary returns core operational counts such as total documents, pending approvals, pending signatures, approved documents, and archived documents
- recent activities are sourced from append-only audit entries so the dashboard stays aligned with compliance visibility
- summary and recent activities are role-aware where queue counts or work lists depend on the current user

Admin password reset APIs:

- `GET /api/admin/password-reset-requests`
- `POST /api/admin/password-reset-requests/{id}/approve`
- `POST /api/admin/password-reset-requests/{id}/reject`

## Local Keycloak Notes

The committed `appsettings.json` uses `http://auth.localhost/` as the Keycloak base URL. For Docker Compose local development, override it to `http://localhost:8080` via environment variables:

```bash
INSIGHTDOCS_Keycloak__BaseUrl=http://localhost:8080
INSIGHTDOCS_Keycloak__Realm=saas
INSIGHTDOCS_Keycloak__ClientId=insightdocs-admin-api
INSIGHTDOCS_Keycloak__RoleClientId=insightdocs-web
```

Recommended Keycloak setup:

- Realm: `saas`
- SPA/public client: `insightdocs-web`
- API client or audience reference: `insightdocs-admin-api`
- SPA redirect URIs: `http://localhost:5173/*`
- SPA web origins: `http://localhost:5173`
- test user assigned at least one role such as `insightdocs:admin` to verify admin policy behavior

## Run

```bash
cd backend
dotnet restore
dotnet ef database update --project src/InsightDocs.Infrastructure
dotnet run --project src/InsightDocs.Api
```

Run tests:

```bash
dotnet test tests/InsightDocs.Backend.Tests/InsightDocs.Backend.Tests.csproj
```

API defaults:

- Base URL: `http://localhost:8081`
- Health: `GET /health`
- System info: `GET /api/system/info`
- Auth profile: `GET /api/auth/me`
- Auth protected check: `GET /api/auth/protected`
- User admin APIs under `GET/POST/PUT/DELETE /api/users...`
- Registration/reset APIs under `POST /api/auth/register`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`

## Notes

- Phase 5 seeds one sample document record for local development
- richer sample data can be loaded from [docs/demo-data.sql](/Users/nuttapon/Github-dev/InsightDocs/docs/demo-data.sql)
- the MinIO bucket is created on demand if it does not already exist
- restore does not overwrite or delete stored MinIO objects
- `PdfSharpCore` is currently used for PDF mutation and should be reviewed before hardened production rollout because its dependency chain emits vulnerability warnings during restore/build
