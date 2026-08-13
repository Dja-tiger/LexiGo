# Current Task

## Identity

- Issue: #489 — `[Medium][Learning][#25 Phase 3] Add bounded custom glossary import/export`
- Parent: #25
- Branch: `feat/issue-489-custom-glossary-import-export`
- Base SHA: `981c3d78b1907480d763fbad23d9f1608b9353e9`
- Head SHA: resolve from live branch ref after each write
- PR: not opened yet

## Objective

Add authenticated versioned JSON import/export for a bounded private custom-word glossary while reusing the Phase 2 owner-scoped `words` + `user_words` scheduler path. Export is portable content only; import is all-or-nothing and creates fresh scheduler enrollment for every imported item.

## Scope

- `GET /api/v1/words/custom/export` with deterministic version-1 portable content;
- `POST /api/v1/words/custom/import` with bounded version-1 batch input;
- complete-request normalization and validation using the existing custom-word rules;
- duplicate detection inside one payload and against existing current-owner custom words;
- one PostgreSQL transaction for complete batch import + exactly-one `user_words` enrollment per item;
- deterministic owner-only export ordering;
- OpenAPI/source/unit/PostgreSQL integration contracts;
- architecture documentation limited to import/export ownership and atomicity.

## Non-goals

- custom phrases;
- CSV/XLSX or arbitrary multipart file upload;
- frontend/Figma UI;
- overwrite/merge mutation of existing custom words;
- importing IDs, scheduler state, due timestamps or review history;
- scheduler formula/ranking changes;
- microphone/pronunciation/listening-first UI.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `backend/internal/words/**`
- `backend/internal/server/server.go`
- `backend/integration/custom_glossary_test.go`
- `api/openapi.yaml`
- `docs/architecture.md`

Additional paths require a verified downstream-consumer finding recorded in `PROGRESS.md` before modification.

## Prohibited paths

- `frontend/**`
- Figma/design files
- deployment/CI workflows
- migrations unless a schema change is proven necessary
- scheduler formulas/ranking
- unrelated dependencies/maintenance.

## Runtime owners

- `backend/internal/words/custom_word.go`: shared custom-word normalization and field bounds.
- `backend/internal/words/custom_repository.go`: owner-scoped custom-word persistence and scheduler enrollment.
- `backend/internal/words/custom_http.go`: authenticated custom-word HTTP boundary.
- `backend/internal/server/server.go`: route registration.
- PostgreSQL `words.owner_user_id` + private partial unique index from migration `000022_custom_words`.

## Documentation owners

- `api/openapi.yaml`
- `docs/architecture.md`
- `.agents/current/**`

## Invariants

- shared catalog rows are never exported/import-mutated;
- another account's private rows are never visible or conflict with the current account;
- export never exposes IDs, owner identity, SRS/due/review state;
- import uses existing field normalization/limits and creates no parallel scheduler;
- one failing item rolls back the complete import;
- no existing custom word is overwritten;
- round-trip preserves portable content but intentionally resets scheduler state by creating new rows.

## Acceptance criteria

Use all ten acceptance criteria from Issue #489 without weakening bounds, ownership or atomicity.

## Required checks

- focused Go unit/source-contract tests;
- OpenAPI structural parse/contract checks;
- PostgreSQL integration coverage for ownership, empty export, bounds, intra-payload duplicate, existing-owner conflict rollback, different-owner independence, scheduler enrollment and export-delete-import round-trip;
- full immutable-head repository CI;
- review/thread/diff audit;
- guarded squash merge;
- exact-main CI and exact-SHA Stage/public validation.

## Risks

- accidental partial import when a later item conflicts;
- leaking scheduler/account internals in export;
- route ambiguity with `/api/v1/words/custom/{wordID}`;
- inconsistent normalization between single create and batch import;
- excessive request/item counts causing avoidable DB/resource pressure.

## Rollback

Revert the Phase 3 PR. No migration is planned; Phase 2 single-create/delete behavior remains intact.
