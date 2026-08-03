# Current Task

## Identity

- Issue: #70
- Branch: `test/issue-70-navigation-mobile-cascade-evidence`
- Base SHA: `626b6f637f517253aea87faf12223e4e43bfc1e0`
- PR: #364 — Draft
- Published proof head before PR-context reconciliation: `68354842757262e4cc025230dfafc956ca5c8eae`
- Final developer-authored head: resolve from the live PR after current-context commits complete

## Objective

Create fail-closed source and browser evidence for the navigation/mobile-shell computed cascade before any production CSS correction.

The exact-selector manifest proves 37 unresolved conflicts across `premium-ui.css`, `mobile-pwa-fixes.css` and `adaptive-navigation.css`. At 720–760 px, the mobile PWA and tablet adaptive media queries overlap. The current header combines geometry from the later adaptive owner with background/logo/avatar values from mobile PWA fixes.

This slice records that actual computed ownership at 390px, 719px, 720px, 760px, 761px and 1024px. Production CSS remains unchanged.

## Scope

- Add `frontend/components/navigation-mobile-shell-css-ownership.test.ts`.
- Read the durable global overlap manifest and require the exact 37 navigation/mobile-shell items and three owner-pair counts.
- Prove the root import order and exact overlapping media boundaries from current source.
- Protect the exact declarations that create the 720–760 px hybrid computed owner.
- Add `frontend/e2e/navigation-mobile-shell-cascade.spec.ts`.
- Load the actual production base/token/premium/mobile/adaptive stylesheets into an isolated browser fixture in production order.
- Assert visible primary-navigation mode and computed header/logo/avatar/brand values at the six target widths.
- Route the new spec through the authoritative UI and responsive Playwright scripts in `frontend/package.json`.
- Record exact execution evidence in `.agents/current/**`.

## Non-goals

- No production CSS, import order, selector, declaration, component/runtime TypeScript/TSX, markup, route, API/backend/database, session or Figma change.
- No dependency version or lockfile change; `frontend/package.json` changes only the existing test scripts.
- No snapshot, route-budget, workflow, README or architecture change.
- No decision yet about whether the canonical correction is media-boundary separation, route-scoped specificity, owner consolidation or declaration migration.
- No Learning switch, Phrases grid, adaptive layout, account-security or async-state work.
- Do not close Issue #70 in this proof slice.

## Allowed paths

- `frontend/components/navigation-mobile-shell-css-ownership.test.ts`
- `frontend/e2e/navigation-mobile-shell-cascade.spec.ts`
- `frontend/package.json`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

Every path not listed above, especially all production CSS/TSX, lockfiles, snapshots, `frontend/bundle-budgets.json`, workflows, dependencies, README, architecture and `.agents/PROJECT_STATE.md`.

## Invariants

- The global overlap manifest remains the source of truth for the 37 unresolved items.
- Expected owner-pair counts are exactly:
  - `premium-ui.css` → `adaptive-navigation.css`: 21;
  - `premium-ui.css` → `mobile-pwa-fixes.css`: 10;
  - `mobile-pwa-fixes.css` → `adaptive-navigation.css`: 6.
- Root import order remains premium → mobile PWA → adaptive navigation for this evidence slice.
- Browser fixture additionally loads actual `globals.css` and `design-tokens.css` before the three owners so box-sizing and document tokens match production base semantics.
- Mobile PWA fixes apply through 760px.
- Adaptive compact navigation applies through 719px.
- Adaptive tablet navigation applies from 720px through 1099px.
- At 720px and 760px, computed header geometry is adaptive while background/logo/avatar sizing remains mobile PWA-owned.
- At 761px, mobile PWA values no longer apply and premium base values remain under adaptive tablet geometry.
- Existing navigation functionality, safe-area behavior, target sizes, visual baselines and route budgets remain unchanged.

## Acceptance criteria

- Final diff contains only the six allowed paths.
- Source contract proves the exact 37-item/three-pair manifest boundary, import order, media overlap and declaration inventory.
- Browser contract covers 390, 719, 720, 760, 761 and 1024 px in Chromium.
- Browser contract proves exactly one visible primary navigation at each width and no horizontal overflow.
- Computed values fail closed on current owner drift at the 719/720 and 760/761 boundaries.
- `test:e2e:ui` and `test:e2e:responsive` both include the new spec exactly once.
- Frontend lint, typecheck, full unit suite, production build and dependency audit pass on the final immutable head.
- Complete classifier-selected browser/accessibility/visual/performance/backend/container CI passes without snapshot, budget or timeout changes.
- Review surface is empty before Ready.
- Expected-head squash merge, exact-SHA main CI and exact-SHA stage/public validation complete before reconciliation.

## Next boundary

After this proof PR and reconciliation, use the evidence to select exactly one production correction for navigation/mobile-shell ownership. Do not combine other conflict clusters.

## Rollback

Revert PR #364. Product CSS, runtime, deployed images, schemas, data, snapshots and budgets remain unchanged.
