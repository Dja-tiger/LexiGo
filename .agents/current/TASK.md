# Current Task

## Identity

- Issue: #18
- Branch: `feat/issue-18-adaptive-queue`
- Base SHA: `e1980c973d524048d2fb079d79d51b8bfd50f0a4`
- PR: pending

## Objective

Deliver the first large production slice of Issue #18: a server-owned adaptive lesson queue that prioritizes recent failures and weak topics, supports a controlled review/new ratio, avoids avoidable topic/POS streaks, and persists an explainable selection reason for every newly created lesson item.

## Scope

- Adaptive candidate signals from existing objective review events and user-word state.
- Priority order: recent failure -> due -> weak topic -> new -> scheduled.
- Optional `reviewRatio` request contract with a backwards-compatible 70% default and 0..100 validation.
- Review/new quota with shortage fill so lessons do not become artificially short.
- Greedy anti-streak ordering within the same priority tier for topic and part of speech.
- Durable `selection_reason` and `review_ratio` persistence for resumable lessons.
- Active/resumed lesson responses rehydrate stored reasons instead of recomputing them.
- Deterministic unit contracts for ranking, ratio, shortage fill, reasons, and diversification.

## Non-goals

- Diagnostic onboarding UI and learner self-mark (`Знаю / Не уверен / Новое`); this is the next coherent Issue #18 phase after this production slice is delivered.
- A redesign of Lesson Composer, Active Lesson or Profile.
- Changes to scheduler grading semantics or review event truth.
- Guessing physical-device behavior.

## Allowed paths

- `backend/internal/learning/lesson.go`
- `backend/internal/learning/lesson_composer.go`
- `backend/internal/learning/lesson_composer_test.go`
- `backend/internal/learning/lesson_http.go`
- `backend/internal/learning/lesson_progression.go`
- `backend/internal/learning/lesson_reasons.go`
- `backend/internal/platform/migrate/migrations/000018_adaptive_lesson_queue.up.sql`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

All paths not listed above in this slice, including frontend visual owners, deployment workflows, lockfiles and unrelated API/runtime code.

## Invariants

- Existing clients that omit `reviewRatio` keep working and receive the 70% default policy.
- Recall/choice due-only filtering remains server-owned.
- Manual `wordIds` lessons preserve exact caller order and are marked `manual` rather than re-ranked.
- Recent completed lesson exclusion remains active.
- Candidate ranking is deterministic for the same snapshot.
- Anti-streak logic never crosses priority tiers and only reorders when a same-priority alternative exists.
- Lesson resume uses persisted reasons, not mutable current learner state.

## Acceptance criteria

- Recent failures rank before ordinary due items.
- Due items rank before weak-topic items; weak-topic items rank before ordinary new/scheduled items.
- Configured review/new share is honored when inventory allows and shortages are filled from the other side.
- A third same-topic or same-POS item is avoided when a same-priority alternative exists.
- New adaptive lesson items persist one valid reason; manual items persist `manual`.
- Active lesson responses expose the persisted reason after resume.
- Invalid `reviewRatio` outside 0..100 returns 422.
- Backend unit/integration/race gates and immutable-head CI pass before merge.
- Exact-SHA main CI and Stage/public validation pass after merge.

## Rollback

Revert the Issue #18 adaptive queue commit/PR. The migration is additive: legacy sessions remain readable because `selection_reason` is nullable and `review_ratio` has a 70 default. No destructive data rewrite is required.
