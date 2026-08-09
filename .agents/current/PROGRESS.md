# Progress

## Status

Issue #74 is closed and its exact merge SHA `e1980c973d524048d2fb079d79d51b8bfd50f0a4` passed main CI #3148 plus Stage #2991 public HTTP/browser gates. Manual physical-device QA is tracked separately in #461.

Issue #18 is now active on `feat/issue-18-adaptive-queue`.

## Completed in this slice

- Verified current composer is only `due -> new -> scheduled` and has no durable reason, review/new control, recent-failure signal or weak-topic signal.
- Verified objective review evidence and weekly weak-topic data already exist; no new client-owned truth is required.
- Designed a backwards-compatible adaptive queue policy using existing `review_events`, `user_words` and `words` data.
- Added deterministic unit contracts for priority, ratio, shortage fill and anti-streak behavior.

## Current implementation

- Add recent-failure and weak-topic candidate metadata in the repeatable-read snapshot.
- Add optional 0..100 `reviewRatio` with default 70.
- Persist `lesson_sessions.review_ratio` and `lesson_session_items.selection_reason`.
- Rehydrate persisted reasons on active/resumed lessons.

## Next gates

1. Create the bounded implementation commit.
2. Open Draft PR against `main`.
3. Run immutable-head CI and fix only proven failures.
4. Ready + expected-head squash merge when green.
5. Verify exact-SHA main CI and Stage/public gates.
6. Continue Issue #18 with diagnostic onboarding + learner self-mark as the next coherent phase.
