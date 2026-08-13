# Current Task

## Identity

- Issue: #493 — `[Medium][Learning][#25 Phase 3] Add verifiable custom glossary import/export`
- Parent: #25
- Branch: `feat/issue-493-custom-glossary-import-export`
- Base SHA: `981c3d78b1907480d763fbad23d9f1608b9353e9`
- Head SHA: resolve from live branch ref after each write; immutable-head validation must use the final exact SHA.
- PR: #495 — `feat(words): add verifiable custom glossary import export`

## Objective

Add a bounded, versioned and owner-safe import/export contract for small private custom-word glossaries on top of the Phase 2 custom-word foundation without introducing a second scheduler or transporting historical SRS state.

## Scope

- deterministic JSON schema `lexigo-custom-glossary-v1`;
- authenticated export of the current account's private custom words only;
- bounded merge import with at most 100 items and a strict body limit;
- reuse of `NormalizeCustomWordRequest` for every imported item;
- deterministic duplicate handling inside the payload and against existing owner content;
- atomic creation + enrollment of imported items through the existing `words` + `user_words` path;
- explicit created/skipped import result;
- OpenAPI and PostgreSQL integration coverage for round-trip, duplicate behavior, owner isolation and scheduler enrollment.

## Non-goals

- frontend import/export UI;
- CSV/XLSX support;
- custom phrase creation;
- importing or exporting review history, due dates, easiness, repetitions or lesson state;
- scheduler formula/ranking changes;
- microphone, pronunciation recording or audio-provider changes;
- Figma changes.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `backend/internal/words/**`
- `backend/internal/server/server.go`
- `backend/integration/custom_glossary_test.go`
- `api/openapi.yaml`
- `docs/architecture.md` only if the public architecture contract needs clarification

## Prohibited paths

- `frontend/**`
- Figma/design artifacts
- deployment workflows/configuration
- database migrations unless a verified persistence gap is discovered
- scheduler formula constants/ranking policy
- unrelated dependencies or maintenance changes

## Runtime owners

- `backend/internal/words`: glossary validation, owner-scoped export/import and persistence.
- `backend/internal/server/server.go`: authenticated route registration.
- PostgreSQL `words` + `user_words`: private content identity and existing scheduler enrollment.

## Documentation owners

- `api/openapi.yaml`
- `.agents/current/**`
- `docs/architecture.md` only if required by the resulting contract

## Invariants

- Export never returns shared catalog rows or another account's private rows.
- Import never mutates shared catalog rows.
- Imported words use `source = 'user-custom-v1'`, `kind = 'word'` and `owner_user_id = authenticated user`.
- Scheduler state is initialized only through existing `user_words` defaults; glossary files never carry SRS history.
- Every imported item uses the same normalization and field limits as single custom-word creation.
- Unsupported schema versions and invalid fields fail before persistence.
- Duplicate handling is deterministic and cannot create parallel copies for the same owner.
- Errors and result payloads do not expose another user's private vocabulary.

## Acceptance criteria

See Issue #493. Required evidence covers deterministic export, bounded/versioned import, shared normalization, payload/existing duplicates, scheduler enrollment, cross-account isolation and export-delete-import round-trip without SRS-history restoration.

## Required checks

- Go formatting/static/unit/race gates selected by CI.
- Focused unit tests for glossary normalization/deduplication.
- PostgreSQL integration tests for export/import, owner isolation and scheduler state.
- OpenAPI structural/source contracts.
- Full immutable-head required CI.
- Review/thread audit before Ready.

## Risks

- Batch import can partially persist if validation or duplicate handling is mixed into per-row commits.
- Export can accidentally include shared catalog rows if it reuses broad authenticated catalog queries.
- Re-importing an exported glossary must not duplicate rows or restore stale SRS fields.
- Database duplicate races must resolve deterministically without leaking ownership information.
- Request-size/item-count limits must be enforced before expensive persistence work.

## Tool-selection recovery

During pre-flight an intended Issue-create action was accidentally sent to `create_pull_request` with an invalid head. GitHub returned HTTP 422; no ref, PR or repository artifact was created. `main` was immediately re-verified at `981c3d78b1907480d763fbad23d9f1608b9353e9`, `.agents/AGENTS.tool-selection.md` was re-read, and the exact `create_issue` and `create_branch` schemas were reloaded before continuing.

## Rollback

Revert this slice. It adds no migration and does not transform existing private/shared vocabulary or scheduler history; existing single custom-word create/delete behavior remains independently usable.
