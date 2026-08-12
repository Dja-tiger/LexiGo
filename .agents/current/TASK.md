# Current Task

## Identity

- Issue: #481 `[Medium][Learning][#25 Phase 1] Persist listening as a distinct objective review mode`
- Parent: #25 `[Medium][Feature] Добавить pronunciation/listening и пользовательскую терминологию`
- Branch: `feat/issue-481-listening-event-mode`
- Base SHA: `2b91949f42db36899a79bf2329b104f368127b14`
- Head SHA: resolve from live branch ref after each write
- PR: create as Draft after the first coherent implementation slice

## Objective

Introduce `listening` as a first-class persisted objective answer mode so future listening-first exercises cannot be misclassified as typed `recall`. Preserve the existing objective scheduler behavior and expose listening evidence separately through the API/progress contract.

## Scope

- Add `listening` to backend and frontend `AnswerMode` contracts.
- Treat `listening` as objective for request validation and correctness semantics.
- Route `listening` through the existing objective scheduler path without changing easiness, interval, grade or due formulas.
- Keep listening lesson composition on the existing objective/due-only path used by recall/choice; do not alter candidate ranking or weighting.
- Allow `listening` in `lesson_sessions.study_mode` and `review_events.answer_mode` through an additive migration; do not rewrite historical events.
- Persist `answer_mode='listening'` exactly for direct and lesson review writes.
- Expose a separate `modes.listening` progress bucket.
- Include listening attempts/successes in aggregate objective-today counters while keeping typed recall-specific weekly/retained evidence semantics unchanged in this slice.
- Update strict OpenAPI enums/contracts everywhere `AnswerMode` / `studyMode` is accepted or returned.
- Add focused unit, migration/contract and integration coverage for validation, scheduler equivalence, persistence and progress aggregation.

## Non-goals

- No listening-first or pronunciation UI.
- No microphone, recording, pronunciation scoring, media upload or audio-storage decision.
- No rewrite of the speech player delivered by Issue #51 and no audio-provider change.
- No custom glossary CRUD/import/export from the remaining parent #25 scope.
- No scheduler algorithm or parameter changes.
- No conversion/reinterpretation of historical `recall` events as `listening`.
- No change to weekly typed-recall evidence, retained-learning evidence or recommendation ranking in this phase.

## Allowed paths

- `.agents/current/**`
- `backend/internal/learning/model.go`
- `backend/internal/learning/http.go`
- `backend/internal/learning/lesson_http.go`
- `backend/internal/learning/scheduler.go`
- `backend/internal/learning/lesson_composer.go`
- `backend/internal/learning/lesson_composer_test.go`
- existing focused `backend/internal/learning/*_test.go`
- a focused progress extension owner under `backend/internal/learning/**` if it avoids unsafe broad edits while preserving current Progress semantics
- `backend/internal/platform/migrate/migrations/000021_listening_answer_mode.up.sql`
- matching migration/contract tests required by repository conventions
- focused `backend/integration/**` tests for exact persistence/progress evidence
- `frontend/lib/progress.ts`
- focused `frontend/lib/progress.test.ts`
- `api/openapi.yaml`
- existing OpenAPI contract tests only when required to keep the strict contract synchronized

## Prohibited paths

- frontend presentation/components/CSS/routes for a listening UI
- `frontend/components/speech-player-button.tsx`, `frontend/lib/speech-player.ts` and speech-player styling/runtime
- microphone/media APIs, permissions UI or storage
- scheduler formulas, interval/easiness constants or lesson candidate ranking/weighting algorithms
- unrelated catalog/profile/scenario/PWA/CSP runtime
- deployment workflows, secrets or production configuration
- broad compatibility/refactor work unrelated to #481

## Runtime owners

- `learning.AnswerMode`: canonical persisted exercise-mode vocabulary.
- `normalizeAndValidateReviewRequest` / lesson configuration validation: API boundary for allowed modes and objective/study semantics.
- `ScheduleAttempt`: mode-to-existing-scheduling-policy dispatch only; objective formulas stay in `ScheduleReview` unchanged.
- `queryLessonCandidates`: existing objective/due-only lesson composition boundary; listening joins recall/choice without changing ranking.
- `review_events.answer_mode`: immutable historical exercise-mode evidence.
- `lesson_sessions.study_mode`: active lesson mode contract and review-mode matching owner.
- `ProgressSummary.Modes`: per-mode aggregate evidence; `Listening` is added as a separate bucket.
- Existing speech player remains playback-only and does not become the persistence owner in this slice.

## Documentation owners

- `api/openapi.yaml`: public API source of truth for AnswerMode enums.
- `.agents/current/**`: active slice memory only.
- Parent Issue #25 remains the source for later UI/microphone/custom-terminology phases.

## Invariants

- Omitted legacy `answerMode` continues to normalize to typed `recall`; compatibility behavior is unchanged.
- `study` remains the only non-objective mode and still requires revealed-answer semantics with no objective answer.
- `listening` is objective and must follow the same correctness assessment rules as existing objective modes.
- Listening uses the exact existing `ScheduleReview` path; no copied or divergent scheduler implementation.
- Listening composition is due-only like recall/choice and reuses the same candidate ranking unchanged.
- Historical `recall` rows remain `recall`; migration changes constraints only.
- `reviewsToday` / `reviewsTotal` remain counts of all persisted events; listening must not be double-counted when objective aggregates are extended.
- Weekly recall/retained-learning metrics remain typed-recall semantics in this phase unless a separate approved Issue changes that product definition.
- OpenAPI must remain structurally valid as a whole; fragment-presence checks alone are insufficient.

## Acceptance criteria

- `answerMode=listening` is accepted and persisted exactly as `listening`.
- Typed recall continues to persist as `recall`; no migration rewrites history.
- Listening schedules identically to the existing objective path for the same review state/rating.
- Lesson creation/preview may use `studyMode=listening`; lesson review still enforces exact session mode matching and composer remains due-only.
- Progress exposes `modes.listening`, and aggregate objective-today attempts/successes include listening.
- OpenAPI documents `listening` consistently at every relevant request/response enum.
- Focused migration/unit/integration tests prove constraints, validation, persistence and aggregation.

## Required checks

- Agent Harness validation after active-memory writes.
- Backend format/vet/unit/race and focused scheduler/HTTP/composer tests.
- Migration validation and backend integration with exact persisted `answer_mode` evidence.
- Full OpenAPI YAML parse plus existing OpenAPI contract tests, including column-zero `$ref` protection.
- Frontend lint/typecheck/unit for the shared progress contract.
- Immutable-head full PR CI after all writes are frozen.
- Review/thread audit and branch-vs-main compare before Ready.
- Expected-head squash merge, exact-SHA `main` CI, then exact-image Stage/public smoke/browser acceptance before closing #481.

## Risks

- Accidentally treating listening as study and losing objective correctness.
- Accidentally widening weekly retained-learning semantics merely because listening is objective.
- Double-counting listening in total review counters when augmenting objective progress evidence.
- Allowing DB/API enum drift where one layer accepts `listening` and another rejects it.
- Broad-edit collateral changes in large repository/OpenAPI files.

## Rollback

Revert the atomic #481 PR. The migration is constraint-only and does not rewrite historical review events; rollback can restore the previous allowed-mode constraints as long as no listening events have been produced after deployment. If listening data exists, application rollback must preserve the broadened DB constraint until those rows are intentionally handled.