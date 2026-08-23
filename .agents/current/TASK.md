# Current Task

## Identity

- Issue: #651
- Branch: `feat/issue-651-bounded-manual-workload`
- Base SHA: `5196a4b2824820bb3c5105d03112929d9a495da1`
- Head SHA: resolve from live branch ref
- PR: #666 (Draft)

## Objective

Deliver the next atomic Issue #651 slice by making the manual `/learn` composer use bounded workload choices `15 / 30 / 50` plus an explicit user-only `All` action, with `15` as the default, while preserving the already-delivered automatic Study/Review/Remediation block size and queue semantics.

## Scope

- Replace the legacy manual lesson-size option `60` with `50`.
- Expose `All` only inside the manual `/learn` lesson-size control.
- Make the manual composer default to 15 items.
- Extend preview/create API validation and OpenAPI contract to accept `15`, `30`, `50`, `all` and reject legacy/unsupported values.
- Ensure `all` is interpreted as the full explicitly selected manual candidate set without becoming an automatic recommendation/default.
- Preserve read compatibility for already-created active lessons whose persisted `lessonSize` can still be `60`; this does not authorize new preview/create requests with `60`.
- Keep UI labels/estimated-duration copy truthful for numeric sizes and explicit `All`.
- Update focused backend/frontend/browser/accessibility contract tests required by the changed behavior.

## Non-goals

- Do not change automatic Home Study/Review/Remediation block size (`15`).
- Do not change process ownership, queue candidate selection, due filtering, remediation eligibility, selection reasons or scheduler formulas.
- Do not redesign `/learn`; reuse the existing OpenPencil-owned lesson-size control pattern.
- Do not change answer modes, self-rating semantics, objective correctness semantics, recommendation scoring/history, FSRS/DSR work or mixed-practice semantics.
- Do not broaden the `wordIds` explicit-selection limit; its existing `1..60` ownership contract is separate from manual composer lesson-size presets.
- Do not rewrite legacy persisted active-lesson payloads merely to remove the historical `60` read value.

## Allowed paths

- `.agents/current/**`
- `api/openapi.yaml`
- `backend/internal/learning/lesson_http.go`
- `backend/internal/learning/lesson_composer.go`
- focused `backend/internal/learning/*_test.go` files that validate lesson size / preview / create behavior
- `frontend/lib/learning.ts`
- `frontend/components/lexigo-learn-app.tsx`
- focused frontend component/unit/e2e tests that validate the `/learn` lesson-size control, keyboard semantics, preview/create payloads and route behavior
- existing visual snapshots only if exact Linux evidence proves an intentional `/learn` fingerprint change caused solely by the added/relabelled size option
- `.github/workflows/temporary-issue-651-stage4-exact-rewrite.yml` **only as a one-shot, exact-anchor, path-guarded large-file rewrite helper for `api/openapi.yaml` and `frontend/e2e/learn-browser-zoom.spec.ts`; it must be deleted before the final developer-authored candidate and final immutable-head CI, leaving zero workflow diff**

## Prohibited paths

- database migrations
- scheduler implementation/formulas
- Study/Review/Remediation selector ownership unless a regression test reveals an actual Stage 4 blocker
- Home recommendation/runtime logic except test fixture compatibility strictly required by the shared lesson-size type
- deployment/workflow/dependency files other than the temporary exact-rewrite helper explicitly authorized above
- OpenPencil production design source/tokens
- unrelated route styling or visual baselines

## Runtime owners

- Backend lesson request validation and candidate limit interpretation own the new API write semantics.
- `LexigoLearnApp` owns the manual `/learn` size choice and explicit `All` action.
- Active Lesson read paths may continue to parse historical `60` values for backward compatibility.
- Stage 3 Home process-aware queues remain the owner of automatic 15-item recommendations.

## Documentation owners

- OpenAPI owns the public request enum.
- `.agents/current/**` owns execution evidence for this atomic slice.

## Invariants

- `All` is never an automatic default or recommendation.
- Automatic process-aware Home creation remains exactly `lessonSize: "15"`.
- Review never fills from future-scheduled items; Study/Review/Remediation ownership is unchanged.
- Omitted `sessionKind` remains the legacy manual-composer boundary established by earlier #651 stages.
- Existing active lessons created before Stage 4 remain readable even if their stored size is `60`; new preview/create validation still rejects `60`.
- `selection_reason`, answer-mode semantics, scheduler state transitions and review event semantics are unchanged.
- Existing route/history/PWA/accessibility contracts remain intact.

## Acceptance criteria

- Manual `/learn` exposes exactly `15`, `30`, `50`, `Все` and defaults to `15`.
- Selecting each manual size updates preview/create payloads to `"15"`, `"30"`, `"50"`, `"all"` respectively.
- Backend preview/create accepts `15`, `30`, `50`, `all`; legacy `60` and arbitrary values return `invalid_lesson_size`.
- Explicit `all` preview/create selects all candidates available to the current manual configuration after existing selector/composer rules; it is not silently capped at 50.
- Automatic Home flows continue to request a fixed 15-item block and never send `all`.
- Previously persisted active lessons with `lessonSize="60"` remain readable; this compatibility does not leak `60` back into new manual choices or API write validation.
- OpenAPI documents the exact accepted write vocabulary.
- Keyboard/roving-radio semantics remain correct with four manual size choices.
- Focused tests plus immutable-head full CI are green.
- Final PR inventory contains no `.github/workflows/**` diff.

## Required checks

- focused Go unit/integration tests for lesson-size validation and explicit-all limit behavior
- frontend type/unit tests
- focused Playwright `/learn` composer tests, including keyboard navigation and exact preview/create request payload assertions
- OpenAPI validation/generation checks
- true-browser-zoom `/learn` contract updated to the new default without weakening its geometry/focus assertions
- full immutable-head PR CI after the temporary helper is removed
- review audit: comments/reviews/unresolved threads
- expected-head squash merge
- exact-main CI and Stage/public runtime validation because this changes backend/frontend runtime

## Risks

- Treating `all` as `0` implicitly can be ambiguous; implementation/tests must make explicit that zero means no manual cap only for the validated `all` token.
- Adding a fourth horizontal radio may expose compact/zoom layout regressions; targeted responsive/a11y checks must cover it.
- Removing `60` from a shared read type breaks already-created active lessons; write vocabulary and persisted read compatibility must remain separate.
- Legacy fixtures may assume `60`; update only fixtures that model new manual preview/create vocabulary, not unrelated numeric limits or historical read paths.
- Large-file connector replacement is unsafe without exact anchoring; the temporary helper must fail closed on count mismatch, touch only the two authorized files, and be deleted before final acceptance.

## Rollback

Revert the Stage 4 squash merge. The prior new-manual contract remains `15 / 30 / 60`, with Stage 3 automatic Home queues unaffected. Historical active lessons require no data rewrite either way.
