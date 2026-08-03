# Current Task

## Identity

- Issue: #70.
- Branch: `style/issue-70-mobile-pwa-shell-order-independence`.
- Base SHA: `1030ef2decd970251846650371c18ed8ff9f0ba1`.
- Head SHA: resolve from live branch ref.
- PR: Draft PR to be created after the bounded implementation is read back and compared.

## Objective

Make the ten remaining `premium-ui.css` → `mobile-pwa-fixes.css` exact-selector shell conflicts independent of accidental root stylesheet order while preserving the currently approved computed presentation at compact, 720–760 px tablet/mobile-PWA overlap and above-760 widths.

## Scope

- Correct only the ten manifest conflicts for `.lx-header`, `.lx-logo-mark`, `.lx-avatar` and `.lx-view`.
- Split compact header geometry from the mobile visual owner so adaptive tablet geometry remains authoritative at 720–760 px.
- Scope mobile visual values below the existing `.lx-routed-app` ancestor without changing declaration values.
- Add a mobile-first adversarial browser cascade order in addition to production and adaptive-first orders.
- Regenerate the exact overlap manifest and fail-closed counts after this pair disappears.

## Non-goals

- No redesign, declaration-value change, visual-baseline update, tolerance change, timeout change or route-budget change.
- No change to `.lx-resource-stack`, `.lx-async-state`, `adaptive-navigation.css`, premium feature presentation or the remaining exact-selector clusters.
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
- `frontend/app/layout.tsx`;
- visual snapshots and expected hashes;
- bundle budgets;
- workflows, dependencies, backend, API, migrations and deployment configuration;
- all unrelated route and feature stylesheets.

## Runtime owners

- `.lx-routed-app` remains the canonical product-route ancestor.
- `mobile-pwa-fixes.css` owns compact header geometry through 719px and mobile visual header/logo/avatar/view values through 760px.
- `adaptive-navigation.css` remains the tablet header geometry owner from 720px through 1099px.
- `premium-ui.css` remains the desktop/base owner and becomes effective again above 760px for mobile visual values.

## Documentation owners

- Current task facts remain in `.agents/current/**`.
- Final delivery evidence belongs in `.agents/PROJECT_STATE.md` through a separate post-merge Agent Docs reconciliation.
- No new normative lesson is added unless CI exposes a genuinely new failure category.

## Invariants

- Root production import order remains premium → mobile PWA → adaptive.
- Compact/mobile computed values remain: header 58px, `-14px` margin, 12px safe-area padding, `rgba(5, 9, 20, 0.96)` background; logo 30×38; avatar 42×42; view padding 18px.
- At 720–760px adaptive geometry remains 76px, zero margin and zero top padding, while mobile background/logo/avatar/view values remain effective.
- Above 760px premium background/logo/avatar/view values remain effective.
- Exactly one primary navigation is visible and no horizontal overflow is introduced at 390, 719, 720, 760, 761 and 1024 px.
- `.lx-resource-stack | width` remains the sole mobile-PWA → adaptive exact-selector conflict.
- No `!important` is added and no existing media breakpoint is broadened.

## Acceptance criteria

- The parser reports zero `premium-ui.css` → `mobile-pwa-fixes.css` exact-selector conflicts.
- The manifest contains exactly 71 items: 50 `intentional`, 21 `requires-proof`, 0 `protected`.
- Production, adaptive-first and mobile-first browser orders produce identical approved snapshots at all six boundary widths.
- Source contracts require routed mobile visual ownership, compact-only header geometry and the unchanged resource-stack boundary.
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

- Raising specificity on the complete mobile header block would override adaptive tablet geometry when mobile loads after adaptive.
- Leaving compact geometry at the 760px boundary would preserve semantic overlap with the adaptive 720–760px owner.
- Scoping the standalone padding rule through 760px could reintroduce an adaptive-first PWA order dependency.
- A stale manually edited manifest could hide or invent conflicts; it must match parser output exactly.

## Rollback

Revert the focused product commit to restore the prior ten-item unresolved boundary. Do not update snapshots, hashes, tolerances, breakpoints or declaration values as rollback substitutes.
