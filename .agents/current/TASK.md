# Current Task

## Identity

- Issue: #74
- Branch: `fix/issue-74-final-residual-touch-targets`
- Base SHA: `e5c20118b12023ae2b961365a64e01e814be7561`
- Product head before harness checkpoint: `d40485b19f5ad6d83d69adf3130a6719b3552a16`; resolve live branch ref before merge
- PR: pending

## Objective

Close the remaining in-scope engineering touch-target gaps for Issue #74 in one bounded residual pass: active Scenario Lesson controls (including the portal safe-exit dialog) and the global Service Worker update banner.

## Scope

- Scenario Lesson `.lx-scenario button` controls.
- Scenario safe-exit portal `.lx-scenario-dialog button` controls.
- Global Service Worker update banner `.lx-sw-update button` actions.
- One interaction-only CSS owner loaded after the canonical painted owners.
- One source contract plus one cross-browser real-hit/non-overlap browser contract.
- Blocking Scenario, Service Worker, UI and accessibility command registration.

## Non-goals

- Profile controls discovered during the residual audit; they are outside the original Issue #74 affected-screen set and require a separate accessibility follow-up.
- Scenario Catalog card links; delivered by PR #458 on base SHA `e5c20118b12023ae2b961365a64e01e814be7561`.
- Any visual redesign, typography, spacing, colors, border geometry, backend/API behavior, service-worker lifecycle semantics or Scenario submission semantics.
- Physical-device acceptance; this environment cannot execute the required real-hardware validation.

## Allowed paths

- `frontend/app/issue-74-final-touch-targets.css`
- `frontend/app/layout.tsx`
- `frontend/components/issue-74-final-touch-target-source.test.ts`
- `frontend/e2e/issue-74-final-touch-targets.spec.ts`
- `frontend/package.json`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

All paths not listed above, especially canonical Scenario/SW painted CSS, runtime components, backend/API code, lockfiles, visual baselines and CI workflow definitions.

## Invariants

- Canonical Scenario button paint remains 44px minimum where originally defined; existing 52px primary/secondary controls remain unchanged.
- Canonical Service Worker update button paint remains 42px minimum.
- Fine-pointer effective targets are at least 44 CSS px; coarse-pointer targets are at least 48 CSS px.
- Expansion is transparent, borderless, shadowless and block-axis only.
- Existing accessible names, focus behavior, Scenario routing/submission semantics and Service Worker activation/defer semantics remain unchanged.
- Effective sibling targets do not overlap.

## Acceptance criteria

- Desktop Chromium, Android Chromium and iOS WebKit prove 44/48px effective geometry with four-side real hit testing for both residual families.
- Scenario safe-exit portal actions receive the same target contract and remain independent.
- Service Worker update actions remain independent.
- Source contract fails closed on import order, live owners, canonical painted sizes, paint-inert expansion and browser-command registration.
- Product diff contains only the eight allowed paths.
- Full immutable-head CI passes before expected-head squash merge.
- Exact-SHA main CI and Stage/public validation pass after merge.
- Issue #74 engineering delivery is then complete; the issue must remain explicitly hardware-blocked if the mandatory physical-device gate is still unexecuted.

## Rollback

Remove the final touch-target stylesheet, its layout import, source/browser proofs and package registrations; restore the three current Agent Harness files through the normal reconciliation lifecycle. No backend/data rollback is required.
