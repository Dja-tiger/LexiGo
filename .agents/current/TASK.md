# Current Task

## Identity

- Issue: #481 `[Medium][Learning][#25 Phase 1] Persist listening as a distinct objective review mode`
- Parent: #25
- Branch: `feat/issue-481-listening-event-mode`
- Base SHA: `2b91949f42db36899a79bf2329b104f368127b14`
- PR: #482 (Draft)
- Head SHA: resolve from live branch ref after every write

## Objective

Persist `listening` as a first-class objective answer mode without changing scheduler formulas, lesson ranking, existing typed-recall semantics or UI. The slice is the backend/API/progress foundation for later listening UX.

## Scope

- Add `listening` to backend/frontend AnswerMode contracts and strict OpenAPI enums.
- Treat listening as objective for correctness and route it through the existing `ScheduleReview` path unchanged.
- Keep listening lesson composition due-only like recall/choice, with the same candidate ranking.
- Allow listening in `review_events.answer_mode` and `lesson_sessions.study_mode` through additive constraints only; never rewrite historical recall rows.
- Persist listening exactly and expose `modes.listening` plus listening contributions to objective/successful-today counters without double-counting all-event totals.
- Keep weekly recall/retained-learning semantics unchanged.
- Add focused scheduler, validation, migration, persistence and progress tests.

## Allowed paths

- `.agents/current/**`
- `backend/internal/learning/model.go`
- `backend/internal/learning/http.go`
- `backend/internal/learning/lesson_http.go`
- `backend/internal/learning/scheduler.go`
- `backend/internal/learning/scheduler_test.go`
- `backend/internal/learning/lesson_composer.go`
- `backend/internal/learning/lesson_composer_test.go`
- focused `backend/internal/learning/*_test.go`
- focused new progress owner under `backend/internal/learning/**`
- `backend/internal/platform/migrate/migrations/000021_listening_answer_mode.up.sql`
- focused migration/integration tests required by repository conventions
- `frontend/lib/progress.ts`
- `frontend/lib/progress.test.ts`
- `api/openapi.yaml`
- existing focused OpenAPI contract tests if required
- `.github/workflows/apply-issue-481-contract.yml` **temporarily only** as controlled exact-rewrite plumbing for large files; it must have zero final PR diff before immutable-head CI

## Prohibited paths

- listening/pronunciation UI, routes, components or CSS
- speech-player runtime/provider changes
- microphone, recording, scoring or media storage
- custom glossary work
- scheduler formulas/parameters or lesson ranking/weighting
- unrelated runtime, deployment configuration or secrets
- any persistent CI/workflow change; the temporary helper above must be deleted before final acceptance

## Invariants

- omitted legacy `answerMode` still normalizes to typed `recall`;
- `study` remains the only non-objective mode;
- listening uses exactly the existing objective scheduler implementation;
- listening composer behavior is due-only without ranking changes;
- historical recall stays recall;
- `reviewsToday`/`reviewsTotal` already count all events and must not be incremented again by the listening extension;
- weekly recall/retained evidence remains typed-recall semantics;
- OpenAPI must parse as a complete YAML document and preserve column-zero `$ref` structure;
- temporary rewrite helper must assert exact source-match counts and disappear from the final diff.

## Acceptance criteria

- `answerMode=listening` is accepted and persisted exactly as `listening`.
- Typed recall remains `recall`; migration rewrites no history.
- Listening schedules identically to the existing objective path.
- Lesson preview/create accept `studyMode=listening`; review enforces exact lesson mode and composer is due-only.
- Progress exposes `modes.listening`; objective/successful-today counters include listening without double counting.
- OpenAPI documents listening consistently, including moderation review context if listening suggestions are returned.
- Focused migration/unit/integration tests prove the contract.

## Required checks

- read-back and `main` verification after writes;
- backend format/vet/unit/race + integration/migrations;
- frontend lint/typecheck/unit;
- whole-file OpenAPI YAML parse and existing structural contract checks;
- immutable-head full PR CI after helper deletion and write freeze;
- review/thread audit + clean compare;
- Ready → expected-head squash merge → exact-main CI → exact-image Stage/public acceptance before closing #481.

## Rollback

Revert the atomic #481 product PR. Because the migration is constraint-only, historical data is unchanged. If listening rows exist after deployment, preserve the broadened DB constraint until those rows are intentionally handled even if application code is rolled back.