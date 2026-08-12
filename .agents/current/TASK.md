# Current Task

## Identity

- Issue: #73 `[Medium][Retention] Улучшить завершение урока и рекомендовать следующий шаг`
- Branch: `feat/issue-73-outcome-summary`
- Base SHA: `ca0a8a57628fdd36d5cc93c1bb59a4b4c099fbfa`
- Head SHA: resolve from live branch ref after each write
- PR: #477 (Draft)

## Objective

Turn the existing canonical Lesson Result into an outcome-oriented retention surface without creating a second progress model. The result must be derived from persisted lesson reviews and server-owned progress evidence, keep objective correctness separate from self-rating/activity, show the next review time honestly, and recommend one primary next action from current scheduler/goal state.

## Scope

- Reuse `LexigoActiveLessonApp` and `LessonResultPresentation`; no new route or result application root.
- Persist the server-backed completion snapshot needed for reload/history restoration, including `nextDueAt`, current daily-goal evidence, objective daily counters and streak context where available.
- Count objective Lesson Result attempts only when the server supplied objective correctness; restored/self-rated items with unknown correctness remain activity, not invented objective evidence.
- Present complete, partial, study-only, skipped and sync-pending completion states truthfully.
- Show what is due now and/or the nearest server-provided review timestamp using browser-local calendar formatting; do not approximate calendar/due state with fixed durations.
- Select one primary continuation from existing scheduler/preview/goal evidence: due/weak review when immediately actionable, another distinct block while the daily goal remains, or return later/home when the useful work is complete.
- Preserve one-time daily-goal celebration and existing reduced-motion behavior without inflating daily goal or streak locally.
- Add retention measurement for completion-to-next-action and return-to-next-session using durable existing owners where possible; any new analytics contract must have producer, persistence, validation and tests in the same slice.
- Add unit/source/browser coverage for persisted evidence, partial restoration, next review timing, personalized CTA and analytics semantics.

## Non-goals

- No spaced-repetition algorithm change or client-owned due-date calculation.
- No redesign of the Figma-owned Lesson Result composition or blind visual baseline replacement.
- No new parallel progress/session store in localStorage.
- No First Use/onboarding work from Issue #201/#18.
- No CSP production-enforcement work from Issue #78.
- No unrelated route-island extraction or compatibility cleanup.
- No physical-device-only acceptance substitution.

## Allowed paths

- `.agents/current/**`
- `.agents/PROJECT_STATE.md` only for verified Issue #72 post-delivery reconciliation and later Issue #73 delivered evidence
- `docs/architecture.md` only if the durable Lesson Result/retention measurement boundary changes
- `api/openapi.yaml` only if a new server analytics contract is required
- `backend/internal/learning/lesson_result_retention.go` and its focused tests for the authenticated first-result-action contract
- `backend/internal/server/server.go` only for the Issue #73 authenticated route registration
- `backend/internal/platform/migrate/migrations/**` only if a durable analytics schema is objectively required
- `backend/integration/**` only for Issue #73 analytics/persistence evidence if required
- `frontend/lib/lesson-result.ts`
- `frontend/lib/lesson-result.test.ts`
- `frontend/lib/product-journey.ts` and focused tests only for Issue #73 analytics intent/event ownership
- `frontend/components/lexigo-active-lesson-app.tsx`
- `frontend/components/lesson-result-presentation.tsx`
- `frontend/app/lesson-result.css` only if the existing Figma composition needs a minimal state-safe style correction; no redesign
- focused `frontend/**/*.test.*`, `frontend/e2e/lesson-result.spec.ts`, `frontend/e2e/support/lesson-result-fixture.ts` and authoritative collection/source-contract files required by changed behavior

## Prohibited paths

- review/scheduler algorithm changes outside evidence consumption
- unrelated catalog/profile/scenario runtime
- broad global CSS or design-system refactors
- deployment secrets, credentials or production-only enforcement
- visual baseline updates without exact Linux artifact provenance and manual Figma comparison

## Runtime owners

- `LexigoActiveLessonApp`: persisted review completion, progress refresh, snapshot creation and continuation actions.
- `frontend/lib/lesson-result.ts`: versioned completion evidence, validation, persistence and continuation policy.
- `LessonResultPresentation`: Figma-backed outcome copy, evidence separation, nearest-review context and primary CTA presentation.
- `learning.Repository.Progress`: authoritative `nextDueAt`, daily-goal/streak and objective aggregate evidence; frontend must consume rather than recompute it.
- `learning.RecordLessonResultAction`: authenticated, idempotent persistence of the first action selected from a completed Lesson Result; it does not mutate lesson/progress state.
- `lesson_result_retention` SQL view: analytics boundary derived from completed `lesson_sessions`, first result action and the next later lesson session for the same authenticated user.

