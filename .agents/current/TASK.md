# Current Task

## Identity

- Issue: #485 — `[Medium][Learning][#25 Phase 2] Add private custom-word ownership and scheduler enrollment`
- Parent: #25
- Branch: `feat/issue-25-custom-vocabulary-foundation`
- Base SHA: `03b50fe78fb0f2280e8fe630931b6136df7d2717`
- Head SHA: resolve from the live branch ref after harness finalization; immutable-head validation must use that exact SHA.
- PR: #486 — `feat(words): add private custom vocabulary foundation`

## Objective

Add the backend/API foundation for private custom words without creating a second scheduler: owner-scoped `words` rows must enroll atomically into the existing `user_words` path, participate in existing due/lesson/review behavior, and remain invisible to public/other-account reads.

## Scope

- nullable owner identity on `words`, with existing rows remaining shared catalog content;
- owner-scoped uniqueness and bounded custom-word validation;
- authenticated create/delete custom-word endpoints;
- atomic create + scheduler enrollment;
- public/authenticated/lesson ownership guards;
- shared catalog seed compatibility with the new partial uniqueness boundary;
- public metadata isolation from private vocabulary;
- active-lesson consistency when an owner deletes a private word;
- OpenAPI and PostgreSQL integration coverage;
- architecture documentation only where backend ownership changes.

## Non-goals

- custom phrase creation;
- frontend or Figma work;
- glossary bulk import/export;
- microphone, pronunciation recording or listening-first UI;
- scheduler formula/ranking changes;
- mutation of shared catalog rows.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `backend/internal/platform/migrate/migrations/000022_custom_words.up.sql`
- `backend/internal/words/**`
- `backend/internal/catalog/catalog.go`
- `backend/internal/learning/lesson_composer.go`
- `backend/internal/server/server.go`
- `backend/integration/custom_words_test.go`
- `api/openapi.yaml`
- `docs/architecture.md`

`backend/internal/catalog/catalog.go` was added after the verified partial-index downstream-consumer finding recorded in `PROGRESS.md`; its allowed change is limited to conflict-target compatibility for shared catalog seeding.

Additional paths require a verified downstream-consumer finding recorded in `PROGRESS.md` before modification.

## Prohibited paths

- `frontend/**`
- Figma/design artifacts
- deployment workflows/configuration
- scheduler formula constants or ranking policy
- unrelated dependencies or maintenance changes

## Runtime owners

- `backend/internal/words`: custom-word validation, persistence, authenticated/public catalog boundaries and public metadata projection.
- `backend/internal/catalog/catalog.go`: shared catalog seed upsert; may only target the shared partial unique index introduced by this slice.
- `backend/internal/learning`: existing lesson/review scheduler; no algorithm change is required because private words enter through `user_words`.
- `backend/internal/server/server.go`: authenticated HTTP route registration.
- PostgreSQL `words` + `user_words`: catalog identity and scheduler state.

## Documentation owners

- `api/openapi.yaml`
- `docs/architecture.md`
- `.agents/current/**`

## Invariants

- Shared catalog rows have no owner and retain current enrollment/uniqueness behavior.
- Owner-scoped rows are never returned by public catalog list/detail/metadata endpoints.
- A custom word is enrolled only for its owner; another account cannot read/delete it.
- Create is transactional: `words` and `user_words` cannot be left half-written.
- Existing `user_words`, lesson and review scheduler semantics are reused unchanged.
- Delete cannot remove a shared catalog word or another user's custom word.
- Deleting a private word referenced by the owner's active lesson must discard that lesson before cascade removal of its item row.
- Different users may independently own the same normalized custom lemma/translation.
- Shared catalog seeding must continue to upsert only shared rows after uniqueness becomes partial.
- No historical shared catalog row is rewritten as private content.

## Acceptance criteria

See Issue #485. Required evidence covers create/enrollment, scheduler participation, public/other-user isolation, validation/duplicates, safe delete, active-lesson consistency, public metadata isolation and shared-catalog regression protection.

## Required checks

- Go formatting/static/unit/race gates selected by CI.
- PostgreSQL migration/integration tests including clean-schema behavior, seed compatibility, ownership isolation and cascade behavior.
- OpenAPI YAML structural/source contracts.
- Full immutable-head required CI.
- Review/thread audit before Ready.
- Post-merge exact-main CI and exact-SHA Stage/public validation.

## Risks

- Existing global `words` uniqueness index can accidentally prevent the same custom term across different accounts.
- Public catalog SQL/metadata historically assumed every `words` row was shared.
- Broad catalog-enrollment jobs/triggers must never enroll owner rows for other users.
- Partial unique indexes require the shared catalog seed upsert to declare the matching `owner_user_id is null` predicate.
- Cascading word deletion may invalidate an active lesson unless session state is resolved before the delete.
- Existing queries that join `user_words` to `words` require defense-in-depth owner predicates at catalog read boundaries.

## Rollback

Revert the product commit before any custom rows are relied on. The additive owner column/index migration is designed so existing rows remain shared; no existing learning history is transformed by this slice.
