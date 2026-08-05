# Current Task

## Identity

- Issue: #74 — increase small touch targets and mobile labels.
- Branch: `fix/issue-74-phrases-search-clear-target`
- Base SHA: `6d55091e55d2ac1340a15c4179b02f206605d4dd`
- Head SHA: resolve from live branch ref after the final evidence update.
- PR: #407 — Draft.

## Objective

Guarantee a 44×44 CSS px fine-pointer and 48×48 CSS px coarse-pointer effective hit surface for the live `/phrases` icon action `Очистить поиск`, while preserving its 36×36 painted dimensions, accessible name, callback, empty-search visual baseline, desktop layout, route/history ownership and visual styling. On compact layouts, eliminate the pre-existing painted overlap with `Найти` and reserve matching input clearance only while the clear action exists.

## Scope

- Add one route-scoped correction owner for `.lx-phrases-search-clear`.
- Direct inline hit-slop expansion toward the search field and away from the adjacent submit action.
- On widths up to 767px, move the rendered 36px clear action from `right: 70px` to `right: 80px`.
- While that action is present, increase input `padding-right` from 108px to 120px through `.lx-phrases-search:has(.lx-phrases-search-clear)`; restore 108px automatically when search is empty.
- Keep the existing conditional runtime owner and `onSearchClear` callback unchanged.
- Add a fail-closed source ownership contract.
- Add desktop Chromium, Android Chromium and iOS WebKit proof at desktop, 390px and 320px widths.
- Keep the proof in blocking UI and accessibility commands.
- Record the active atomic slice in `.agents/current/**`.

## Non-goals

- Do not change search semantics, URL/history state, catalog API calls, focus ownership or route navigation.
- Do not change topic chips, sidebar radio labels, search submit dimensions, lesson action, pagination or detail controls.
- Do not change the visible × glyph, button dimensions, colors, borders, shadows, desktop positioning or desktop input padding.
- Do not modify the original `phrases.css` owner; the bounded route-scoped layer overrides only the compact values proven invalid by browser geometry.
- Do not update visual baselines. The empty-search catalog must remain byte-identical, and rendered-search geometry is proven by the dedicated browser contract.
- Do not close Issue #74; whole-application 200% zoom and physical-device acceptance remain separate work.

## Allowed paths

- `frontend/app/phrases-search-clear-touch-targets.css`
- `frontend/app/layout.tsx`
- `frontend/components/phrases-search-clear-touch-target-source.test.ts`
- `frontend/e2e/phrases-search-clear-touch-targets.spec.ts`
- `frontend/package.json`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- `frontend/components/phrases-catalog.tsx`
- `frontend/components/lexigo-phrases-app.tsx`
- `frontend/app/phrases.css`
- backend, migrations, API contracts, dependencies, lockfiles, workflows, deployment files and unrelated documentation.
- Dependabot PRs #304, #305 and #403.

## Runtime owners

- `frontend/components/phrases-catalog.tsx` conditionally exposes the button with exact accessible name `Очистить поиск` and callback `onSearchClear`.
- `frontend/app/phrases.css` owns the 36×36 painted box, base/desktop positioning, 48px search field, empty compact input padding and Phrases focus visuals. Its legacy compact clear offset remains the upstream presentation default.
- `frontend/app/phrases-search-clear-touch-targets.css` owns the transparent effective event surface, the bounded compact clear offset `right: 80px` and the rendered-only `:has(...)` input clearance `padding-right: 120px`.
- `frontend/components/lexigo-phrases-app.tsx` continues to own search state, URL/history synchronization and clear behavior.

## Documentation owners

- `.agents/current/TASK.md` owns the bounded task contract.
- `.agents/current/PROGRESS.md` owns chronological evidence and CI state.
- `.agents/current/EXECUTION.md` owns tool/procedure provenance and limitations.
- `.agents/PROJECT_STATE.md` is unchanged until product merge, exact-SHA main CI and exact-image stage/public validation complete.

## Invariants

- The target remains absent when the search field is empty.
- The target remains a native button with accessible name `Очистить поиск`.
- Fine-pointer effective dimensions are at least 44×44 CSS px; coarse-pointer dimensions are at least 48×48 CSS px.
- The transparent target remains inside the 48px search field and does not overlap the visible `Найти` action.
- On compact layouts with a rendered clear action, the painted clear and submit boxes have at least 3 CSS px separation and the input reserves 120 CSS px on the trailing edge.
- On compact empty search, the input retains the original 108 CSS px trailing padding and the content-addressed Light/Dark baselines remain unchanged.
- All four target perimeter points resolve to the clear button.
- The painted clear button remains 36×36; desktop geometry and all visual styling remain unchanged.
- `/phrases` search, filters, URL, Back/Forward, scroll restoration and detail return remain unchanged.
- `main` remains at the exact base SHA until expected-head merge.

## Acceptance criteria

- Source contract proves exact route/runtime selector ownership, import order, directional logical insets, 44/48 tokens, exact compact `right: 80px`, rendered-only `:has(...)` `padding-right: 120px` correction and absence of any other painted-geometry declarations.
- Browser proof passes in desktop Chromium, Android Chromium and iOS WebKit.
- Browser proof covers 1440px desktop plus 390px and 320px compact widths, empty/active/restored input clearance, painted/effective geometry, transparent pseudo surface, all perimeter hits, input containment, painted/target submit separation, focus-visible, callback behavior and no horizontal overflow.
- Compact Phrases Light and Dark content-addressed visual baselines remain byte-identical.
- Frontend lint, TypeScript, unit/source contracts, production build and dependency audit pass.
- Full required browser, accessibility, visual, performance and container/backend gates pass on an immutable final PR head.
- PR is expected-head squash-merged only after no comments, reviews or unresolved threads remain.
- Exact-SHA main CI and exact-image stage/public validation succeed before the product slice is declared complete.

## Required checks

- Read-back of every changed file and exact base-to-head compare.
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run test:e2e:ui`
- `npm run test:e2e:a11y`
- Authoritative repository CI full product matrix.
- Post-merge exact-SHA main CI, immutable image publication and Deploy Stage public smoke/browser validation.

## Risks

- A pseudo-element may be visually transparent but fail hit-testing in one browser engine.
- Symmetric expansion overlaps `Найти`; CI #2875 proved this on Android Chromium and iOS WebKit.
- Directional expansion alone is insufficient because legacy compact painted boxes already overlap by about 6 CSS px; CI #2880 proved the underlying placement defect.
- Unconditional 120px input clearance changes empty-search placeholder rasterization; CI #2886 proved a 62-pixel content-addressed visual difference in both Light and Dark compact baselines.
- The bounded compact offset must remain synchronized with rendered-state input clearance and current submit typography; blocking browser geometry guards both widths and engines.
- `:has()` is required only in the supported current Chromium/WebKit browser matrix and is explicitly exercised by UI shard 2.
- An overly broad selector could affect hidden, stale or unrelated Phrases controls.
- Replacing `package.json` or `layout.tsx` could accidentally alter unrelated command/import order; exact compare and source contracts must fail closed.

## Rollback

Expected-head revert of the product squash commit restores the previous Phrases interaction surface and compact placement. No data migration, API rollback, cache invalidation or storage cleanup is required.