## Contract matrix

- Direct entry/reload/history: a recent versioned result snapshot restores without resubmitting a review; stale/malformed snapshots fail closed.
- Auth: Lesson Result remains authenticated because persisted lesson/review/progress owners are authenticated.
- Objective evidence: recall/choice attempts count only server-known `correct=true|false`; `correct=null` is explicitly unavailable, never treated as a failed/successful objective attempt.
- Self-rating: `known/almost/again` is displayed as confidence/activity context and is never converted into objective accuracy.
- Study mode: saved exposure is activity with explicit absence of objective checking.
- Partial restore: saved reviews with unavailable historical correctness are shown as partial objective evidence rather than invented accuracy.
- Skipped/empty: skipped or zero-evidence states receive explicit truthful copy and do not claim mastery.
- Due timing: `nextDueAt` is consumed as an absolute server timestamp and formatted in the browser locale/timezone; no `now()-N` bucket approximation.
- Daily goal/streak: values come from refreshed progress. Client code may detect a before/after goal crossing but cannot increment counters or streak.
- Continuation: sync safety and one-time goal milestone remain higher priority; otherwise immediately due review can become the useful next action, then a distinct next block while additional work is appropriate, then return/home.
- Retention action: only a completed lesson owned by the authenticated user can accept a result-action event; the first selected action wins and repeated submissions are idempotent.
- Retention metrics: completion-to-action is measured from `lesson_sessions.completed_at` to first result action; return-to-next-session is measured to the next later `lesson_sessions.created_at` for the same user. No anonymous route event is used as user retention identity.
- Browsers/layout: desktop Chromium/WebKit and compact Android/iOS preserve one primary plus one secondary action, 200% reflow, keyboard semantics, axe and reduced-motion contract.
- Visual: canonical nodes are Issue #194 Figma `217:5`–`217:14`; node `217:5` was rechecked in this pre-flight. Existing authoritative Linux baselines are not changed blindly.

## Acceptance criteria mapping

- Persisted reviews only: snapshot is created only after successful review POST; server completion counters and refreshed progress feed result evidence.
- Objective vs self-rating: objective `correct` and confidence ratings remain separate models and labels.
- Repeat/when: due count plus server `nextDueAt` describe what is actionable now and the nearest later review.
- One primary CTA: continuation policy selects the single best action from due/goal/preview state; secondary action stays informational/navigation.
- Goal/streak integrity: only server progress values are presented; celebration is still one-time and crossing-based.
- Honest states: unit/E2E cover full objective evidence, unknown restored evidence, study/no-objective evidence, skipped/sync cases as applicable.
- Retention analytics: an authenticated first-result-action row plus existing lesson-session timestamps provide durable completion-to-next-action and return-to-next-session metrics without inventing cross-session identity.

## Required checks

- Agent Harness/source-contract validation after each documentation write.
- Frontend lint, typecheck, unit/source-contract tests for Lesson Result and analytics helpers.
- Canonical Lesson Result browser E2E in configured Chromium/WebKit/mobile projects.
- Blocking accessibility, reduced-motion, 200% reflow/history/reload and visual regression without baseline update.
- Performance/bundle, service-worker, content-security and production build gates selected by CI.
- Backend unit/race/integration/OpenAPI/migration gates for the retention contract.
- The only accepted visual baseline changes are the three inspected Lesson Result Linux PNGs regenerated from the exact pinned CI environment after artifact #3342 review; normal `test:e2e:visual` must pass on the final immutable head.
- Immutable-head full PR CI, review/thread audit and clean branch-vs-main compare before Ready.

## Risks

- Treating restored `correct=null` as an objective attempt and publishing misleading accuracy.
- Calculating due time on the client instead of preserving the server scheduler timestamp.
- Allowing a generic next-block CTA to hide immediately due weak material or goal-completion state.
- Changing Figma-owned copy/layout enough to invalidate content-addressed visual baselines without reviewed Linux evidence.
- Reusing anonymous product-navigation analytics for a cross-session retention metric that requires stable identity.
- Recording more than the first Result action and thereby changing completion-to-next-action semantics after reload/double-click.
- Storing long-lived learning state in browser storage instead of a short-lived result snapshot.

## Rollback

Revert the atomic Issue #73 product PR. The retention schema is additive and does not mutate scheduler/review history; rollback of runtime code stops new event production, while the additive table/view can be dropped independently if a database rollback is required.