# Audit Coverage

## Audit Strategy

InsightDocs uses an append-only audit log stored in PostgreSQL. Audit entries are written from the service layer, not the controllers, so the logging infrastructure is reusable across authentication, user management, document lifecycle, approval, and signature modules.

Each entry stores:

- actor user reference when available
- action name
- entity type and entity id
- related document id and version id when relevant
- UTC timestamp
- structured `MetadataJson`

## Logged Actions

Current audit coverage includes:

- `registration.requested`
- `registration.approved`
- `password-reset.requested`
- `password-reset.approved`
- `password-reset.rejected`
- `password-reset.completed`
- `document.created`
- `document.metadata.updated`
- `document.uploaded`
- `document.version.created`
- `document.version.restored`
- `document.approval.submitted`
- `document.approval.approved`
- `document.approval.rejected`
- `document.signer.assigned`
- `document.signature.signed`
- `document.signature.rejected`
- `document.archived`

## Querying

Audit APIs support filtering by:

- actor
- action
- related document id
- date range

This makes the audit module usable for both compliance review and operational tracing.

## Append-Only Approach

Audit log rows are never edited or deleted through the application.

- no update endpoint
- no delete endpoint
- events are inserted as immutable records
- detail views only read stored metadata

This keeps the trail stable and reviewable over time.
