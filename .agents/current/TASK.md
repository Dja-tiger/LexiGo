# Current Task

## Identity

- Issue: #571
- Branch: fix/issue-571-tablet-layout
- Base SHA: 157c645731604fb39488068397472994b2ea67d1
- Head SHA: resolve from live branch ref
- PR: #572

## Objective

Repair the three genuine 768px production presentation defects reproduced by Issue #568 / Draft PR #570: Learn composer collapse, Phrases catalog squeeze and Profile content/rail overlap, while preserving existing route state/API/design ownership.

## Scope

- `frontend/app/adaptive-lesson-composer.css`: add a tablet-rail presentation bridge for 768–1099px so the outer composer becomes one usable column without changing compact/mobile disclosure semantics.
- `frontend/app/phrases-tablet-layout.css`: route-scoped companion layout that stacks filters/results only during the RouteChrome tablet interval while keeping filters available.
- `frontend/app/profile-tablet-layout.css`: route-scoped companion layout that restores the tablet RouteChrome content offset after Profile's centered-content rule.
- `frontend/app/layout.tsx`: import each companion immediately after its route owner.
- Extend `frontend/e2e/adaptive-layout-cascade.spec.ts` with fail-closed 768px computed-layout contracts for Learn, Phrases and Profile.
- `frontend/e2e/visual-regression.spec.ts`: update only the manually reviewed existing Learn medium fingerprint produced by exact Linux CI #3707.
- `frontend/e2e/tablet-layout-visual.spec.ts`: add fail-closed 768×1024 Light/Dark real-browser evidence for the two routes that had no existing medium visual baseline (`/phrases`, `/profile`).
- `frontend/playwright.visual.config.ts`: collect the targeted tablet visual spec in the existing visual suite; viewport semantics remain unchanged.
- Manually inspect exact Linux actuals for every changed/added fingerprint before approval.

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
- `frontend/app/phrases-tablet-layout.css`
- `frontend/app/profile-tablet-layout.css`
- `frontend/app/layout.tsx`
- `frontend/e2e/adaptive-layout-cascade.spec.ts`
- `frontend/e2e/visual-regression.spec.ts`
- `frontend/e2e/tablet-layout-visual.spec.ts`
- `frontend/playwright.visual.config.ts`
- `.agents/current/**`

## Prohibited paths

- backend and API owners
- `frontend/components/**`
- base `frontend/app/phrases.css` and `frontend/app/profile.css` after root-cause inspection; their tablet compatibility is intentionally isolated in scoped companion owners
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
- Compact/mobile <=719px and desktop >=1100px contracts remain stable; the existing 720–767 feature-specific compact behavior is not broadened accidentally.
- Light/Dark and reduced-motion semantics remain token-owned.
- Runtime evidence must be manually reviewed before hash approval.
- `--update-snapshots` is not an approval mechanism.

## Acceptance criteria

- `/learn` at 768×1024 has a readable one-column outer composer and no character-by-character collapse.
- `/phrases` at 768×1024 stacks filters/results without squeezing cards; filters remain usable.
- `/profile` main content starts after the fixed tablet rail and is not clipped/covered.
- No horizontal overflow or clipped route/focus geometry for all three routes.
- Existing compact/mobile and desktop presentation remains stable.
- Computed-cascade tests fail closed on the exact breakpoint/offset regression.
- Exact Linux visual evidence is manually reviewed before Learn/Phrases/Profile medium fingerprints are approved.
- Full immutable-head CI passes.
- After merge, exact-main CI and exact-SHA Stage/public validation pass.

## Rollback

Revert this responsive presentation slice only. Audit PR #570 remains separate and will be reconstructed/re-run on the corrected runtime base.