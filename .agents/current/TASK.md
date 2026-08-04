# Current Task

## Identity

- Issue: #70
- Branch: `agent/issue-70-async-state-width`
- Base SHA: `76f32fc40a4a07f3ecf92d86bae53c49a4509ed3`
- Head SHA: resolve from live branch ref
- PR: pending

## Objective

Make the remaining routed `.lx-async-state` tablet width deterministic and independent of the root stylesheet import order while preserving the canonical shared system-state fallback.

## Scope

- Add one stronger routed tablet width owner for `.lx-async-state` inside the existing 720–1099px adaptive-navigation boundary.
- Preserve the shared global and compact owners in `system-states.css` unchanged.
- Extend the existing navigation/mobile-shell source contract with the exact overlap, runtime ancestry, specificity and approved-value evidence.
- Extend the existing Chromium computed-cascade matrix to include `system-states.css`, production/reversed orders and the 1099/1100px ownership boundary.

## Non-goals

- No redesign, token, color, spacing, typography, state-runtime or API changes.
- No stylesheet reordering, manifest regeneration, visual baseline update or performance-budget change.
- No semantic non-identical-selector audit or final Issue #70 closure in this atomic slice.
- No dependency, backend, deployment-workflow or unrelated test changes.

## Allowed paths

- `frontend/app/adaptive-navigation.css`
- `frontend/components/navigation-mobile-shell-css-ownership.test.ts`
- `frontend/e2e/navigation-mobile-shell-cascade.spec.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- `frontend/app/system-states.css`
- `frontend/app/layout.tsx`
- `frontend/app/global-feature-style-overlap-manifest.json`
- visual snapshots and bundle budgets
- backend, API, migrations and deploy workflows

## Runtime owners

- `frontend/components/routed-lexigo-app.tsx` — stable `.lx-routed-app` ancestor.
- `frontend/components/async-state.tsx` — shared async-state renderer.
- `frontend/app/system-states.css` — canonical global and compact state presentation fallback.
- `frontend/app/adaptive-navigation.css` — routed tablet shell geometry.

## Documentation owners

- `.agents/PROJECT_STATE.md` after product merge and stage validation.
- `.agents/current/**` during the active slice.

## Invariants

- Global `.lx-async-state` remains `min(720px, calc(100% - 28px))` outside the routed tablet owner.
- Compact state geometry through 760px remains `width: 100%`.
- Routed tablet state width from 720 through 1099px equals its resource-stack width under every tested stylesheet order.
- At 1100px and above the shared bounded desktop fallback remains active.
- No `!important`, source-order dependency, visual hash, breakpoint, runtime or budget change.

## Acceptance criteria

- The single reviewed `.lx-async-state | width` exact-selector conflict remains in the fail-closed manifest as `requires-proof`.
- A stronger `.lx-routed-app .lx-async-state` owner exists once inside the existing tablet media range with `width: 100%`.
- Source evidence proves import order, fallback values, runtime ancestry, specificity and authoritative test registration.
- Chromium computed cascade is identical under production and adversarial orders at compact/tablet/desktop widths and across 1099/1100px.
- Full immutable-head CI, expected-head squash merge and exact-SHA stage/public validation succeed.

## Required checks

- Frontend source contracts and unit tests.
- Lint, TypeScript and production build.
- Navigation/mobile-shell computed-cascade Playwright proof.
- Full required frontend/backend/browser/accessibility/visual/performance/container CI.
- Exact-SHA main CI and stage/public validation after merge.

## Risks

- A selector broader than the stable routed ancestor could change compatibility fallback geometry.
- A copied fallback declaration could alter compact or desktop presentation.
- Adversarial test orders could expose an older shell ownership dependency unrelated to this selector; any failure must be classified before changes.

## Rollback

Revert the single routed selector and its companion source/browser assertions. No data, API, migration, snapshot or deployment rollback is required.
