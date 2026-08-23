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
- Ensure newly-created `50` and `all` lessons remain readable by the dedicated Active Lesson route instead of being normalized back to the legacy fallback size.
- Keep UI labels/estimated-duration copy truthful for numeric sizes and explicit `All`.
- Keep the four manual size choices in a balanced four-column row wherever the existing horizontal size control is rendered, instead of inheriting the legacy three-column grid and orphaning `Все` on a second row.
- Update focused backend/frontend/browser/accessibility/visual contract tests required by the changed behavior.

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
- `frontend/components/lexigo-active-lesson-app.tsx` only for the downstream `lessonSizeFromAPI` compatibility parser required to consume the new Stage 4 values
- `frontend/app/adaptive-lesson-composer.css` only for the two `.lx-size-control` grid-template declarations proven by exact Linux CI #4064 screenshots to retain the legacy three-column layout
- focused frontend component/unit/e2e tests that validate the `/learn` lesson-size control, Active Lesson size parsing, keyboard semantics, preview/create payloads and route behavior
- existing visual fingerprints/snapshots only after exact Linux evidence proves the remaining `/learn` delta is intentional after the four-column layout regression is corrected
- `frontend/e2e/learn-browser-zoom.spec.ts` and `frontend/e2e/issue-603-browser-zoom-reflow.spec.ts` only to reconcile the two CI #4069 assertions that still encode three lesson-size columns after runtime correctly moved to four
- `frontend/e2e/route-tablet-parity.spec.ts`, `frontend/e2e/route-transition-runtime-visual.spec.ts`, `frontend/e2e/visual-regression.spec.ts`, `frontend/e2e/issue-603-browser-zoom-reflow.spec.ts`, and `frontend/e2e/route-browser-zoom-parity.spec.ts` only to replace the 15 exact `/learn` hashes reviewed from Linux CI #4069 / run `32648333357` on head `c4d52f51f944ba0d29c52e0707425ed2473e0267`, preserving the unchanged reviewed dimensions and updating provenance only for those `/learn` entries
- `.github/workflows/temporary-issue-651-stage4-exact-rewrite.yml` **only as a one-shot, exact-anchor, path-guarded large-file rewrite helper for explicitly authorized large files (`api/openapi.yaml`, `frontend/e2e/learn-browser-zoom.spec.ts`, `frontend/components/lexigo-active-lesson-app.tsx`, `frontend/app/adaptive-lesson-composer.css`, and the five proven visual fingerprint owners listed above plus `frontend/e2e/issue-603-browser-zoom-reflow.spec.ts`); for the CI #4069 reconciliation it may change only the two stale 3→4 test assertions and the 15 reviewed `/learn` hash/provenance entries, must fail closed on anchor/count drift, and must be deleted before the final developer-authored candidate and final immutable-head CI, leaving zero workflow diff**

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
- `LexigoActiveLessonApp` owns dedicated-route parsing of newly-created `50`/`all` lessons and historical `60` lessons.
- `adaptive-lesson-composer.css` owns the responsive geometry of the existing horizontal size control; Stage 4 changes only its column count from the obsolete three-option contract to four.
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
- Newly-created `50` and `all` active lessons retain their exact size semantics across the `/learn` → `/lesson/active` handoff.
- The fourth manual size option must not create a one-item orphan row at compact, tablet or desktop widths; touch-target minima and 200% reflow remain intact.
- `selection_reason`, answer-mode semantics, scheduler state transitions and review event semantics are unchanged.
- Existing route/history/PWA/accessibility contracts remain intact.

## Acceptance criteria

- Manual `/learn` exposes exactly `15`, `30`, `50`, `Все` and defaults to `15`.
- Selecting each manual size updates preview/create payloads to `"15"`, `"30"`, `"50"`, `"all"` respectively.
- Backend preview/create accepts `15`, `30`, `50`, `all`; legacy `60` and arbitrary values return `invalid_lesson_size`.
- Explicit `all` preview/create selects all candidates available to the current manual configuration after existing selector/composer rules; it is not silently capped at 50.
- Automatic Home flows continue to request a fixed 15-item block and never send `all`.
- Previously persisted active lessons with `lessonSize="60"` remain readable; this compatibility does not leak `60` back into new manual choices or API write validation.
- Newly-created `lessonSize="50"` and `lessonSize="all"` remain exact when consumed by the dedicated Active Lesson route.
- The size control renders four equal columns instead of the legacy three-column grid, with no orphan `Все` row at wide/tablet widths and no horizontal overflow at compact/200% reflow.
- OpenAPI documents the exact accepted write vocabulary.
- Keyboard/roving-radio semantics remain correct with four manual size choices.
- Focused tests plus immutable-head full CI are green.
- Final PR inventory contains no `.github/workflows/**` diff.

## Required checks

- focused Go unit/integration tests for lesson-size validation and explicit-all limit behavior
- frontend type/unit tests
- focused Playwright `/learn` composer tests, including keyboard navigation and exact preview/create request payload assertions
- focused source/runtime proof for dedicated Active Lesson size parsing of 50/all plus historical 60
- source contract proving both size-control responsive declarations use four columns and retain minimum touch-target heights
- OpenAPI validation/generation checks
- true-browser-zoom `/learn` contract updated to the new default without weakening its geometry/focus assertions
- exact Linux visual review after layout correction before any fingerprint refresh
- CI #4069 evidence must remain the sole source for the 15 refreshed `/learn` hashes: dimensions are unchanged after the CSS repair, and no unrelated route baseline may change
- full immutable-head PR CI after the temporary helper is removed
- review audit: comments/reviews/unresolved threads
- expected-head squash merge
- exact-main CI and Stage/public runtime validation because this changes backend/frontend runtime

## Risks

- Treating `all` as `0` implicitly can be ambiguous; implementation/tests must make explicit that zero means no manual cap only for the validated `all` token.
- Adding a fourth horizontal radio may expose compact/zoom layout regressions; targeted responsive/a11y checks must cover it.
- Retaining the legacy `repeat(3, ...)` grid after adding the fourth choice produces a deterministic orphan `Все` row (+56 px on 768/1440 Linux fingerprints); this is a product layout defect, not a baseline to approve.
- Removing `60` from a shared read type breaks already-created active lessons; write vocabulary and persisted read compatibility must remain separate.
- Adding `50` to writes without adding it to the Active Lesson read parser silently normalizes a valid new session back to 30.
- Legacy fixtures may assume `60`; update only fixtures that model new manual preview/create vocabulary, not unrelated numeric limits or historical read paths.
- Large-file connector replacement is unsafe without exact anchoring; the temporary helper must fail closed on count mismatch, touch only explicitly authorized files, and be deleted before final acceptance.

## Rollback

Revert the Stage 4 squash merge. The prior new-manual contract remains `15 / 30 / 60`, with Stage 3 automatic Home queues unaffected. Historical active lessons require no data rewrite either way.
