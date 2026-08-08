# Current Task

## Identity

- Issue: #74 — Increase small touch targets and mobile labels
- Branch: `fix/issue-74-phrases-catalog-targets-v3`
- Base SHA: `faf466e56e05b6d365b8a0acf14d63a25140a36b`
- Head SHA: resolve from live branch ref after these records are committed
- PR: pending

## Objective

Close the confirmed residual Phrases catalog live-control gap in Issue #74 by preserving compact painted controls while providing at least 44 CSS px effective targets for fine pointers and 48 CSS px for coarse pointers.

## Scope

- Add a Phrases route-scoped paint-inert hit-slop owner for topic chips, catalog-kind navigation, search/lesson/reset actions, filter radio rows and pagination actions.
- Keep the topic pills at their existing document position while reserving cross-axis scrollport gutter required for the expanded hit surface.
- Increase the native Phrases filter select to 48px only for coarse pointers because native selects do not expose a reliable pseudo-element hit surface.
- Increase coarse-pointer radio-row spacing enough to keep expanded 48px targets non-overlapping.
- Add permanent browser acceptance for effective geometry, four-side hit testing, adjacent radio-row separation, focus and compact overflow.
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
- Topic pills retain their prior document position and downstream flow despite the scrollport-gutter reservation.
- Fine-pointer effective target is at least 44px; coarse-pointer target is at least 48px.
- Expanded adjacent radio-row targets do not overlap.
- Existing Phrases search-clear target remains owned by `phrases-search-clear-touch-targets.css` and is not duplicated here.
- Accessible names, focus behavior and catalog callbacks remain unchanged.
- Security dependency versions from #431 remain unchanged.

## Acceptance criteria

- Phrases topic chips expose at least 44/48px effective hit surfaces while retaining 36px painted height and contained hit geometry.
- Filter radio rows expose at least 44/48px effective hit surfaces with positive separation from adjacent rows on fine-pointer desktop and coarse-pointer 820px touch layout.
- Catalog-kind and 44px action controls expose at least 44/48px effective targets.
- Native sort select is at least 44px fine / 48px coarse.
- Four perimeter hit-test points resolve to the owning pseudo-expanded control.
- Keyboard focus remains visible and 320px/390px compact layouts have no horizontal overflow.
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
- Compensating negative margin must preserve the previous topic-pill document position and not create target overlap with preceding content.
- Browser scrolling must account for the pseudo target before perimeter `elementFromPoint` checks.
- Native form controls require real geometry rather than pseudo hit slop.
- An unregistered standalone Playwright spec can silently avoid authoritative CI.

## Rollback

Remove the dedicated Phrases catalog target stylesheet/import, browser spec and collection entries while preserving all previously delivered Issue #74 slices.
