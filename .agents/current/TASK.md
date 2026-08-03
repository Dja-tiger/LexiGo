# Current Task

## Identity

- Issue: #70.
- Branch: `style/issue-70-mobile-pwa-shell-order-independence`.
- Base SHA: `1030ef2decd970251846650371c18ed8ff9f0ba1`.
- Head SHA: resolve from live branch ref.
- PR: #368 (Draft).

## Objective

Eliminate the ten remaining `premium-ui.css` → `mobile-pwa-fixes.css` exact-selector shell conflicts by removing mobile declarations that are already unreachable beneath the stronger routed-shell chrome owner and by explicitly scoping the remaining effective mobile properties, while preserving the approved production presentation independently of root stylesheet order.

## Scope

- Remove mobile header background and logo width/height declarations that are already superseded on every production route by `adaptive-knowledge-coach-home.css` routed-shell selectors.
- Keep compact header geometry, including 58px min-height and safe-area spacing, under `.lx-routed-app .lx-header` through 719px.
- Keep avatar 42×42 and view padding-top 18px under routed-shell selectors through 760px.
- Preserve `adaptive-navigation.css` as tablet geometry owner from 720px through 1099px.
- Preserve `adaptive-knowledge-coach-home.css` as routed application-shell chrome owner for header background and 34×34 logo.
- Extend the adversarial browser proof to load the actual routed-shell chrome stylesheet and compare production, shell-first and mobile-first orders.
- Regenerate the exact overlap manifest from parser output after the corrected ownership mechanism is applied.

## Non-goals

- No redesign, declaration-value change for a live production owner, visual-baseline update, tolerance change, timeout change or route-budget change.
- No change to `.lx-resource-stack`, `.lx-async-state`, `premium-ui.css`, `adaptive-navigation.css`, `adaptive-knowledge-coach-home.css` or the remaining exact-selector clusters.
- No dependency, backend, database, API, deployment, service-worker or route-runtime change.
- No broad global CSS consolidation or Issue #70 closure.

## Allowed paths

- `.agents/current/TASK.md`;
- `.agents/current/PROGRESS.md`;
- `.agents/current/EXECUTION.md`;
- `frontend/app/mobile-pwa-fixes.css`;
- `frontend/app/global-feature-style-overlap-manifest.json`;
- `frontend/app/global-feature-style-overlap-manifest.test.ts`;
- `frontend/components/navigation-mobile-shell-css-ownership.test.ts`;
- `frontend/e2e/navigation-mobile-shell-cascade.spec.ts`.

## Prohibited paths

- `frontend/app/premium-ui.css`;
- `frontend/app/adaptive-navigation.css`;
- `frontend/app/adaptive-knowledge-coach-home.css`;
- `frontend/app/layout.tsx`;
- visual snapshots and expected hashes;
- bundle budgets;
- workflows, dependencies, backend, API, migrations and deployment configuration;
- all unrelated route and feature stylesheets.

## Runtime owners

- `adaptive-knowledge-coach-home.css` owns routed application-shell chrome, including header background and 34×34 logo, across canonical routes.
- `mobile-pwa-fixes.css` owns compact safe-area/header geometry through 719px, avatar dimensions and view spacing through 760px, plus session/PWA responsibilities.
- `adaptive-navigation.css` owns tablet header geometry from 720px through 1099px.
- `premium-ui.css` remains the compatibility/base shell owner outside stronger routed and responsive selectors.
- `.lx-routed-app` remains the canonical production application ancestor.

## Documentation owners

- Current task facts remain in `.agents/current/**`.
- Final delivery evidence belongs in `.agents/PROJECT_STATE.md` through a separate post-merge Agent Docs reconciliation.
- No new normative lesson is added unless CI exposes a genuinely new failure category.

## Invariants

- Root production import order remains premium → mobile PWA → adaptive → routed application-shell chrome.
- Routed shell header background remains `color-mix(in srgb, var(--ak-bg) 90%, transparent)` and routed logo remains 34×34 at every applicable width.
- Compact header geometry remains 58px, `-14px` horizontal margin and 12px safe-area top padding through 719px.
- Avatar remains 42×42 and view padding remains 18px through 760px.
- At 720–760px adaptive geometry remains 76px, zero margin and zero top padding.
- Above 760px premium avatar/view base values remain effective outside stronger routed feature owners.
- Exactly one primary navigation is visible and no horizontal overflow is introduced at 390, 719, 720, 760, 761 and 1024 px.
- `.lx-resource-stack | width` remains the sole mobile-PWA → adaptive exact-selector conflict.
- No `!important` is added and no existing media breakpoint is broadened.

## Acceptance criteria

- The parser reports zero `premium-ui.css` → `mobile-pwa-fixes.css` exact-selector conflicts.
- The correction creates no new exact-selector conflicts with `adaptive-knowledge-coach-home.css` or another stylesheet.
- The manifest contains exactly 71 items: 50 `intentional`, 21 `requires-proof`, 0 `protected`.
- Production, shell-first and mobile-first browser orders produce identical routed-shell computed snapshots at all six boundary widths.
- Source contracts require routed-shell background/logo ownership, compact-only mobile geometry and the unchanged resource-stack boundary.
- Full immutable-head required CI passes without retry-driven source changes or baseline updates.
- PR has no unresolved comments, reviews or threads and is squash-merged with expected head SHA.
- Exact-SHA main CI and exact-SHA stage/public validation succeed after product merge.

## Required checks

- Agent Harness validation and fail-closed global overlap parser/manifest contracts.
- Frontend lint, TypeScript, full unit/source suite, production build and dependency audit.
- Focused navigation/mobile-shell Chromium computed-cascade matrix.
- Full Chromium/WebKit/Android/iOS browser groups, accessibility, CSP, service worker, Dictionary smoke, Lesson completion and route performance budgets.
- Authoritative Linux visual regression with unchanged approved hashes.
- Backend required gates and API/Web container builds as routed by full CI.

## Risks

- Treating the routed application-shell stylesheet as Home-only would create three new equal-selector conflicts and make chrome depend on source order.
- Removing avatar dimensions or view spacing would change live mobile presentation because the routed-shell chrome owner does not replace those properties.
- Leaving dead background/logo declarations in mobile preserves misleading ownership even if production specificity currently masks them.
- A stale manually edited manifest could hide or invent conflicts; it must match parser output exactly.

## Rollback

Revert the focused product commit to restore the prior ten-item unresolved boundary. Do not update snapshots, hashes, tolerances, breakpoints or expected computed values as rollback substitutes.
