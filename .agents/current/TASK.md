# Current Task

## Identity

- Issue: #70
- Branch: `refactor/issue-70-phrases-cascade-independence`
- Base SHA: `8241296b4b452984534777dfa07a7a4f9b7d5b25`
- PR: pending

## Objective

Remove the remaining source-order assumption between the shared catalog base and the canonical Phrases route stylesheet without changing computed presentation.

## Verified finding

- `catalog-enhancements.css` owns the shared `.lx-catalog-sort` layout and control base.
- `phrases.css` owns route-scoped Phrases colors, surfaces, elevation, selected-topic contrast, result spacing and forced-colors behavior.
- Every overlapping Phrases override is scoped through `.lx-app[data-route-client-island="phrases"]` or a more specific Phrases owner, so it can dominate the unscoped shared base independently of source order.
- The existing ownership test still requires `catalog-enhancements.css` to load before `phrases.css`, preserving an unnecessary order contract.

## Scope

- Load `phrases.css` before `catalog-enhancements.css` as an adversarial production proof.
- Update the ownership source contract to require the inverted order and exact route-scoped cascade block.
- Record in the compatibility delivery plan that the shared base may load later because canonical overrides have higher specificity.
- Keep every CSS declaration, selector, visual baseline and route budget unchanged.

## Non-goals

- No Phrases redesign or selector rewrite.
- No baseline promotion.
- No runtime, API, backend, dependency, workflow or bundle-ceiling change.
- No cleanup of unrelated compatibility or global CSS families.

## Allowed paths

- `frontend/app/layout.tsx`
- `frontend/components/phrases-css-ownership.test.ts`
- `frontend/docs/compatibility-cleanup.md`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- All CSS files and visual snapshots.
- Runtime components and libraries.
- Backend, migrations, dependencies and permanent workflows.

## Invariants

- The exact canonical Phrases cascade block remains byte-for-byte unchanged.
- `phrases-compat.css` remains absent.
- Shared catalog layout remains available to all catalog consumers.
- All eight authoritative Phrases Linux visual hashes remain unchanged.
- Existing route bundle ceilings remain unchanged.

## Acceptance criteria

- Layout imports the route owner before the shared catalog base.
- The ownership contract rejects a return to route-after-base source-order dependency and protects the exact route-scoped overrides.
- Frontend unit, build, browser, accessibility, visual and performance gates pass without CSS or snapshot changes.
- Full authoritative CI passes on the immutable developer-authored head.
- Review audit, expected-head squash merge and exact-SHA stage/public validation complete.

## Rollback

Restore the two import lines and ownership-contract wording. No stylesheet content or product state requires migration.