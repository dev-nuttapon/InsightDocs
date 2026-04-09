# Document Version Lifecycle

## Version Model

Each `Document` is the logical record in the application database. Each upload creates a `DocumentVersion` row that points at immutable MinIO object keys.

Each document also carries a workflow status:

- `Draft`
- `InReview`
- `Approved`
- `Rejected`
- `Archived`

`DocumentVersion` fields:

- `Id`
- `DocumentId`
- `VersionNumber`
- `OriginalObjectKey`
- `SignedObjectKey`
- `Checksum`
- `ChangeSummary`
- `CreatedBy`
- `CreatedAt`
- `IsCurrent`

## Upload Flow

1. A document is created in the application database.
2. An authorized user uploads a new PDF version through `POST /api/documents/{id}/versions`.
3. The backend validates the PDF and stores it in MinIO under a unique object key.
4. The previous current version is marked historical.
5. The new version is inserted with `IsCurrent = true`.

Optional signed PDFs can also be stored on the same version record, but signature generation is not implemented yet.

## Restore Flow

Restore is intentionally append-only.

1. An authorized user calls `POST /api/documents/{id}/versions/{versionId}/restore`.
2. The selected historical version is not modified.
3. The current version is marked historical.
4. A new version row is created with the next version number and the selected version's object keys.
5. The new restore-created row becomes the current version.

This preserves a complete audit trail and avoids destructive object replacement in MinIO.

## Approval Workflow

Approval is separate from digital signing.

Valid transitions:

1. `Draft -> InReview` via `POST /api/documents/{id}/submit-review`
2. `Rejected -> InReview` via `POST /api/documents/{id}/submit-review`
3. `InReview -> Approved` via `POST /api/documents/{id}/approve`
4. `InReview -> Rejected` via `POST /api/documents/{id}/reject`

Workflow rules:

- `DocumentController` or `Admin` submits a document for review
- `Manager` or `Admin` approves or rejects
- comments are stored as approval metadata and shown in history
- content updates and restored versions move the document back to `Draft`
- documents in `InReview` cannot be modified until a decision is made
- signed PDFs are blocked until the document has completed approval

## Search And Retrieval

Search is currently metadata-first and PostgreSQL-backed.

- keyword and full-text search run against document title, description, and category
- enterprise filters support category, status, owner, controller, signer, and archived state
- result rows include current version number plus signature summary so users can triage quickly from the search screen
- the search contract is kept separate from document CRUD so semantic retrieval can be layered in later without breaking the UI route or API path

## Audit Visibility

Document lifecycle events are also written to the audit trail, including:

- metadata updates
- version uploads
- version restore
- review submission
- approve/reject decisions
- signer assignment
- sign/reject execution
- archive

## Local Development Seed

Phase 5 seeds one sample document:

- `Corporate Policy Handbook`

Use the document UI or API to upload the first real version in local development.
