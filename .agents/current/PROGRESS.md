# Current Task Progress

## 2026-08-12 Europe/Moscow

### Identity

- Issue: #73 `[Medium][Retention] Улучшить завершение урока и рекомендовать следующий шаг`.
- Branch: `feat/issue-73-outcome-summary`.
- Base/main at branch creation: `ca0a8a57628fdd36d5cc93c1bb59a4b4c099fbfa`.
- PR: not created yet.

### Previous delivery reconciled from live GitHub

- PR #476 for Issue #72 was squash-merged to `main` as `ca0a8a57628fdd36d5cc93c1bb59a4b4c099fbfa`.
- Exact-SHA `main` CI #3312 / run `31579070614` completed `success` across backend, frontend, browser, accessibility, visual, performance, PWA, security and container-build gates.
- Deploy Stage #3155 / run `31579844206` completed `success` for the same exact image SHA, including public frontend/API smoke and public desktop Chromium/iOS WebKit browser validation.
- Issue #72 acceptance criteria were marked complete and the Issue was closed as `completed` with the exact delivery evidence.
- `.agents/PROJECT_STATE.md` is therefore stale relative to live GitHub; live GitHub remains the higher-priority source of truth. A verified Project State reconciliation is allowed in this branch but must not claim Issue #73 delivered before its own merge/deploy evidence.

### Issue #73 discovery

- Issue #73 is open and asks for an outcome-oriented lesson completion summary: persisted-review evidence, objective correctness separate from self-rating, what repeats/when, one personalized primary CTA, truthful goal/streak, honest empty/partial/skipped states and retention measurement.
- Related weekly progress/retention evidence Issue #19 is already closed; #73 must consume that existing progress contract rather than recreate weekly analytics.
- Canonical Lesson Result owner from Issue #194 already exists. Figma nodes are `217:5`–`217:14`; node `217:5` was rechecked during this pre-flight and confirms the existing composition: saved status, objective evidence rows, activity separated from knowledge, a repetition card, one primary CTA and one secondary navigation action.
- Additional Figma calls are currently blocked by the account MCP Starter-plan call limit. No inferred redesign or unreviewed visual baseline update is allowed as a workaround.

### Current runtime findings

- `frontend/lib/lesson-result.ts` owns a 24-hour versioned sessionStorage snapshot, objective recall/recognition evidence, self-rating confidence, daily-goal crossing, due count and continuation selection.
- Snapshot creation happens only after the lesson review POST succeeds and the server reports lesson completion; this is the correct persisted-review boundary.
- `LexigoActiveLessonApp` refreshes `/api/v1/progress` before building the completed snapshot. `ProgressSummary` already exposes server-owned `nextDueAt`, `objectiveReviewsToday`, `objectiveSuccessfulToday`, `dailyGoal`, `reviewsToday` and `currentStreak`.
- No new progress API field is required to show the nearest scheduler time or server-backed goal/streak context.
- A correctness gap exists after active-lesson recovery: restored reviewed items reconstruct `correct: null` because the lesson session stores rating/reviewedAt but not historical objective correctness. Current `buildLessonResultEvidence` counts those `null` entries as objective attempts, which can overstate the denominator. Issue #73 must instead treat them as persisted activity with unavailable objective evidence.
- Existing `product_navigation_events` analytics are anonymous route transitions and reject same-route events. They can measure navigation patterns but cannot by themselves prove a cross-session per-user return-to-next-session metric. Reusing them for that criterion without a durable identity contract would be misleading.

### Pre-flight rules applied

- Live `main`, Issue, related Issue/PR, exact post-merge CI/Stage, Agent Harness and canonical runtime owners were read before production writes.
- Mandatory project rules reviewed include production-safe delivery, route-island/recovery ownership, progressive disclosure, downstream API consumers, calendar boundaries, request-scoped failure fixtures, tool-selection safety, CSS computed-cascade ownership, OpenAPI structure, PostgreSQL array semantics, controlled-input synchronization and authoritative browser-zoom/geometry collection.
- Calendar evidence rule applies directly: `nextDueAt` will be treated as an absolute server timestamp and formatted in the browser timezone. No fixed-duration approximation will be used for a scheduler/calendar assertion.
- Visual rule applies directly: existing content-addressed Linux baselines cannot be advanced without exact artifact provenance and manual comparison to canonical Figma.

### Planned minimal product slice

1. Version the Lesson Result snapshot and add the existing server-owned completion evidence required by #73 (`nextDueAt`, objective daily counters, streak and persisted completion counts where useful).
2. Change objective evidence aggregation so `correct=null` is explicitly unavailable rather than counted as an objective attempt.
3. Derive honest complete/partial/study/skipped result copy and nearest-review text without changing scheduler data.
4. Refine continuation selection to one useful primary action from sync/goal/due/preview state while preserving distinct-next protection and one-time celebration.
5. Extend focused unit and canonical browser fixtures/tests, including reload/history and timezone-safe next-due formatting.
6. Design retention measurement only after proving the existing analytics boundary can satisfy the required identity/session semantics; otherwise add a focused durable backend contract in the same slice rather than relabeling anonymous navigation data.
7. Run full immutable-head CI, inspect authoritative browser/visual artifacts, then create/update the Draft PR and leave merge gated on exact-head evidence.

### Current write-safety state

- Branch `feat/issue-73-outcome-summary` was created from verified `main` SHA `ca0a8a57628fdd36d5cc93c1bb59a4b4c099fbfa`.
- The first branch write updated only `.agents/current/TASK.md`; it was read back as blob `01cb424bbff282987f0ea3db4ee6f3cad30a2669`.
- `main` was re-read immediately afterward and remained exactly `ca0a8a57628fdd36d5cc93c1bb59a4b4c099fbfa`.
- This file is the second branch-local pre-flight write. Production runtime has not yet been modified.