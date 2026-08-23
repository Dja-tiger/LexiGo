# Current Task

## Identity

- Issue: #651
- Branch: `feat/issue-651-bounded-manual-workload`
- Base SHA: `5196a4b2824820bb3c5105d03112929d9a495da1`
- Head SHA: resolve from live branch ref
- PR: pending

## Objective

Deliver the next atomic Issue #651 slice by making the manual `/learn` composer use bounded workload choices `15 / 30 / 50` plus an explicit user-only `All` action, with `15` as the default, while preserving the already-delivered automatic Study/Review/Remediation block size and queue semantics.

## Scope

- Replace the legacy manual lesson-size option `60` with `50`.
- Expose `All` only inside the manual `/learn` lesson-size control.
- Make the manual composer default to 15 items.
- Extend preview/create API validation and OpenAPI contract to accept `15`, `30`, `50`, `all` and reject legacy/unsupported values.
- Ensure `all` is interpreted as the full explicitly selected manual candidate set without becoming an automatic recommendation/default.
- Keep UI labels/estimated-duration copy truthful for numeric sizes and explicit `All`.
- Update focused backend/frontend/browser/accessibility contract tests required by the changed behavior.

## Non-goals

- Do not change automatic Home Study/Review/Remediation block size (`15`).
- Do not change process ownership, queue candidate selection, due filtering, remediation eligibility, selection reasons or scheduler formulas.
- Do not redesign `/learn`; reuse the existing OpenPencil-owned lesson-size control pattern.
- Do not change answer modes, self-rating semantics, objective correctness semantics, recommendation scoring/history, FSRS/DSR work or mixed-practice semantics.
- Do not broaden the `wordIds` explicit-selection limit; its existing `1..60` ownership contract is separate from manual composer lesson-size presets.

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

## Prohibited paths

- database migrations
- scheduler implementation/formulas
- Study/Review/Remediation selector ownership unless a regression test reveals an actual Stage 4 blocker
- Home recommendation/runtime logic except test fixture compatibility strictly required by the shared lesson-size type
- deployment/workflow/dependency files
- OpenPencil production design source/tokens
- unrelated route styling or visual baselines

## Runtime owners

- Backend lesson request validation and candidate limit interpretation own the API semantics.
- `LexigoLearnApp` owns the manual `/learn` size choice and explicit `All` action.
- Stage 3 Home process-aware queues remain the owner of automatic 15-item recommendations.

## Documentation owners

- OpenAPI owns the public request enum.
- `.agents/current/**` owns execution evidence for this atomic slice.

## Invariants

- `All` is never an automatic default or recommendation.
- Automatic process-aware Home creation remains exactly `lessonSize: "15"`.
- Review never fills from future-scheduled items; Study/Review/Remediation ownership is unchanged.
- Omitted `sessionKind` remains the legacy manual-composer boundary established by earlier #651 stages.
- `selection_reason`, answer-mode semantics, scheduler state transitions and review event semantics are unchanged.
- Existing route/history/PWA/accessibility contracts remain intact.

## Acceptance criteria

- Manual `/learn` exposes exactly `15`, `30`, `50`, `Все` and defaults to `15`.
- Selecting each manual size updates preview/create payloads to `"15"`, `"30"`, `"50"`, `"all"` respectively.
- Backend preview/create accepts `15`, `30`, `50`, `all`; legacy `60` and arbitrary values return `invalid_lesson_size`.
- Explicit `all` preview/create selects all candidates available to the current manual configuration after existing selector/composer rules; it is not silently capped at 50.
- Automatic Home flows continue to request a fixed 15-item block and never send `all`.
- OpenAPI documents the exact accepted size vocabulary.
- Keyboard/roving-radio semantics remain correct with four manual size choices.
- Focused tests plus immutable-head full CI are green.

## Required checks

- focused Go unit/integration tests for lesson-size validation and explicit-all limit behavior
- frontend type/unit tests
- focused Playwright `/learn` composer tests, including keyboard navigation and request payload assertions
- OpenAPI validation/generation checks
- full immutable-head PR CI
- review audit: comments/reviews/unresolved threads
- expected-head squash merge
- exact-main CI and Stage/public runtime validation because this changes backend/frontend runtime

## Risks

- Treating `all` as `0` implicitly can be ambiguous; implementation/tests must make explicit that zero means no manual cap only for the validated `all` token.
- Adding a fourth horizontal radio may expose compact/zoom layout regressions; targeted responsive/a11y checks must cover it.
- Legacy fixtures may assume `60`; update only fixtures that actually model manual lesson-size vocabulary, not unrelated numeric limits.

## Rollback

Revert the Stage 4 squash merge. The prior runtime contract remains `15 / 30 / 60`, with Stage 3 automatic Home queues unaffected.
