# Current Task

## Identity

- Issue: #74
- Branch: `agent/issue-74-header-touch-targets`
- Base SHA: `c56485511c752aacd3e2f43cd0d102f229a9c25f`
- Head SHA: resolve from live branch ref
- PR: #387

## Objective

Make shared production header controls meet minimum effective touch-target size without changing their visible icon/avatar geometry or surrounding layout.

## Scope

- Add one narrow routed stylesheet with a shared semantic target: 44 CSS px by default and 48 CSS px for coarse-pointer environments.
- Import it without reordering existing global style owners.
- Apply visually inert effective hit slop to live shared header `streak`, reminder icon and avatar buttons.
- Preserve visible dimensions, spacing and the existing global keyboard-focus owner.
- Add fail-closed source ownership evidence and real Chromium/iOS/Android hit-testing coverage.
- Register the focused browser suite in authoritative UI and accessibility CI.

## Non-goals

- No broad route-by-route control audit in this slice.
- No mobile navigation label change; current compact navigation already has 48×52 targets and 11–12 px labels.
- No text-only card/action remediation outside shared headers.
- No manual real-device acceptance claim; that remains required before Issue #74 closure.
- No new focus visual, Figma redesign, DOM change, runtime behavior, visual baseline, budget or dependency change.

## Allowed paths

- `frontend/app/header-touch-targets.css`
- `frontend/app/layout.tsx`
- `frontend/components/header-touch-target-source.test.ts`
- `frontend/e2e/header-touch-targets.spec.ts`
- `frontend/package.json`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- component JSX/TSX runtime
- existing CSS owner files and global import reordering
- visual snapshots and route budgets
- backend, API, migrations and deployment workflows
- dependencies and lockfiles
- `.agents/PROJECT_STATE.md` before product merge and stage validation

## Runtime owners

- `frontend/app/header-touch-targets.css` — routed shared header effective hit slop.
- `frontend/app/accessibility-focus.css` — unchanged global keyboard-focus visual owner.
- `frontend/components/lexigo-home-app.tsx` — interactive streak and avatar.
- `frontend/components/lexigo-dictionary-app.tsx` — reminder icon and avatar.
- routed header shells preserve existing layout and safe-area ownership.

## Documentation owners

- `.agents/current/**` during the active slice.
- `.agents/PROJECT_STATE.md` only after product merge and exact-image stage validation.

## Invariants

- Visible icon/avatar geometry, raster output and header layout footprint remain unchanged.
- Existing navigation controls remain at least 48 px in compact/rail layouts.
- Effective target is at least 44×44 with a fine pointer and 48×48 with a coarse pointer.
- Expanded targets do not overlap adjacent header controls.
- Pointer events at the expanded perimeter resolve to the intended control.
- Existing keyboard focus remains visible and no semantic role/name changes.
- The hit-slop pseudo-element has no transform, shadow, background or other painted output.
- No horizontal overflow at minimum compact widths.
- Existing global stylesheet imports remain in their current relative order.

## Acceptance criteria

- Home streak and avatar meet the effective target contract.
- Dictionary reminder icon and avatar meet the effective target contract.
- Coarse-pointer projects enforce 48 px; desktop fine-pointer enforces 44 px.
- Adjacent expanded header targets retain non-overlapping spacing.
- Source contract maps CSS owner, existing focus owner, coarse override, runtime class owners and authoritative browser registration.
- Existing visual hashes remain unchanged.
- Full immutable-head CI, expected-head merge, exact-SHA main CI and exact-image stage/public validation succeed.

## Required checks

- Frontend lint, TypeScript, Vitest source contract and production build.
- Focused desktop Chromium, iOS WebKit and Android Chromium hit-testing.
- Existing keyboard, axe, navigation, visual, performance and PWA matrices.
- Full backend/container gates required by product CI.
- Post-merge main and exact-image stage/public validation.

## Risks

- A pseudo-element may interactively overlap an adjacent control if spacing is insufficient.
- Coarse-pointer media emulation may differ across browser projects.
- Even transparent transformed layers can alter deterministic raster output; transforms and painted focus effects are prohibited in this owner.

## Rollback

Revert the narrow stylesheet/import, source/browser contracts, command registration and current Agent Harness records. No data, API or visual snapshot rollback is required.
