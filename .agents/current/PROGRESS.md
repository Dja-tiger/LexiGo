# Current Task Progress

## 2026-08-12 Europe/Moscow

### Identity

- Issue: #73 `[Medium][Retention] Улучшить завершение урока и рекомендовать следующий шаг`.
- Branch: `feat/issue-73-outcome-summary`.
- Base/main at branch creation: `ca0a8a57628fdd36d5cc93c1bb59a4b4c099fbfa`.
- PR: #477 `feat(retention): make lesson outcomes actionable` (Draft until immutable-head acceptance completes).

### Previous delivery reconciled from live GitHub

- PR #476 for Issue #72 was squash-merged to `main` as `ca0a8a57628fdd36d5cc93c1bb59a4b4c099fbfa`.
- Exact-SHA `main` CI #3312 / run `31579070614` completed `success` across backend, frontend, browser, accessibility, visual, performance, PWA, security and container-build gates.
- Deploy Stage #3155 / run `31579844206` completed `success` for the same exact image SHA, including public frontend/API smoke and public desktop Chromium/iOS WebKit browser validation.
- Issue #72 acceptance criteria were marked complete and the Issue was closed as `completed` with the exact delivery evidence.
- `.agents/PROJECT_STATE.md` remains stale relative to live GitHub; live GitHub is the higher-priority delivery source of truth. It must be reconciled only after Issue #73 itself has immutable merge/deploy evidence.

### Issue #73 discovery and pre-flight

- Issue #73 asks for an outcome-oriented lesson completion summary: persisted-review evidence, objective correctness separate from self-rating, what repeats/when, one personalized primary CTA, truthful goal/streak, honest empty/partial/skipped states and retention measurement.
- Related weekly progress/retention Issue #19 is already closed; #73 consumes the existing Progress contract instead of recreating weekly analytics.
- Canonical Lesson Result owner from Issue #194 already exists. Figma nodes are `217:5`–`217:14`; node `217:5` was rechecked during pre-flight and confirms the existing composition: saved status, separated evidence, repetition context, one primary CTA and one secondary navigation action.
- Additional Figma calls are blocked by the account MCP Starter-plan call limit. No inferred redesign or blind visual-baseline update is allowed as a workaround.
- Mandatory project rules applied include production-safe delivery, route-island/recovery ownership, downstream API consumers, absolute calendar boundaries, request-scoped browser fixtures, tool/write safety, OpenAPI structure and authoritative browser visual/geometry collection.
- Every branch write was followed by file read-back and a `main` re-read. `main` remained exactly `ca0a8a57628fdd36d5cc93c1bb59a4b4c099fbfa` through the final product/API write.

### Implemented frontend outcome contract

- `frontend/lib/lesson-result.ts` snapshot is version 2 and now persists server-owned `nextDueAt`, `objectiveReviewsToday`, `objectiveSuccessfulToday` and `currentStreak` together with the completed lesson evidence.
- Objective evidence is now `{attempted, correct, unavailable}`. A restored review with `correct=null` remains persisted activity and increments `unavailable`; it is never invented as an objective attempt or failure.
- Honest outcome states are explicit: `empty`, `study`, `partial`, `skipped`, `complete`. Self-rating (`known/almost/again`) remains a separate confidence/activity signal.
- `nextDueAt` is consumed as an absolute server timestamp and formatted in the browser timezone. No client-owned scheduler math or fixed-duration approximation was introduced.
- Continuation priority is `sync-pending -> daily-goal -> due -> checking -> next -> home`. Already-due work therefore wins over creation of new material; daily-goal celebration remains one-time and crossing-based.
- Result presentation reuses the existing Figma-backed composition and CSS owners. It shows server-confirmed outcome evidence, nearest-review timing, server goal/streak context and exactly one primary continuation.
- `LexigoActiveLessonApp` builds the snapshot only after the final lesson review POST succeeds and refreshes `/api/v1/progress`; no review is resubmitted on Result reload/history restoration.

### Implemented retention measurement contract

