# Current Task Execution

## Task

- Issue: #74
- Branch: `agent/issue-74-header-touch-targets`
- Base SHA: `c56485511c752aacd3e2f43cd0d102f229a9c25f`
- Head SHA: resolve from live branch ref
- PR: #387

## Skills used

### Live touch-target ownership audit

Purpose:

Select the first measurable Issue #74 defect from the production accessibility tree rather than from dormant component markup.

Instruction source:

- `AGENTS.md`
- `.agents/AGENTS.md`
- `.agents/AGENTS.base.md`
- `.agents/AGENTS.issue-261-css-specificity.md`
- `docs/agent-harness.md`
- Issue #74 body and testing comment

Version or verification date:

2026-08-04 exact `main` `c56485511c752aacd3e2f43cd0d102f229a9c25f`.

Inputs:

Issue #74 acceptance criteria, routed UI owners, computed CSS ownership, existing Playwright suites and the accessibility tree from authoritative CI artifacts.

Files inspected:

- `frontend/components/lexigo-dictionary-app.tsx`
- `frontend/components/calendar-reminder-route-entry.tsx`
- `frontend/components/review-outbox-runtime.tsx`
- `frontend/app/calendar-reminder-entry.css`
- `frontend/app/system-states.css`
- `frontend/app/accessibility-focus.css`
- `frontend/e2e/system-states.spec.ts`
- `frontend/e2e/accessibility-keyboard.spec.ts`
- `frontend/package.json`

Actions performed:

- Verified compact navigation already provides 48×52 px targets and 11–12 px labels.
- Confirmed the legacy Dictionary bell exists in JSX but is intentionally hidden by the later canonical route-reminder owner.
- Rejected the hidden bell as a production target.
- Located the live ReviewOutbox actions named by Issue #74, including `Подробнее`, `Обновить состояние` and `Повторить сейчас`.
- Confirmed visible action height is 40px normally and 36px inside Active Lesson, below the 44/48 minimum.
- Narrowed the slice to `.lx-review-sync__actions` only.

Commands or procedures:

Exact-ref file reads, repository search, computed-cascade ownership review, role/name mapping and live CI artifact inspection.

Artifacts produced:

Corrected `TASK.md` and a bounded eight-file implementation plan.

Result:

The atomic slice now targets a live text action that directly matches Issue #74 instead of a hidden duplicate control.

Failures:

The initial ownership audit was incomplete because it checked JSX presence without checking the later `display: none !important` owner.

Root cause:

Runtime ownership was inferred from component source rather than the final computed cascade and accessibility tree.

Fallback:

If the selected action is not exposed in a target browser, stop and inspect the project-specific accessibility snapshot rather than changing selectors or runtime semantics.

Limitations:

This slice does not close Issue #74; remaining route controls, enlarged text and physical-device acceptance remain separate work.

Reusable lesson:

A source contract must prove that a control is live and exposed, not merely that dormant JSX and an accessible label exist.

### Authoritative CI artifact diagnosis

Purpose:

Classify the two failed UI shards from CI #2728 before any retry or correction.

Instruction source:

- `gh-fix-ci` procedure
- repository CI-classification rules
- Issue #74 mobile E2E warning

Version or verification date:

2026-08-04 superseded head `7ace030a368f107f93fa7a174e05195ad6bb8eea`.

Inputs:

Workflow run `30922599313`, failed UI jobs and Playwright report artifacts.

Artifacts inspected:

- `frontend-playwright-report-ui-1`, artifact `8897981374`, digest `sha256:fb3693f653142c8b30f7c411ed686907d724b8429900f79acc7ac4ebee3f4e4d`;
- `frontend-playwright-report-ui-2`, artifact `8897961032`, digest `sha256:b8aa678b6b170c602267f0515f676579392f02b9fac7d5158c135762bf5da63b`.

Actions performed:

