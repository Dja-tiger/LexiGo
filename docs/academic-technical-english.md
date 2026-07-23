# Academic Technical English lesson source

The stable product/API identifier is `academic-technical-english`. It maps server-side to the curated catalog source `hakui-technical-english-2020`; filtering must never depend on the Russian UI label or mutable topic copy.

The embedded catalog contains 579 word items. Catalog metadata exposes the authoritative count as `sources.academicTechnicalEnglish`, and that count participates in `catalogVersion`/ETag generation.

Lesson preview, creation, active-session hydration and next-block continuation preserve the stable source identifier. Explicit mixed mode does not imply the academic-only collection, and the academic source must not fall back to Data Engineering, Backend or another topic when empty.

Verification layers:

- unit tests for source validation, metadata versioning, payload validation and client filtering;
- PostgreSQL integration tests for metadata count and selected word source;
- Playwright regression for selection, count display, lesson creation and next-block source persistence.
