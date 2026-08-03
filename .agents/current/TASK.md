# Current Task

## Identity

- Issue: #70.
- Branch: `style/issue-70-adaptive-navigation-order-independence`.
- Base SHA: `e72e88c697ae74dc3dbdb65ed20ce640baee243d`.
- Head SHA: resolve from live branch ref.
- PR: #366 (Draft).

## Objective

Make the canonical adaptive-navigation shell owner independent of global stylesheet import order for the 26 exact-selector conflicts resolved by routed-shell specificity: 21 `premium-ui.css` → `adaptive-navigation.css` items and five navigation/mobile-shell `mobile-pwa-fixes.css` → `adaptive-navigation.css` items. Preserve the approved computed presentation at 390, 719, 720, 760, 761 and 1024 px.

## Scope

- add the existing `.lx-routed-app` production ancestor only to adaptive navigation selectors that participate in the header/navigation shell conflict cluster;
- preserve declaration values and media boundaries;
- preserve the 10 separate `premium-ui.css` → `mobile-pwa-fixes.css` conflicts for a later atomic slice;
- preserve the separate `.lx-resource-stack` width conflict between `mobile-pwa-fixes.css` and `adaptive-navigation.css` for a later width-owner slice;
- update the fail-closed overlap manifest and count contract from authoritative parser output;
- extend source and Chromium computed-cascade evidence to compare production order with an adversarial adaptive-first order;
- update current task context only.

## Non-goals

- no mobile-PWA versus premium-shell correction;
- no `.lx-resource-stack` or `.lx-async-state` width-owner correction;
- no Learning switch, Phrases grid, adaptive layout, account-security or other async-state work;
- no visual redesign, Figma change or breakpoint change;
- no runtime, route, API, backend, database, snapshot, bundle budget, workflow or dependency change.

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

- `frontend/app/premium-ui.css`;
- `frontend/app/mobile-pwa-fixes.css`;
- all other production CSS and component/runtime files;
- visual snapshots and bundle budgets;
- backend, API, migrations, deployment and workflow files;
- dependency manifests and lockfiles;
- README and architecture documentation.

## Runtime owners

- `RoutedLexigoApp` owns the `.lx-routed-app` ancestor around every canonical product route.
- `adaptive-navigation.css` owns tablet rail geometry, compact bottom navigation and adaptive header alignment/geometry.
- `mobile-pwa-fixes.css` continues to own mobile/PWA header background, logo/avatar dimensions and view spacing through 760 px.
- `premium-ui.css` remains the legacy/base shell owner outside adaptive/mobile overrides.
- `.lx-resource-stack` width remains an explicitly separate unresolved owner boundary.

## Documentation owners

- `.agents/PROJECT_STATE.md` remains unchanged until post-merge reconciliation.
- `.agents/current/**` records this active slice.
- The overlap manifest is executable evidence, not passive documentation.

## Invariants

- Production computed values remain unchanged at every existing browser-proof viewport.
- Adaptive navigation must win its shell properties even when loaded before premium and mobile stylesheets.
- Mobile-PWA versus premium-shell source-order dependency must remain explicitly visible as exactly 10 unresolved manifest items.
- The `.lx-resource-stack` mobile → adaptive width conflict must remain explicitly visible as exactly one unresolved manifest item.
- `.lx-resource-stack` and `.lx-async-state` selectors must not gain routed-shell specificity in this slice.
- No new `!important`, timeout increase, snapshot update or budget increase is permitted.
- Exactly one primary navigation is visible and no horizontal overflow occurs at every measured viewport.

## Acceptance criteria

- All 21 premium → adaptive exact-selector conflicts are absent from the parser-derived manifest.
- Five navigation/mobile-shell mobile → adaptive conflicts are absent; only the exact `.lx-resource-stack | width` item remains for that pair.
- The remaining navigation/mobile-shell manifest boundary contains exactly 10 premium → mobile items, all classified `requires-proof`.
- The total manifest contains exactly 81 items: 50 `intentional`, 31 `requires-proof`, 0 `protected`.
- Adaptive navigation conflict selectors are scoped below `.lx-routed-app` with stronger specificity than the competing unscoped selectors.
- Browser snapshots are identical under production order and adversarial adaptive-first order at 390, 719, 720, 760, 761 and 1024 px.
- Existing authoritative Linux visual hashes, accessibility checks and route-performance budgets remain unchanged.

## Required checks

- focused navigation/mobile-shell source contract;
- complete global overlap source and manifest contracts;
- frontend lint, typecheck, unit/source suite, production build and dependency audit;
- both UI shards, responsive/navigation cascade spec, accessibility and Linux visual regression;
- route performance/bundle budgets, iOS PWA, service worker and CSP;
- backend unit/security/integration and both container builds through normal full CI;
- exact immutable-head CI before Ready, empty review surface, expected-head squash merge, exact-SHA main CI and stage/public validation.

## Risks

- over-broad selector scoping could accidentally take ownership from later system-state or route-specific styles;
- an incomplete selector inventory could hide the separate resource-stack width boundary;
- adversarial CSS ordering could accidentally reverse the intentionally unresolved premium/mobile pair;
- manifest editing not derived from parser evidence could omit or retain stale conflict IDs.

## Rollback

Revert the atomic PR. No schema, API, data, snapshot, budget or dependency rollback is required.
