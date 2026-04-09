# InsightDocs Architecture Foundation

## Backend

- clean architecture layering with `Api`, `Application`, `Domain`, and `Infrastructure`
- configuration-driven external service integration points for PostgreSQL, MinIO, and Keycloak
- no business modules implemented yet

## Frontend

- feature-based module layout on top of Vite, React, and TypeScript
- routing and layout shell ready for protected navigation and role-aware UI
- authentication placeholders reserved for real Keycloak OIDC integration

## Planned Modules

- document registration and metadata
- PDF version history and controlled release
- approval workflow and role assignment
- audit trail
- digital signature workflow
- semantic search and retrieval enhancements
