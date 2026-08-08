# Current Task

## Identity

- Issue: #74 — Increase small touch targets and mobile labels
- Branch: `fix/issue-74-phrases-catalog-targets-v3`
- Base SHA: `faf466e56e05b6d365b8a0acf14d63a25140a36b`
- Head SHA: resolve from live branch ref
- PR: #442

## Objective

Close the confirmed residual Phrases catalog live-control gap in Issue #74 by preserving compact painted controls while providing at least 44 CSS px effective targets for fine pointers and 48 CSS px for coarse pointers.

## Scope

- Add a Phrases route-scoped paint-inert hit-slop owner for topic chips, catalog-kind navigation, search/lesson/reset actions, filter radio rows and pagination actions.
- Keep topic pills at their existing document position while reserving cross-axis scrollport gutter required for the expanded hit surface.
- Preserve the native sort select at its approved 44px painted geometry while expanding its semantic wrapping-label target to 48px for coarse pointers with real clickable padding and compensated outer flow.
- Increase coarse-pointer radio-row spacing enough to keep expanded 48px targets non-overlapping.
- Preserve the compact search submit's canonical absolute positioning and desktop positioned containing block while giving it an independent 44/48px effective target owner.
- Add permanent browser acceptance for effective geometry, four-side hit testing, adjacent radio-row separation, semantic sort-label activation, focus and compact overflow.
- Register the acceptance in authoritative UI and accessibility browser collections.

## Non-goals

- No catalog data, filtering, navigation, lesson-composition or API behavior changes.
- No redesign or typography changes.
- No dependency or lockfile changes.
- No visual snapshot changes.
- No `.agents/PROJECT_STATE.md` change in this product PR.
- No claim of final physical-device acceptance.

## Allowed paths

- `frontend/app/phrases-catalog-touch-targets.css`
- `frontend/app/layout.tsx`
- `frontend/e2e/phrases-catalog-touch-targets.spec.ts`
- `frontend/package.json` — test collection only
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- `.agents/PROJECT_STATE.md` in this product PR.
- Backend/API/migrations.
- Dependency versions or `frontend/package-lock.json`.
- Existing visual snapshots.
- Non-Phrases route owners.

## Runtime owners

- `frontend/components/phrases-catalog.tsx`
- `frontend/components/catalog-kind-navigation.tsx`
- `frontend/components/catalog-pagination.tsx`
- `frontend/app/phrases.css`
- `frontend/app/information-architecture.css`
- `frontend/app/premium-ui.css`
- `frontend/app/phrases-catalog-touch-targets.css`
- `frontend/app/layout.tsx`
- `frontend/e2e/phrases-catalog-touch-targets.spec.ts`
- `frontend/package.json` browser collections

## Documentation owners

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Invariants

- Topic-chip and radio-row painted height remains 36px.
- Compact search submit remains absolute inside the search field at its approved 36px painted height; compact lesson action remains at least its 40px minimum.
- Desktop search submit remains positioned relative so its absolute pseudo target is contained by the button rather than the search container.
- Native sort select remains 44px painted while its coarse semantic label target is at least 48px and forwards activation to the select.
- Topic pills retain their prior document position and downstream flow despite the scrollport-gutter reservation.
- Fine-pointer effective target is at least 44px; coarse-pointer target is at least 48px.
- Expanded adjacent radio-row targets do not overlap.
- Existing Phrases search-clear target remains owned by `phrases-search-clear-touch-targets.css` and is not duplicated here.
- Accessible names, focus behavior and catalog callbacks remain unchanged.
- Security dependency versions from #431 remain unchanged.

## Acceptance criteria

- Phrases topic chips expose at least 44/48px effective hit surfaces while retaining 36px painted height and contained hit geometry.
- Filter radio rows expose at least 44/48px effective hit surfaces with positive separation from adjacent rows on fine-pointer desktop and coarse-pointer 820px touch layout.
- Catalog-kind and compact/search/lesson actions expose at least 44/48px effective targets while preserving canonical painted geometry.
- Compact search submit computes to `position: absolute`; desktop submit computes to `position: relative` for pseudo-target containment.
- Native sort select remains at least 44px painted; its wrapping label is at least 48px on coarse pointers, and clicking label padding outside the select focuses the select.
- Four perimeter hit-test points resolve to the owning pseudo-expanded controls.
- Keyboard focus remains visible and 320px/390px compact layouts have no horizontal overflow.
- Existing Phrases content-addressed Light/Dark compact/desktop baselines remain unchanged and true 200% browser-zoom no-overlap remains green.
- Acceptance runs on desktop Chromium, Android Chromium and iOS WebKit through authoritative UI/a11y collections.

## Required checks

- Frontend lint/typecheck/unit/build and production dependency audit.
- Authoritative UI/a11y browser matrix including the new acceptance.
- Full immutable-head CI including visual, performance, CSP, PWA and container gates.
- Clean review/thread audit before Ready.
- Expected-head squash merge.
- Exact-SHA main CI and exact-image Stage/public validation.

## Risks

- Pseudo hit slop can be clipped by overflow containers or intercept neighbouring controls if scrollport gutter/spacing is insufficient.
- Mixed `:is()` selectors can inherit maximum argument specificity and silently override responsive geometry owners.
- Compensating padding/margins must preserve previous painted positions and total outer flow.
- Semantic label padding must be an actual hit surface and activate/focus the wrapped native select.
- Fixed mobile navigation can occlude valid targets unless viewport-relative hit probes center the owner first.
- An unregistered standalone Playwright spec can silently avoid authoritative CI.

## Rollback

Remove the dedicated Phrases catalog target stylesheet/import, browser spec and collection entries while preserving all previously delivered Issue #74 slices.
