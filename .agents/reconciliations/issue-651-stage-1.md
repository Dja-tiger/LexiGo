# Issue #651 Stage 1 lesson session-kind reconciliation

Verified on 2026-08-22.

## Product delivery

- Parent architecture task: Issue #651 — separate new-material study, due spaced review and remediation/error work into independent processes.
- Delivered slice: Stage 1 only — explicit lesson-session intent contract and expanded durable selection-reason vocabulary.
- Product PR: #656 — `feat(learning): add staged lesson session-kind contract`.
- Final developer-authored PR head: `4df21dfd25611d9b16f0e0599dc52a906eece5a5`.
- Fully validated implementation ancestor: `db60dab559cb1672fd9ee26b8b740c54be76fe52`.
- Immutable-head PR CI #3978 / run `32543320872`: success on the implementation head.
- Final immutable-head PR CI #3979 / run `32563683185`: success on exact final head `4df21dfd25611d9b16f0e0599dc52a906eece5a5`.
- Pre-merge review audit: no review submissions, no PR comments and no unresolved review threads; PR was mergeable.
- Squash merge / delivered `main`: `68298977652d737ee267b4cfd5e1a978fb99828c`.
- The Stage workflow for this exact merge SHA could run only after successful push-triggered `CI` on `main`; Deploy Stage run `32579711137` completed successfully on image SHA `68298977652d737ee267b4cfd5e1a978fb99828c`.
- Stage deploy, public frontend/API smoke and public browser verification all passed; the public Chromium + iOS WebKit runtime suite passed 12/12.
- Issue #651 remains open because this delivery intentionally implements only Stage 1 of the larger architecture change.

## Delivered contract

PR #656 adds a backward-compatible intent axis without changing the current queue composer or scheduler behavior:

- `sessionKind` values are `study`, `review` and `remediation`;
- `sessionKind` describes why a lesson session exists and remains orthogonal to `studyMode` / `answerMode`, which describe how exercises are answered;
- callers may omit `sessionKind` during the staged rollout;
- omitted legacy intent remains SQL `NULL` and omitted from JSON rather than being inferred as `study`;
- unknown non-empty values fail at the HTTP boundary with 422 `invalid_session_kind`;
- explicit intent is persisted in nullable `lesson_sessions.session_kind`;
- recent-active lesson dedupe identity includes a null-safe `session_kind` comparison, so different explicit intents cannot alias one session and legacy NULL remains distinct from explicit `study`;
- durable `selection_reason` now also accepts `overdue`, `relearning_due`, `repeated_again` and `repeated_almost`, while retaining existing values including `scheduled`;
- PostgreSQL constraints, backend serialization/validation, OpenAPI, frontend types/runtime validation and human-readable reason labels were synchronized atomically;
- regression coverage includes explicit kind round-trip, invalid kind 422, same-kind and different-kind dedupe behavior, legacy NULL semantics, database CHECK constraints and full-file OpenAPI parsing.

## Validation and failure classification

The final PR CI passed backend dependency/format/static/race/security gates, PostgreSQL integration/race tests, frontend lint/typecheck/unit/build/audit, both UI shards, Dictionary smoke, accessibility, Linux Visual regression, Content Security, iOS PWA, Lesson completion, performance budgets, Controlled Service Worker, aggregate frontend quality and API/web container builds.

CI #3977 / run `32543187188` exposed one real contract-synchronization omission: `frontend/lib/interface-copy.ts` implemented an exhaustive `Record<LessonSelectionReason, string>` and lacked labels for the four newly added reason values. The file was added to the allowed scope, all four labels were supplied, and both subsequent immutable-head runs passed. No scheduler or queue behavior was changed to remediate the failure.

## Remaining Issue #651 work

Stage 1 is only the foundation. The parent Issue still requires later atomic slices to implement and verify the independent learning processes themselves, including candidate selection and product recommendations for:

1. Study / new material;
2. Review / due spaced repetition;
3. Remediation / errors and weak areas.

Later work must continue to preserve the distinction between raw correctness, learner self-rating (`Не знаю` / `Почти` / `Знаю`), scheduler state and the new session intent axis. Stage 1 must not be mistaken for completion of the parent architecture task.

## Open PR ordering after reconciliation

At reconciliation time, PR #645 remains the other open PR and is Draft. Project policy requires checking existing open PRs before starting another product PR. Therefore, after `.agents/current/**` is reset, work should return to #645 before opening a new Issue #651 implementation PR unless the user explicitly directs otherwise.

PR #645 is an evidence-only First Use loading/error visual-acceptance slice. Its current branch was constructed on an older `main` and is not mergeable against `68298977652d737ee267b4cfd5e1a978fb99828c`; it must be reconstructed on the latest delivered `main` rather than blindly merged.

## Harness reset

This reconciliation resets `.agents/current/TASK.md`, `.agents/current/PROGRESS.md` and `.agents/current/EXECUTION.md` byte-for-byte to the canonical templates. The durable delivery evidence is preserved in this file and in `PROJECT_STATE.md`.
