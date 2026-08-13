# Current Task Progress

## 2026-08-13 14:09 +03:00

### Verified

- `main` remained `03b50fe78fb0f2280e8fe630931b6136df7d2717` through the implementation writes completed so far.
- Branch `feat/issue-25-custom-vocabulary-foundation` was created from that exact base before repository writes.
- Existing `user_words`, `review_events`, `lesson_session_items`, `lesson_review_idempotency`, `onboarding_diagnostic_items` and `answer_suggestions` references to `words(id)` use `on delete cascade`.
- New-user enrollment is source-scoped by `enroll_default_words_for_user()` to `hakui-technical-english-2020`; user-owned source `user-custom-v1` is therefore not inherited by later registrations.
- Existing lesson/due/review flows are already `user_words`-scoped, so no scheduler algorithm or lesson-composer change is required for an owner-enrolled custom word.

### Finding

Migration `000022_custom_words.up.sql` replaces the global expression unique index on `(lower(lemma), lower(translation))` with two partial indexes: one for shared rows and one owner-scoped index for private rows. `backend/internal/catalog/catalog.go` currently seeds shared catalog entries with `on conflict (lower(lemma), lower(translation)) do update` and no index predicate.

### Root cause

PostgreSQL cannot infer a partial unique index from an `on conflict` target unless the matching predicate is present. Leaving `catalog.Seed()` unchanged would make clean/incremental environments fail after migration 000022 even though custom-word CRUD itself is correct.

### Scope expansion

`backend/internal/catalog/catalog.go` is now required as a verified downstream consumer. The seed upsert must target only the shared-content unique index using `where owner_user_id is null`. No other catalog behavior changes are permitted.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `backend/internal/platform/migrate/migrations/000022_custom_words.up.sql`
- `backend/internal/words/repository.go`
- `backend/internal/words/custom_word.go`
- `backend/internal/words/custom_repository.go`
- `backend/internal/words/custom_http.go`
- `backend/internal/words/custom_word_test.go`
- `backend/internal/server/server.go`

### Checks passed

- Exact GitHub readback completed after each runtime/harness write performed so far.
- Branch/base comparison confirmed the work is isolated from `main`.
- Static dependency audit confirmed private rows are excluded from new-user default enrollment by source.
- FK audit confirmed owner-only deletion can rely on the existing cascade graph.

### Checks failed

- Local clone/execution unavailable in the current container because github.com DNS resolution is unavailable. Executable validation will use repository CI on the immutable branch head.

### Current branch head

Resolve from the live branch ref before CI/PR gating; latest known write commit before this progress update was `5873382b4ece229b72a3ad0bb52e88a819999802` plus the server route commit `97e2f72a1f224a2b70e897657305f281f045c7e6`.

### Next action

1. Expand `TASK.md` allowed paths with `backend/internal/catalog/catalog.go` based on the recorded finding.
2. Make the partial-index-compatible shared catalog upsert change.
3. Add PostgreSQL integration coverage for owner isolation, scoped duplicates, due/lesson/review participation and cascade deletion.
4. Update OpenAPI/architecture, run immutable-head CI, then perform review/merge/stage gates.
