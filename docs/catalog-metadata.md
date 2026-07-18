# Catalog metadata

`GET /api/v1/catalog/metadata` is the public source of truth for product catalog counters. It is available without authentication because Home, Learning, Phrases and Dictionary render before a user signs in.

The repository reads totals and topic aggregates inside one read-only repeatable-read PostgreSQL snapshot. The response includes:

- total items, words and phrases;
- counts for the supported lesson sources and collections;
- dynamic topic totals;
- `updatedAt` from the newest catalog row;
- `catalogVersion`, a SHA-256 digest of the complete aggregate snapshot.

The HTTP handler exposes `catalogVersion` as an `ETag`, supports weak and strong `If-None-Match` values and returns `304 Not Modified` when the catalog has not changed. Clients must show a loading state or an explicit unavailable state. Embedded catalog lengths and historical numeric constants must not be used as fallback totals.

Catalog seeding updates persisted rows only when catalog-owned fields actually change. Repeating an identical seed therefore preserves `updatedAt`, `catalogVersion` and the HTTP `ETag` across API restarts.

Adding or updating rows in `words` changes the metadata response automatically. User progress remains user-specific; catalog capacity always comes from this endpoint.
