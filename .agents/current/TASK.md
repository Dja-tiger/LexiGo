# Current Task

## Identity

- Issue: #481 `[Medium][Learning][#25 Phase 1] Persist listening as a distinct objective review mode`
- Parent: #25
- Branch: `feat/issue-481-listening-event-mode`
- Base SHA: `2b91949f42db36899a79bf2329b104f368127b14`
- PR: #482 (Draft until immutable-head acceptance is green)
- Pre-freeze product/test head: `1079aeb28360866b0f3e2e6260daef3ad6efb630`
- Final head: the atomic Agent Docs reconciliation commit that contains this file; resolve from the live branch ref and do not write after it.

## Objective

Persist `listening` as a first-class objective answer mode without changing scheduler formulas, lesson ranking, existing typed-recall semantics or UI. This slice is the backend/API/progress foundation for later listening UX.

## Scope

- Add `listening` to backend/frontend AnswerMode contracts and strict OpenAPI enums.
- Treat listening as objective for correctness and route it through the existing `ScheduleReview` path unchanged.
- Keep server-owned listening lesson composition due-only like recall/choice, with the same candidate ranking.
- Allow listening in `review_events.answer_mode` and `lesson_sessions.study_mode` through additive constraints only; never rewrite historical recall rows.
- Persist listening exactly and expose `modes.listening` plus listening contributions to objective/successful-today counters without double-counting all-event totals.
- Keep weekly typed-recall and retained-learning semantics unchanged.
- Preserve rolling-deploy compatibility: an older API response may omit `modes.listening`, while frontend normalization materializes a zero bucket.
- Add focused validation, scheduler, persistence, progress and integration coverage.

## Allowed paths

- `.agents/current/**`
- `api/openapi.yaml`
- `backend/integration/listening_review_mode_test.go`
- `backend/internal/learning/model.go`
- `backend/internal/learning/http.go`
- `backend/internal/learning/lesson_http.go`
- `backend/internal/learning/lesson_composer.go`
- `backend/internal/learning/scheduler.go`
- `backend/internal/learning/scheduler_test.go`
- `backend/internal/learning/listening_mode_test.go`
- `backend/internal/learning/listening_progress.go`
- `backend/internal/platform/migrate/migrations/000021_listening_answer_mode.up.sql`
- `frontend/lib/progress.ts`
- `frontend/lib/progress.test.ts`

## Prohibited paths

- listening/pronunciation UI, routes, components or CSS
- speech-player runtime/provider changes
- microphone, recording, scoring or media storage
- custom glossary work
- scheduler formulas/parameters or lesson ranking/weighting
- unrelated runtime, deployment configuration or secrets
- any CI/workflow change in the final PR diff

## Invariants

- omitted legacy `answerMode` still normalizes to typed `recall`;
- `study` remains the only non-objective mode;
- listening uses exactly the existing objective scheduler implementation;
- server-owned listening composer behavior is due-only without ranking changes;
- explicit `wordIds` remain the existing manual-selection path and intentionally bypass composer filtering;
- historical recall stays recall;
- `reviewsToday`/`reviewsTotal` already count all events and must not be incremented again by the listening extension;
- weekly recall/retained evidence remains typed-recall semantics;
- OpenAPI must parse as a complete YAML document and preserve repository structural contracts;
- frontend accepts old progress payloads without `modes.listening` during rolling deployment;
- the temporary exact-rewrite workflow used during implementation has been deleted and has zero net PR diff;
- after the final Agent Docs reconciliation commit, the branch is frozen until merge.

## Acceptance criteria

- `answerMode=listening` is accepted and persisted exactly as `listening`.
- Typed recall remains `recall`; migration rewrites no history.
- Listening schedules identically to the existing objective path.
- Lesson preview/create accept `studyMode=listening`; review enforces exact lesson mode and server-owned composer is due-only.
- Progress exposes `modes.listening`; objective/successful-today counters include listening without double counting.
- OpenAPI documents listening consistently, including moderation review context.
- Focused migration/unit/integration tests prove the contract.

## Required checks

- read-back and live `main` verification after the final write;
- final immutable-head full PR CI: backend format/static/unit/race/security/integration, frontend lint/typecheck/unit/build/audit, browser shards, Lesson completion, a11y, visual, performance, PWA/security/SW and container build gates;
- review/thread audit and clean compare against live `main`;
- Ready transition with unchanged head;
- expected-head squash merge;
- exact-merge `main` CI;
- exact-image Stage deploy, public endpoint smoke and public browser acceptance before closing #481.

## Pre-freeze evidence

- CI #3364 proved frontend core and the complete browser matrix green but exposed an invalid integration fixture: explicit `wordIds` are manual selection and therefore bypass composer filtering by design.
- CI #3365 on `1079aeb28360866b0f3e2e6260daef3ad6efb630` proved frontend core, backend unit/security and the corrected Postgres/Redis integration path green. The corrected integration test creates the listening lesson without `wordIds`, after making exactly one catalog item due.
- Live `main` remained `2b91949f42db36899a79bf2329b104f368127b14` and open parallel work is Dependabot-only with no selected-path overlap.

## Rollback

Revert the atomic #481 product PR. Because migration `000021` is constraint-only, historical rows are unchanged. If listening rows have already been persisted after deployment, keep the broadened DB constraints until those rows are intentionally handled even if application code is rolled back.
