# Current Task Progress

## Status

- Active Issue #70 proof-only slice: navigation/mobile-shell computed-cascade evidence.
- Branch: `test/issue-70-navigation-mobile-cascade-evidence`.
- Verified base and merge base: `626b6f637f517253aea87faf12223e4e43bfc1e0`.
- Draft PR: #364.
- Published proof head before PR-context reconciliation: `68354842757262e4cc025230dfafc956ca5c8eae`.
- Latest branch commit after linking the PR in `TASK.md`: `83bc47032a81eb840ae23235893c358520202735`.
- Production CSS, runtime, routes, snapshots, budgets and dependencies remain unchanged.

## Confirmed boundary

- The durable global manifest contains exactly 37 unresolved navigation/mobile-shell conflicts:
  - `premium-ui.css` → `adaptive-navigation.css`: 21;
  - `premium-ui.css` → `mobile-pwa-fixes.css`: 10;
  - `mobile-pwa-fixes.css` → `adaptive-navigation.css`: 6.
- Root import order is premium → mobile PWA → adaptive navigation.
- Mobile PWA fixes apply through 760px.
- Adaptive compact navigation applies through 719px.
- Adaptive tablet navigation applies from 720px through 1099px.
- Therefore 720–760 px is an exact overlap range.
- In that range, adaptive navigation wins header geometry and alignment because it is imported later, while mobile PWA remains the only owner of header background, logo size, avatar size and view top padding.

## Completed implementation

- Added `frontend/components/navigation-mobile-shell-css-ownership.test.ts`.
- Source contract reads the reviewed global manifest and requires the exact 37-item/three-pair boundary.
- Source contract verifies current import order, all three media boundaries and the exact declarations that produce the hybrid owner.
- Source contract verifies the new browser spec appears exactly once in `test:e2e:ui` and `test:e2e:responsive`.
- Added `frontend/e2e/navigation-mobile-shell-cascade.spec.ts`.
- Browser fixture loads actual `globals.css`, `design-tokens.css`, `premium-ui.css`, `mobile-pwa-fixes.css` and `adaptive-navigation.css` in production order.
- Minimal markup uses production class names for app/header/brand/logo/avatar/header tools/header nav/rail/mobile nav/resource stack/async state/view.
- Chromium computed-style matrix covers 390, 719, 720, 760, 761 and 1024 px.
- Matrix records header min-height, margin, padding and background; brand/header-tools alignment; logo/avatar dimensions; view top padding; visible navigation mode; horizontal overflow.
- At 720/760 the expected state is explicitly hybrid: adaptive geometry with mobile PWA background/logo/avatar/view values.
- At 761 the mobile PWA values stop applying and premium base background/logo/avatar/view values return under adaptive geometry.
- Updated `frontend/package.json` test scripts only:
  - `test:e2e:ui` includes the new spec;
  - `test:e2e:responsive` includes the new spec.
- No package version, lockfile or dependency changed.
- Published Draft PR #364 with exact evidence, scope, non-goals, required validation and rollback.

## Repository safety

- Every write used the explicit task branch.
- Compare against exact base reported six allowed paths and zero commits behind before PR publication.
- Direct writes to `main` were not used.
- Parallel Dependabot PRs #304–#306 remain untouched.
- No production correction is included in this proof slice.
- A failed container checkout due unavailable DNS produced no repository write; repository reads/writes continued through the GitHub connector.

## Validation pending

- Complete current-context reconciliation and freeze the resulting live PR head.
- Require full classifier-selected CI on that exact immutable head.
- Require source/unit, lint, typecheck, build, dependency audit, complete browser/accessibility/visual/performance/backend/container gates.
- No snapshot, budget, timeout, workflow or dependency adjustment is permitted.
- Review surface must be empty before Ready and expected-head merge.
- Validate exact merge SHA in main CI and stage/public deployment.

## Next boundary

After PR #364 and reconciliation, choose one production correction for navigation/mobile-shell ownership using the computed evidence. Do not combine any other conflict cluster.

## Rollback

Revert PR #364. Product CSS, runtime, deployed images, schemas, data, snapshots and budgets remain unchanged.
