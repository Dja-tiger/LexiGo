# Current Task

## Identity

- Issue: #651
- Branch: `feat/issue-651-session-kind-contract`
- Base SHA: `0873e31e26522d5a855f0ec95925a4fa4d2497e3`
- Head SHA: resolve from live branch ref after writes
- PR: create as Draft after atomic contract slice

## Objective

Deliver the first atomic stage of Issue #651: introduce an explicit, backward-compatible lesson `session_kind = study | review | remediation` contract that is orthogonal to `studyMode`/answer mode, and extend durable `selection_reason` vocabulary for the later queue split without changing current composer or scheduler behavior.

## Scope

- add the lesson session-kind domain type and constants;
- accept optional `sessionKind` on lesson creation while legacy callers may omit it during the staged rollout;
- reject unknown non-empty session kinds at the HTTP boundary;
- persist explicit session kind on progressive lesson sessions and preserve legacy sessions as SQL `null` / omitted JSON rather than inferring intent from `studyMode`;
- include session kind in recent-active lesson identity so two explicit intents cannot alias the same idempotent session;
- return explicit session kind on progressive create/active lesson payloads;
- extend durable selection reasons with `overdue`, `relearning_due`, `repeated_again`, and `repeated_almost` while retaining current/legacy reasons, including `scheduled`;
- synchronize OpenAPI and frontend runtime/type validators with the additive contract;
- add focused unit/integration coverage for validation, persistence, round-trip, legacy omission and expanded reason constraints.

## Non-goals

- no Study/Review/Remediation candidate-selector split yet;
- no change to `applyLessonReviewRatio`, due filtering, candidate priority or current composer behavior;
- no scheduler interval/easiness/repetition change;
- no review-event schema redesign in this slice;
- no Home CTA/recommendation UI change;
- no lesson-result UX/analytics change;
- no automatic migration/inference of historical lesson intent from `studyMode`;
- no OpenPencil/design-source change;
- no deployment/workflow/dependency change.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `backend/internal/learning/lesson.go`
- `backend/internal/learning/lesson_http.go`
- `backend/internal/learning/lesson_progression.go`
- `backend/internal/learning/lesson_reasons.go`
- `backend/internal/learning/*_test.go`
- `backend/integration/*session*kind*_test.go`
- `backend/internal/platform/migrate/migrations/000024_learning_session_kinds.up.sql`
- `api/openapi.yaml`
- `frontend/lib/learning.ts`
- `frontend/lib/account-resources.ts`
- `frontend/lib/account-resources.test.ts`
- `frontend/lib/interface-copy.ts` — compiler-enforced exhaustive consumer of `LessonSelectionReason`; added after CI typecheck exposed the dependency.

## Prohibited paths

- `backend/internal/learning/lesson_composer.go`
- `backend/internal/learning/scheduler.go`
- existing review-event migrations/schema
- Home/Learn/Active-Lesson product components
- `docs/figma/**`
- OpenPencil `.op` / screen map
- `.github/workflows/**`
- dependency manifests/lockfiles
- deploy/runtime infrastructure

## Runtime owners

- `backend/internal/learning/lesson.go` — domain contract.
- `backend/internal/learning/lesson_http.go` — additive request validation.
- `backend/internal/learning/lesson_progression.go` — progressive-session persistence and idempotent identity.
- `backend/internal/learning/lesson_reasons.go` — returned session metadata and durable reason validation.
- migration `000024_learning_session_kinds.up.sql` — nullable rollout-safe persistence/check constraints.
- `api/openapi.yaml` and frontend validators/types — public/shared contract.
- `frontend/lib/interface-copy.ts` — exhaustive human-readable labels for the shared selection-reason union; no new UI behavior.

## Documentation owners

- Issue #651 and its comments.
- `.agents/current/**`.

## Invariants

- `sessionKind` describes why the session exists; `studyMode`/`answerMode` describes how an exercise is answered. They must remain separate axes.
- omitted/legacy `sessionKind` is not equivalent to `study`, `review`, or `remediation` and must not be inferred from `studyMode`.
- current clients that omit `sessionKind` continue to work unchanged during the staged migration.
- explicit session kinds are only `study`, `review`, `remediation`.
- existing `selection_reason` values remain valid; future reasons are additive.
- no queue-selection or scheduler behavior changes in this PR.
- raw objective correctness and self-rating semantics remain untouched and separate.

## Acceptance criteria

- explicit `study`, `review`, and `remediation` session kinds validate, persist and round-trip independently of `studyMode`;
- unknown non-empty session kind returns 422;
- omitted session kind preserves legacy behavior and is not fabricated in the response;
- recent-active lesson dedupe distinguishes different explicit session kinds;
- DB rejects invalid session kinds and invalid selection reasons;
- DB/backend/frontend accept the expanded reason vocabulary while retaining legacy `scheduled`;
- OpenAPI documents optional rollout semantics and orthogonality to answer mode;
- existing callers/tests remain green without being forced to send the new field;
- full immutable-head CI is green before merge.

## Required checks

- backend format/static/unit/security;
- backend integration including migration and session-kind round-trip;
- frontend lint/typecheck/unit/build;
- existing browser/security/accessibility/visual groups through full CI;
- changed-file audit, review/thread audit and main-drift audit.

## Risks

- treating omitted session kind as `study` would corrupt the staged semantics and historical analytics;
- omitting session kind from idempotent lesson identity could return a session created for a different user intent;
- tightening selection-reason constraints without retaining `scheduled` would break the current composer before stage 2;
- frontend payload validators can reject additive server fields if not updated atomically.

## Rollback

Revert the additive API/domain migration and contract commit before stage 2. No historical rows are rewritten; the new column is nullable and explicit values are additive, so rollback does not require scheduler-state reconstruction.