- Anonymous `product_navigation_events` remain aggregate route telemetry and are deliberately not reused as cross-session learner identity.
- Migration `000020_lesson_result_retention` adds `lesson_result_actions`, keyed by authenticated `(user_id, lesson_id)` with a composite ownership FK to `lesson_sessions` and a unique first-action constraint.
- The first Result action is immutable/idempotent: duplicate submissions after reload/double-click return success but cannot rewrite the original recommendation/selection pair.
- Authenticated `POST /api/v1/lessons/{lessonID}/result-action` validates lesson ownership, completed state and allow-listed recommendation/selection vocabularies. It does not mutate review, scheduler or lesson progression state.
- Frontend producer is best-effort/keepalive and never blocks the learner's selected continuation. Backend uniqueness remains the authoritative first-action guarantee.
- SQL view `lesson_result_retention` uses one completed lesson as the denominator and derives:
  - `completion_to_action_seconds` from `lesson_sessions.completed_at` to the first Result action;
  - `return_to_next_session_seconds` from completion to the next later `lesson_sessions.created_at` for the same authenticated user;
  - `selected_recommended_action` to distinguish recommendation follow-through from alternate navigation.
- OpenAPI was bumped from `0.13.0` to `0.14.0` and documents the authenticated endpoint plus strict `LessonResultActionRequest`. Runtime `httpx.DecodeJSON` already rejects unknown fields, so the OpenAPI `additionalProperties: false` contract matches implementation.

### Verification coverage added

- Unit tests cover objective/self-rating separation, unknown restored correctness, all outcome states, server progress context, malformed due timestamp fail-closed behavior, due-first continuation, recommendation vocabulary, snapshot v2 validation and one-time goal celebration.
- Canonical browser coverage now includes normal completed evidence, restored partial evidence, reload/history without duplicate review, daily-goal milestone, due-first CTA, distinct-next protection, retention producer payloads, axe in Light/Dark, 200% reflow and reduced motion.
- Browser API failure fixtures remain request-scoped. The Result fixture captures `recommendedAction/selectedAction` without changing unrelated routes.
- Backend integration coverage validates invalid action rejection, cross-user ownership isolation, first-action idempotency, exact persisted recommendation/selection and both SQL-view latency metrics.
- OpenAPI full-file write was verified by commit diff: only version, one path and one schema changed.
- Large `server.go` and `LexigoActiveLessonApp` full-file writes were each verified by commit diff to exclude collateral changes.

### Acceptance mapping

- Persisted reviews only: satisfied by snapshot creation after successful persisted final review and server completion confirmation.
- Objective correctness separate from self-rating: satisfied; restored unknown correctness is explicit `unavailable` evidence.
- What repeats/when: satisfied by server `dueNow` plus absolute server `nextDueAt`.
- One personalized primary CTA: satisfied by server/snapshot continuation policy with due-first and distinct-next protection.
- Goal/streak integrity: satisfied; client displays refreshed server values and detects only a before/after goal crossing.
- Honest empty/partial/skipped/study/sync states: modeled and unit/browser-covered where reachable from canonical runtime fixtures.
- Retention measurement: satisfied by authenticated first-action persistence plus existing lesson-session timestamps and the `lesson_result_retention` view.

### CI / delivery state

- Earlier intermediate frontend-only head passed Frontend core quality (lint, typecheck, unit tests, production build and dependency audit).
- The post-OpenAPI intermediate run #3334 successfully passed change-scope/Agent Docs classification and queued backend/frontend gates before this final Harness write advanced the branch again.
- No intermediate run is accepted as final evidence.
- Next step is immutable-head CI for the exact branch SHA created by this write. Required evidence includes backend unit/race/security, backend integration/migrations/OpenAPI, frontend core, canonical browser shards, accessibility, visual regression, performance budgets, iOS PWA, Service Worker/content security and immutable container builds as selected by CI.
- Existing visual baselines will not be updated blindly. Any Result screenshot diff must be inspected against the canonical Issue #194 composition before acceptance.
- PR #477 remains Draft and Issue #73 remains open until exact-head CI and later exact-merge Stage/public delivery gates are proven.

### Write-safety state

- Branch was created from verified `main` SHA `ca0a8a57628fdd36d5cc93c1bb59a4b4c099fbfa`.
- All production/API/schema changes were written only to `feat/issue-73-outcome-summary`.
- `main` was never modified by this task.
- After this progress reconciliation, freeze writes unless immutable-head CI exposes a concrete defect that requires a focused correction.