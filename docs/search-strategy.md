# Search Strategy

## Current Search Architecture

Phase 8 uses PostgreSQL metadata search and full-text search. The search module is intentionally separated behind `ISearchService` so a later semantic or AI retrieval layer can be added without breaking the HTTP contract or frontend module.

Current backend responsibilities:

- filter documents by structured metadata stored in PostgreSQL
- run keyword and full-text search on title, description, and category
- paginate results
- enrich results with current version number and signature summary for the current version

## Endpoint Contract

`GET /api/search/documents`

Supported query parameters:

- `query`
- `category`
- `status`
- `owner`
- `controller`
- `signer`
- `archived`
- `page`
- `pageSize`

The response is a paged result:

- `items`
- `page`
- `pageSize`
- `totalCount`

Each document item includes:

- core document metadata
- category
- owner/controller display data
- current version number
- signature summary counts

## PostgreSQL Strategy

The current implementation combines:

- `ILIKE` matching for flexible metadata filtering
- `to_tsvector` and `plainto_tsquery` for initial full-text search
- standard indexes on status/category/owner/controller
- a GIN index on the combined search vector expression for document text search

This gives a practical enterprise baseline without introducing a separate search engine.

## Extension Path

Future AI or semantic search can be added by:

1. introducing a new retrieval service behind the existing search contract
2. merging ranked semantic results with PostgreSQL filters
3. preserving the same frontend route and filter model

This keeps the current module stable while allowing later search expansion.
