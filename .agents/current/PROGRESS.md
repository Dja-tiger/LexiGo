# Current Task Progress

## 2026-08-13 14:09 +03:00 — pre-flight

### Verified

- `main` was `03b50fe78fb0f2280e8fe630931b6136df7d2717` when branch `feat/issue-25-custom-vocabulary-foundation` was created.
- Existing `user_words`, `review_events`, `lesson_session_items`, `lesson_review_idempotency`, `onboarding_diagnostic_items` and `answer_suggestions` references to `words(id)` use `on delete cascade`.
- New-user enrollment is source-scoped by `enroll_default_words_for_user()` to `hakui-technical-english-2020`; user-owned source `user-custom-v1` is therefore not inherited by later registrations.
- Existing lesson/due/review flows are already `user_words`-scoped, so no scheduler algorithm or lesson-composer change is required for an owner-enrolled custom word.

### Finding: shared catalog seed compatibility

Migration `000022_custom_words.up.sql` replaces the global expression unique index on `(lower(lemma), lower(translation))` with two partial indexes: one for shared rows and one owner-scoped index for private rows. `backend/internal/catalog/catalog.go` seeded shared entries with `on conflict (lower(lemma), lower(translation)) do update` and no index predicate.

PostgreSQL cannot infer a partial unique index from that conflict target without the matching predicate. `backend/internal/catalog/catalog.go` was therefore added as a verified downstream consumer before modification. Its upsert now declares `where owner_user_id is null`; source content and enrollment behavior are otherwise unchanged.

## 2026-08-13 — implementation and manual audit

### Implemented

- Migration `000022_custom_words.up.sql` adds nullable `words.owner_user_id`, shared/private partial unique indexes, an owner lookup index and a constraint limiting private rows to `kind = 'word'` with source `user-custom-v1`.
- Authenticated create persists `words` and `user_words` in one PostgreSQL transaction and returns the existing `UserWord` scheduler projection.
- Duplicate detection is concurrency-safe through `insert ... on conflict do nothing returning id`; uniqueness is case-insensitive within one owner while equivalent private terms remain legal for different owners.
- Validation collapses whitespace, preserves content casing/punctuation, rejects blank required fields, rejects unknown JSON fields and bounds the request body/fields.
- Authenticated catalog list/detail reads use a defense-in-depth predicate admitting only shared rows or private rows owned by the current account.
- Public catalog list/detail explicitly require `owner_user_id is null`.
- Owner-only delete returns the same 404 for missing/shared/other-owner rows to avoid ownership disclosure.
- Shared catalog seeding targets the shared partial unique index and remains compatible with private rows.
- OpenAPI 0.16.0 documents create/delete custom-word contracts and the bounded request schema; source-contract tests protect the route/schema shape.
- `docs/architecture.md` documents shared/private ownership, scheduler reuse, public projection and delete semantics.

### Finding: public metadata privacy boundary

`/api/v1/catalog/metadata` originally aggregated the full `words` table. After private rows were introduced, a user-created term would change public totals/topics and `catalogVersion` even though public list/detail correctly hid it.

Remediation: both metadata aggregate queries now require `owner_user_id is null`. Integration coverage snapshots public metadata before and after private custom-word creation and requires exact equality.

### Finding: deleting a word from an active lesson

The FK cascade graph makes physical private-word deletion referentially safe, but deleting a word that is still an item of an active lesson would remove the item while leaving the lesson itself `active`, with stale lesson-size/current-index semantics.

Remediation: owner-only delete now runs in a transaction, first updates an active lesson referencing that word to `discarded` and increments its optimistic version, then deletes the private word. Integration coverage proves `/api/v1/lessons/active` no longer returns that lesson and the persisted session is `discarded` with version +1.

## Validation evidence before final immutable head

### Passed

- Exact GitHub readback was performed after runtime/documentation writes and PR file patches were inspected for high-risk full-file replacements.
- OpenAPI full replacement was diff-audited: only version `0.15.0 -> 0.16.0`, two custom-word paths, `CreateCustomWordRequest`, and the required `Error.field` additions differ from base.
- Architecture full replacement was diff-audited: only the `Custom vocabulary ownership` section differs from base.
- CI run `31695812568` on earlier implementation head: PostgreSQL backend integration completed successfully with race detector; backend unit stopped only at formatting before static/unit execution.
- CI run `31696477317` after formatting remediation: `Verify formatting` and `Static analysis` completed successfully. The run was superseded/cancelled by a newer branch commit while longer jobs were executing, so it is not final evidence.
- Local `gofmt` was used only to canonicalize the integration test; repository CI remains the authoritative executable validator.

### Remediated failure

- First CI head failed `Verify formatting` because one Go map literal in `backend/integration/custom_words_test.go` was not canonical `gofmt`. No runtime assertion failed. The file was canonicalized and the next CI head passed formatting and `go vet`.

### Environment limitation

- A local repository clone is unavailable in the current execution container because github.com DNS resolution is unavailable. This does not block delivery because GitHub Actions provides the repository-owned Go/PostgreSQL/Redis validation environment.

## Current changed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `api/openapi.yaml`
- `docs/architecture.md`
- `backend/integration/custom_words_test.go`
- `backend/internal/catalog/catalog.go`
- `backend/internal/platform/migrate/migrations/000022_custom_words.up.sql`
- `backend/internal/server/server.go`
- `backend/internal/words/custom_http.go`
- `backend/internal/words/custom_openapi_contract_test.go`
- `backend/internal/words/custom_repository.go`
- `backend/internal/words/custom_word.go`
- `backend/internal/words/custom_word_test.go`
- `backend/internal/words/metadata.go`
- `backend/internal/words/repository.go`

`backend/internal/learning/lesson_composer.go` remained unchanged because the existing explicit/manual lesson and scheduler paths already consume current-user `user_words`.

## Final gate plan

1. Freeze the branch after `TASK.md`, `PROGRESS.md` and `EXECUTION.md` finalization and resolve the exact live head SHA.
2. Run/inspect full CI for that immutable head; no earlier/superseded run is sufficient.
3. Audit PR changed paths, reviews, comments and unresolved threads.
4. Mark PR #486 Ready only after immutable-head evidence is green.
5. Squash merge only if `main` has not diverged unexpectedly and review gates are clean.
6. Require exact-main CI on the merge SHA, then exact-SHA Stage deployment/public browser validation.
7. Reconcile durable Agent Harness memory after successful delivery; keep parent #25 open because frontend custom-vocabulary UX and pronunciation/listening UI remain outside this slice.
