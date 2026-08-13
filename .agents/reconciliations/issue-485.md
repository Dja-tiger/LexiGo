# Issue #485 delivery reconciliation

Verified on 2026-08-13.

## Product delivery

- Parent: #25.
- Issue: #485 — private custom-word ownership and scheduler enrollment.
- Product PR: #486.
- Final developer-authored PR head: `961af65b1236aae3a31903082ec83de915f20d6e`.
- Immutable-head CI: #3382 / run `31697344589` — `success`.
- Squash merge SHA: `53e16a00e2bbe70921c1c5220923faee1f63bc37`.
- Exact-main CI: #3383 / run `31698264559` — `success`.
- Exact-SHA Deploy Stage: #3225 / run `31699086579` — `success`.
- Stage public frontend/API smoke passed.
- Public Chromium + iOS WebKit acceptance passed all 12 runtime checks.
- Latest deployed product SHA after this delivery: `53e16a00e2bbe70921c1c5220923faee1f63bc37`.
- Issue #485 is closed as completed; parent #25 remains open.

## Durable contract

Phase 2 adds private owner-scoped custom `word` rows to the existing `words` table and enrolls each item into the existing `user_words` scheduler transactionally. Shared rows remain ownerless. Public list/detail/metadata exclude private rows; authenticated reads admit only shared or current-owner rows. Account-scoped duplicate detection, active-lesson-safe deletion, cascade cleanup and shared catalog seed compatibility are delivered and covered by tests.

Phase 2 intentionally does not include custom phrases, glossary import/export, microphone/pronunciation UI or listening-first presentation.

## Next independently unblocked product slice

Issue #489 owns #25 Phase 3: bounded, versioned custom-word glossary import/export. It must reuse the Phase 2 ownership/validation/scheduler path, perform all-or-nothing batch import, export portable content without scheduler/account internals and remain backend/API-only.

Listening-first UI and microphone/privacy remain separate phases.

## Figma / #201 parallel finding

The 2026-08-13 offline `LexiGo Design System.fig` audit resolved existing First Use node GUIDs including `79:46`, `68:117`, `69:429`, `98:7`, `82:3` and `82:20`, but the supplied snapshot still has no canonical Guest Home, onboarding desktop/Dark or diagnostic-state production frames. #201 therefore remains design-gated for those states.

## Harness reset

Branch `docs/issue-485-post-merge-reconcile` resets `.agents/current/TASK.md`, `PROGRESS.md` and `EXECUTION.md` to the exact canonical template blobs before Phase 3 starts.

`PROJECT_STATE.md` is intentionally not destructively rewritten by this connector session: the available GitHub read response truncates the large existing blob, so byte-preserving append cannot be proven. This reconciliation file preserves the new delivery evidence without deleting or shortening any historical `PROJECT_STATE.md` records. A future repository-native reconciliation may promote this block into `PROJECT_STATE.md` when a full local checkout or non-truncating blob read is available.
