# Current Task

## Identity

- Issue: #571
- Branch: fix/issue-571-tablet-layout
- Base SHA: 157c645731604fb39488068397472994b2ea67d1
- Head SHA: resolve from live branch ref
- PR:

## Objective

Repair the three genuine 768px production presentation defects reproduced by Issue #568 / Draft PR #570: Learn composer collapse, Phrases catalog squeeze and Profile content/rail overlap, while preserving existing route state/API/design ownership.

## Scope

- `frontend/app/adaptive-lesson-composer.css`: add a tablet-rail presentation bridge for 720–1099px so the outer composer becomes one usable column without changing mobile disclosure semantics.
- `frontend/app/phrases.css`: stack filters and results during the tablet-rail interval while keeping filters available.
- `frontend/app/profile.css`: restore the tablet RouteChrome content offset that the route-specific profile margin currently overrides.
- Extend existing computed-cascade regression suites for the exact 768px ownership conditions.
- Manually inspect Linux 768×1024 Light/Dark actuals for the three repaired routes before approving any changed fingerprint.

## Non-goals

- Backend/API/schema/session/history changes.
- OpenPencil/Figma/token/screen-map changes.
- Global RouteChrome redesign or breakpoint topology changes.
- Learn state/disclosure/business-logic changes.
- Hiding Phrases filters merely to fit tablet width.
- Profile account/security mutation changes.
- Blind visual baseline updates.

## Allowed paths

- `frontend/app/adaptive-lesson-composer.css`
- `frontend/app/phrases.css`
- `frontend/app/profile.css`
- `frontend/e2e/adaptive-layout-cascade.spec.ts`
- `frontend/e2e/phrases-grid-cascade.spec.ts`
- `frontend/e2e/account-security-width-cascade.spec.ts`
- existing route-owned runtime visual test only if an affected reviewed fingerprint must change
- `.agents/current/**`

## Prohibited paths

- backend and API owners
- `frontend/components/**`
- `design/**`
- `docs/figma/openpencil-screen-map.json`
- route-navigation topology/CSS unless a new exact defect proves it necessary
- `.github/workflows/**`
- deployment configuration
- unrelated route tests/styles

## Invariants

- Tablet rail remains owned by `RouteChrome` on 720–1099px.
- Learn source/mode/size/session behavior is unchanged; only outer presentation changes.
- Phrases filtering/search/catalog data ownership is unchanged and all filter controls remain reachable.
- Profile preferences/account/security behavior is unchanged.
- Compact <=719px and desktop >=1100px contracts remain stable.
- Light/Dark and reduced-motion semantics remain token-owned.
- Runtime evidence must be manually reviewed before hash approval.

## Acceptance criteria

- `/learn` at 768×1024 has a readable one-column outer composer and no character-by-character collapse.
- `/phrases` at 768×1024 stacks filters/results without squeezing cards; filters remain usable.
- `/profile` main content starts after the fixed tablet rail and is not clipped/covered.
- No horizontal overflow or clipped route/focus geometry for all three routes.
- Existing compact/mobile and desktop presentation remains stable.
- Computed-cascade tests fail closed on the exact breakpoint/offset regression.
- Full immutable-head CI passes.
- After merge, exact-main CI and exact-SHA Stage/public validation pass.

## Rollback

Revert this responsive presentation slice only. Audit PR #570 remains separate and will be reconstructed/re-run on the corrected runtime base.