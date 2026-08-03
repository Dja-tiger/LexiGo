# Current Task Progress

## Status

- Active Issue #70 proof-only slice: navigation/mobile-shell computed-cascade evidence.
- Branch: `test/issue-70-navigation-mobile-cascade-evidence`.
- Verified base and merge base: `626b6f637f517253aea87faf12223e4e43bfc1e0`.
- Draft PR: #364.
- Initial immutable candidate: `afce1afd42afc5e206edd9f52d94ae358b11f1eb`.
- Browser-fixture correction commits: `45de7c33618ef9d7d49135c308c2f6335cee8c59` and `c83c31e3783a0ef42700063cd892a7415b1fd222`.
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
- Source contract requires the exact 37-item/three-pair manifest boundary, import order, media boundaries and declaration inventory.
- Source contract verifies the browser spec appears exactly once in `test:e2e:ui` and `test:e2e:responsive`.
- Added `frontend/e2e/navigation-mobile-shell-cascade.spec.ts`.
- Browser fixture loads actual `globals.css`, `design-tokens.css`, `premium-ui.css`, `mobile-pwa-fixes.css` and `adaptive-navigation.css` in production order.
- The fixture is a complete HTML document with `width=device-width, initial-scale=1`, so mobile-emulation layout viewport equals the requested Playwright viewport.
- Chromium computed-style matrix covers 390, 719, 720, 760, 761 and 1024 px.
- Matrix records header min-height, margin, padding and background; brand/header-tools alignment; logo/avatar dimensions; view top padding; visible navigation mode; horizontal overflow.
- Updated `frontend/package.json` test scripts only; no package version, lockfile or dependency changed.

## Initial authoritative CI — classified failure

- CI #2596 / run `30812873755` ran on initial candidate `afce1afd42afc5e206edd9f52d94ae358b11f1eb`.
- Frontend core passed: lint, typecheck, source/unit suite, production build and dependency audit.
- Backend unit/security/integration, Dictionary smoke, controlled service worker, iOS PWA, CSP, accessibility, visual regression, performance budgets, Lesson completion and UI shard 1 passed.
- UI shard 2 job `91683942785` failed only in the new cascade spec.
- Playwright artifact `frontend-playwright-report-ui-2` proved the spec was executing in `android-chromium`.
- The isolated HTML lacked a viewport meta tag. Android Chromium therefore used the default approximately 980px layout viewport despite `page.setViewportSize` values 390–760px.
- The browser correctly applied tablet navigation/premium values in that invalid fixture; this was not a production CSS defect and not evidence to change expected ownership.
- The fix adds a production-equivalent viewport meta tag and fail-closes its presence in the source contract.
- No blind retry, expectation weakening, CSS change, timeout increase, snapshot update or budget increase was used.

## Repository safety

- Every write used the explicit task branch.
- Direct writes to `main` were not used.
- Parallel Dependabot PRs #304–#306 remain untouched.
- No production correction is included in this proof slice.
- The failure correction changes only proof files and current-context documentation.

## Validation pending

- Freeze the new live PR head after current-context reconciliation.
- Require full classifier-selected CI on that exact immutable head.
- Require source/unit, lint, typecheck, build, dependency audit, complete browser/accessibility/visual/performance/backend/container gates.
- No snapshot, budget, timeout, workflow or dependency adjustment is permitted.
- Review surface must be empty before Ready and expected-head merge.
- Validate exact merge SHA in main CI and stage/public deployment.

## Next boundary

After PR #364 and reconciliation, choose one production correction for navigation/mobile-shell ownership using the corrected computed evidence. Do not combine any other conflict cluster.

## Rollback

Revert PR #364. Product CSS, runtime, deployed images, schemas, data, snapshots and budgets remain unchanged.