- Inspected desktop Chromium, iOS WebKit and Android Chromium failures.
- Verified application bootstrap and Dictionary route island were healthy.
- Verified the locator failed because no button named `Напоминание о занятии` existed in the live accessibility tree.
- Compared screenshots and accessibility snapshots with the hidden-control CSS owner.
- Classified the failure as stale test plus invalid runtime-owner selection.
- Refused blind retry, selector weakening, `.first()`, timeout increase and runtime label mutation.

Result:

CI #2728 is superseded and cannot be merge evidence. Its visual, backend and other green jobs remain diagnostic evidence only.

Failures:

The original browser contract targeted a hidden legacy control in all three browser projects.

Root cause:

The E2E was authored against dormant JSX and violated the Issue-specific instruction not to target hidden controls.

Fallback:

Use the live route reminder or another confirmed production action only after proving its actual defect; do not create a test solely to preserve the abandoned implementation.

Limitations:

Downloaded artifacts diagnose the superseded head only and do not validate the corrected implementation.

Reusable lesson:

Cross-browser agreement on a missing role/name usually indicates an ownership or selector error, not three simultaneous browser flakes.

### Paint-inert connectivity action hit surface

Purpose:

Provide a 44px fine-pointer and 48px coarse-pointer effective height for live connectivity actions while preserving the existing 40px/36px painted button boxes.

Instruction source:

- `frontend/app/system-states.css`
- `frontend/app/accessibility-focus.css`
- ReviewOutbox runtime labels
- Playwright desktop Chromium, iOS WebKit and Android Chromium project profiles

Version or verification date:

2026-08-04 branch `agent/issue-74-header-touch-targets`.

Inputs:

Live `.lx-system-connectivity .lx-review-sync__actions > button` controls and the canonical system-state layout.

Actions performed:

- Added `frontend/app/connectivity-touch-targets.css` after `system-states.css`.
- Declared a 44px default semantic target and a 48px `(pointer: coarse)` override.
- Preserved visible geometry by expanding a transparent `::before` only along the block axis with negative inset boundaries.
- Kept `inset-inline: 0`, preventing horizontal overlap between adjacent actions.
- Added no transform, background, border, shadow or new focus paint.
- Kept `accessibility-focus.css` as the sole global focus visual owner.
- Added a source contract for import order, live runtime labels, canonical 40px/36px geometry, hidden legacy absence and authoritative command registration.
- Added real offline-state hit testing against the exact `Подробнее` accessible name in desktop Chromium, iOS WebKit and Android Chromium.
- Added top/bottom perimeter `elementFromPoint`, visible-geometry, keyboard-focus and horizontal-overflow checks.
- Removed all superseded hidden Dictionary bell implementation and test artifacts from the branch.

Commands or procedures:

Unique CSS owner, negative logical insets, exact source assertions, role/name Playwright locators and keyboard-driven focus proof.

Artifacts produced:

- `frontend/app/connectivity-touch-targets.css`
- `frontend/components/connectivity-touch-target-source.test.ts`
- `frontend/e2e/connectivity-touch-targets.spec.ts`
- layout import and package command registration

Result:

The corrected implementation is present on the branch and every changed path has been read back. Authoritative CI remains pending.

Failures:

Local clone and targeted execution were unavailable because the isolated execution container could not resolve `github.com`. This is an environment limitation and is not counted as validation.

Root cause:

The live text actions had only presentation-sized 40px/36px boxes and no independent fine/coarse semantic target owner.

Fallback:

If transparent pseudo-element hit testing differs across browser engines or changes deterministic visual hashes, remove the pseudo-element and use a layout-aware wrapper rather than lowering the target minimum or promoting new baselines.

Limitations:

No merge, exact-SHA main validation, stage deployment or physical-device acceptance has occurred.

Reusable lesson:

For adjacent text actions, expand only the deficient axis. This can meet touch minimums without changing visual dimensions or creating overlapping horizontal hit areas.
