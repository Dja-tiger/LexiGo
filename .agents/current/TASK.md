# Current Task

## Identity

- Issue: #70.
- Branch: `style/issue-70-resource-stack-width`.
- Base SHA: `7c3684a63e415c647f0b1c7a96ac86387f79cafd`.
- Head SHA: resolve from live branch ref.
- PR: pending Draft PR.

## Objective

Eliminate the single remaining `.lx-resource-stack | width` exact-selector conflict between `mobile-pwa-fixes.css` and `adaptive-navigation.css` by making the existing tablet `width: 100%` owner explicitly depend on canonical `.lx-routed-app` ancestry, while preserving all approved compact, tablet and desktop computed widths independently of root stylesheet order.

## Scope

- Audit every live `.lx-resource-stack` renderer and prove canonical production ancestry under `.lx-routed-app`.
- Scope only the tablet `.lx-resource-stack { width: 100% }` declaration in `adaptive-navigation.css` below `.lx-routed-app`.
- Keep `.lx-async-state { width: 100% }` unchanged as a separate unresolved owner boundary.
- Extend the existing three-order Chromium cascade fixture to measure resource-stack width relative to its main-content container at 390, 719, 720, 760, 761 and 1024 px.
- Update fail-closed source contracts and parser group totals.
- Regenerate the exact manifest from parser output after the ownership correction.

## Non-goals

- No declaration-value, breakpoint, import-order or visual design change.
- No `.lx-async-state`, Scenario/Learning switch, Phrases grid, adaptive-layout, Account Security or other Issue #70 cluster change.
- No change to `mobile-pwa-fixes.css`, routed-shell chrome, route runtime, backend, API, dependencies, workflows, deployment configuration, visual snapshots, bundle budgets, tolerances or timeouts.
- No broad CSS consolidation and no Issue #70 closure in this slice.

## Allowed paths

- `.agents/current/TASK.md`;
- `.agents/current/PROGRESS.md`;
- `.agents/current/EXECUTION.md`;
- `frontend/app/adaptive-navigation.css`;
- `frontend/app/global-feature-style-overlap-manifest.json`;
- `frontend/app/global-feature-style-overlap-manifest.test.ts`;
- `frontend/components/navigation-mobile-shell-css-ownership.test.ts`;
- `frontend/e2e/navigation-mobile-shell-cascade.spec.ts`.

## Prohibited paths

- `frontend/app/mobile-pwa-fixes.css`;
- `frontend/app/system-states.css`;
- `frontend/app/premium-ui.css`;
- `frontend/app/adaptive-layout.css`;
- `frontend/app/scenario-catalog.css`;
- `frontend/app/learning-section-switch.css`;
- `frontend/app/phrases.css`;
- `frontend/app/account-security.css`;
- `frontend/app/layout.tsx`;
- route component/runtime files;
- visual snapshots and expected hashes;
- bundle budgets, workflows, dependencies, backend, API, migrations and deployment configuration.

## Runtime owners

- `mobile-pwa-fixes.css` owns the global resource-stack frame: positioning, z-index, display, compact/default max-width, gap and margin.
- `adaptive-navigation.css` owns tablet routed-shell width expansion from 720px through 1099px.
- `.lx-routed-app` is the canonical production application ancestor for Home, Learn, Progress, Dictionary, Active Lesson and compatibility fallback resource stacks.
- `system-states.css` and `.lx-async-state` remain outside this slice.

## Documentation owners

- Current task facts remain in `.agents/current/**`.
- Final merge/main/stage evidence belongs in `.agents/PROJECT_STATE.md` through a separate post-merge Agent Docs reconciliation.
- No new normative lesson is added unless CI exposes a genuinely new failure category.

## Invariants

- Root import order remains premium → mobile PWA → adaptive navigation → routed application-shell chrome.
- At widths below 720px, `.lx-resource-stack` retains `min(1160px, calc(100% - 28px))` and remains inset by 14px per side.
- From 720px through 1099px on canonical routed routes, `.lx-resource-stack` remains exactly 100% of its containing main-content width.
- Above the tablet media range, the global mobile-PWA max-width rule remains effective.
- `.lx-async-state` source and computed ownership remain unchanged.
- No `!important` is added and no media boundary is broadened.
- Production, routed-shell-first and mobile-first stylesheet orders compute identical snapshots.
- Exactly one primary navigation remains visible and no horizontal overflow is introduced at all six measured widths.

## Acceptance criteria

- The parser reports zero `mobile-pwa-fixes.css` → `adaptive-navigation.css` exact-selector conflicts.
- No new exact-selector pair is introduced.
- The manifest contains exactly 70 items: 50 `intentional`, 20 `requires-proof`, 0 `protected`.
- `adaptive-navigation.css` contains `.lx-routed-app .lx-resource-stack { width: 100%; }` only inside the existing 720–1099px media block.
- `.lx-async-state { width: 100%; }` remains textually and semantically unchanged.
- Browser proof shows compact inset behavior below 720px and container-equal width throughout 720–1099px under all three stylesheet orders.
- Full immutable-head product CI passes without baseline, budget, tolerance or timeout changes.
- PR has no unresolved comments, reviews or threads and is expected-head squash-merged.
- Exact-SHA main CI and exact-SHA stage/public validation succeed after merge.

## Required checks

- Agent Harness validation and fail-closed global overlap parser/manifest contracts.
- Frontend lint, TypeScript, full unit/source suite, production build and dependency audit.
- Focused navigation/mobile-shell Chromium computed-cascade matrix in both authoritative UI commands.
- Full Chromium/WebKit/Android/iOS browser groups, accessibility, CSP, service worker, Dictionary smoke, Lesson completion and route performance budgets.
- Authoritative Linux visual regression with unchanged approved hashes.
- Backend required gates and API/Web container builds as routed by full CI.

## Risks

- Scoping the combined `.lx-resource-stack, .lx-async-state` group without splitting it would accidentally change async-state specificity and merge two atomic slices.
- Applying the routed selector globally rather than only inside the tablet media block would remove the compact 28px inset.
- Measuring only absolute width could miss container drift; the browser proof must compare the resource stack to `.lx-main-content` in the tablet range.
- A manually filtered manifest could hide or invent conflicts; the final file must be derived from parser output.

## Rollback

Revert the focused product commit to restore the single explicitly unresolved resource-stack conflict. Do not change values, breakpoints, snapshots, hashes, tolerances, timeouts or budgets as rollback substitutes.
