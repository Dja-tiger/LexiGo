# Current Task

## Identity

- Issue: #70.
- Branch: `style/issue-70-resource-stack-width`.
- Base SHA: `7c3684a63e415c647f0b1c7a96ac86387f79cafd`.
- Head SHA: resolve from live branch ref.
- PR: #370 (Draft).

## Objective

Make the production tablet `.lx-resource-stack` width independent of global stylesheet import order while preserving the existing unscoped resource/async fallback contract for compatibility contexts.

## Scope

- Audit every live `.lx-resource-stack` renderer and prove canonical production ancestry under `.lx-routed-app`.
- Preserve the existing tablet fallback group `.lx-resource-stack, .lx-async-state { width: 100%; }`.
- Add a stronger `.lx-routed-app .lx-resource-stack { width: 100%; }` owner inside the existing 720–1099px media block.
- Keep `.lx-async-state` specificity and ownership unchanged.
- Measure resource-stack width relative to `.lx-main-content` at 390, 719, 720, 760, 761 and 1024 px under three stylesheet orders.
- Keep the reviewed 71-item parser manifest unchanged; the single mobile/adaptive resource-stack item remains explicitly classified `requires-proof` and is satisfied by this source/browser contract.

## Non-goals

- No declaration-value, breakpoint, import-order or visual-design change.
- No `.lx-async-state`, Scenario/Learning switch, Phrases grid, adaptive-layout, Account Security or other Issue #70 cluster change.
- No manifest schema/content rewrite, mobile-PWA edit, route-runtime edit, backend/API/dependency/workflow/deployment change, snapshot/budget/tolerance/timeout change.
- No Issue #70 closure in this slice.

## Allowed paths

- `.agents/current/TASK.md`;
- `.agents/current/PROGRESS.md`;
- `.agents/current/EXECUTION.md`;
- `frontend/app/adaptive-navigation.css`;
- `frontend/app/global-feature-style-overlap-manifest.test.ts`;
- `frontend/components/navigation-mobile-shell-css-ownership.test.ts`;
- `frontend/e2e/navigation-mobile-shell-cascade.spec.ts`.

## Prohibited paths

- `frontend/app/global-feature-style-overlap-manifest.json`;
- `frontend/app/mobile-pwa-fixes.css`;
- `frontend/app/system-states.css`;
- all unrelated route/feature styles, runtime files, snapshots, budgets, workflows, dependencies, backend, API, migrations and deployment configuration.

## Runtime owners

- `mobile-pwa-fixes.css` owns the global/default resource-stack frame and 28px inset.
- `adaptive-navigation.css` keeps the unscoped tablet compatibility fallback for resource stack and async state.
- `.lx-routed-app .lx-resource-stack` is the canonical production tablet owner from 720px through 1099px.
- `.lx-async-state` remains a separate unresolved shared-state boundary.

## Documentation owners

- Current task facts remain in `.agents/current/**`.
- Final merge/main/stage evidence belongs in `.agents/PROJECT_STATE.md` through a separate post-merge Agent Docs reconciliation.

## Invariants

- Root import order remains premium → mobile PWA → adaptive navigation → routed application-shell chrome.
- Below 720px resource stack retains `min(1160px, calc(100% - 28px))`.
- From 720px through 1099px on canonical routes resource stack equals its main-content width under every tested stylesheet order.
- The compatibility fallback and `.lx-async-state` declaration remain textually unchanged.
- Above 1099px the global mobile-PWA max-width rule remains effective.
- No `!important` or broader media boundary is added.
- Exactly one primary navigation remains visible and no horizontal overflow is introduced.

## Acceptance criteria

- The parser still matches the reviewed 71-item manifest exactly: 50 intentional, 21 requires-proof, 0 protected.
- The manifest keeps exactly one `mobile-pwa-fixes.css` → `adaptive-navigation.css` item for `.lx-resource-stack | width`.
- Source contracts require both the compatibility fallback and the stronger routed production owner.
- Browser proof shows compact inset behavior below 720px and container-equal width throughout 720–1099px under production, routed-shell-first and mobile-first orders.
- Full immutable-head product CI passes without baseline, budget, tolerance or timeout changes.
- PR has no unresolved review surface and is expected-head squash-merged.
- Exact-SHA main CI and exact-SHA stage/public validation succeed after merge.

## Required checks

- Agent Harness and fail-closed overlap parser/manifest contracts.
- Frontend lint, TypeScript, full unit/source suite, production build and dependency audit.
- Focused Chromium computed-cascade matrix plus complete browser, visual, accessibility, CSP, PWA, Dictionary, Lesson and performance gates.
- Backend required gates and API/Web container builds.

## Risks

- Removing the unscoped fallback would silently narrow compatibility behavior.
- Scoping `.lx-async-state` would merge a separate ownership problem into this slice.
- Measuring only absolute width could hide container drift; the proof compares bounding widths directly.

## Rollback

Revert the focused product commit to remove the stronger routed owner and its proof. Do not alter values, breakpoints, snapshots, hashes, tolerances, timeouts or budgets as rollback substitutes.
