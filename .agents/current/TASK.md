# Current Task

## Identity

- Issue: #70.
- Branch: `style/issue-70-mobile-pwa-shell-order-independence`.
- Base SHA: `1030ef2decd970251846650371c18ed8ff9f0ba1`.
- Head SHA: resolve from live branch ref.
- PR: #368 (Draft).

## Objective

Eliminate the ten remaining `premium-ui.css` → `mobile-pwa-fixes.css` exact-selector shell conflicts by consolidating their responsive property ownership in `premium-ui.css`, while preserving the approved compact, 720–760 px tablet/mobile-PWA overlap and Home presentation independently of root stylesheet order.

## Scope

- Consolidate the responsive values for `.lx-header` background/min-height, `.lx-logo-mark` width/height, `.lx-avatar` width/height and `.lx-view` padding-top into the existing `premium-ui.css` `max-width: 760px` owner.
- Remove those duplicate visual/property owners from `mobile-pwa-fixes.css`.
- Retain only compact safe-area/header geometry in mobile PWA styles through 719px.
- Preserve `adaptive-navigation.css` as the tablet geometry owner from 720px through 1099px.
- Preserve `adaptive-knowledge-coach-home.css` as the stronger routed Home chrome owner.
- Add a mobile-first adversarial browser cascade order in addition to production and adaptive-first orders.
- Regenerate the exact overlap manifest from parser output after the corrected ownership mechanism is applied.

## Non-goals

- No redesign, visual-baseline update, tolerance change, timeout change or route-budget change.
- No change to `.lx-resource-stack`, `.lx-async-state`, `adaptive-navigation.css`, Home declaration values or the remaining exact-selector clusters.
- No dependency, backend, database, API, deployment, service-worker or route-runtime change.
- No broad global CSS consolidation or Issue #70 closure.

## Allowed paths

- `.agents/current/TASK.md`;
- `.agents/current/PROGRESS.md`;
- `.agents/current/EXECUTION.md`;
- `frontend/app/premium-ui.css`;
- `frontend/app/mobile-pwa-fixes.css`;
- `frontend/app/global-feature-style-overlap-manifest.json`;
- `frontend/app/global-feature-style-overlap-manifest.test.ts`;
- `frontend/components/navigation-mobile-shell-css-ownership.test.ts`;
- `frontend/e2e/navigation-mobile-shell-cascade.spec.ts`.

## Prohibited paths

- `frontend/app/adaptive-navigation.css`;
- `frontend/app/adaptive-knowledge-coach-home.css`;
- `frontend/app/layout.tsx`;
- visual snapshots and expected hashes;
- bundle budgets;
- workflows, dependencies, backend, API, migrations and deployment configuration;
- all unrelated route and feature stylesheets.

## Runtime owners

- `premium-ui.css` owns the base shell and the ten approved responsive shell-property values through 760px.
- `mobile-pwa-fixes.css` owns compact safe-area/header geometry through 719px plus session/PWA responsibilities.
- `adaptive-navigation.css` owns tablet header geometry from 720px through 1099px through higher routed-shell specificity.
- `adaptive-knowledge-coach-home.css` remains the higher-specificity routed Home chrome owner, including Home header background and 34×34 logo.
- `.lx-routed-app` remains the canonical product-route ancestor.

## Documentation owners

- Current task facts remain in `.agents/current/**`.
- Final delivery evidence belongs in `.agents/PROJECT_STATE.md` through a separate post-merge Agent Docs reconciliation.
- No new normative lesson is added unless CI exposes a genuinely new failure category.

## Invariants

- Root production import order remains premium → mobile PWA → adaptive → Home presentation.
- Generic compact/mobile computed values remain: header 58px, `-14px` margin, 12px safe-area padding, `rgba(5, 9, 20, 0.96)` background; logo 30×38; avatar 42×42; view padding 18px.
- At 720–760px adaptive geometry remains 76px, zero margin and zero top padding, while generic mobile background/logo/avatar/view values remain effective.
- Routed Home background and 34×34 logo remain stronger than generic mobile values at every applicable width.
- Above 760px premium base background/logo/avatar/view values remain effective outside stronger routed feature owners.
- Exactly one primary navigation is visible and no horizontal overflow is introduced at 390, 719, 720, 760, 761 and 1024 px.
- `.lx-resource-stack | width` remains the sole mobile-PWA → adaptive exact-selector conflict.
- No `!important` is added and no existing media breakpoint is broadened.

## Acceptance criteria

- The parser reports zero `premium-ui.css` → `mobile-pwa-fixes.css` exact-selector conflicts.
- The correction creates no new exact-selector conflicts with `adaptive-knowledge-coach-home.css` or another stylesheet.
- The manifest contains exactly 71 items: 50 `intentional`, 21 `requires-proof`, 0 `protected`.
- Production, adaptive-first and mobile-first browser orders produce identical approved generic-shell snapshots at all six boundary widths.
- Source contracts require premium responsive-property ownership, compact-only mobile geometry and the unchanged resource-stack boundary.
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

- Route-scoping generic mobile visual values creates equal-selector conflicts with the later Home owner and can make Home depend on source order.
- Leaving the values duplicated across premium and mobile preserves the original ten-item ownership ambiguity.
- Moving compact margin/padding into the premium owner could broaden generic responsive behavior beyond the existing PWA geometry contract.
- A stale manually edited manifest could hide or invent conflicts; it must match parser output exactly.

## Rollback

Revert the focused product commit to restore the prior ten-item unresolved boundary. Do not update snapshots, hashes, tolerances, breakpoints or expected computed values as rollback substitutes.
