# Current Task

## Identity

- Issue: #74 — increase small touch targets and mobile labels.
- Branch: `fix/issue-74-phrases-search-clear-target`
- Base SHA: `6d55091e55d2ac1340a15c4179b02f206605d4dd`
- Head SHA: resolve from live branch ref after the final evidence update.
- PR: #407 — Draft.

## Objective

Guarantee a 44×44 CSS px fine-pointer and 48×48 CSS px coarse-pointer effective hit surface for the live `/phrases` icon action `Очистить поиск`, while preserving its existing 36×36 painted box, accessible name, callback, input geometry, submit-action separation, route/history ownership and visual baselines.

## Scope

- Add one route-scoped interaction-only CSS owner for `.lx-phrases-search-clear`.
- Direct inline hit-slop expansion toward the search field and away from the adjacent submit action.
- Keep the existing conditional runtime owner and `onSearchClear` callback unchanged.
- Add a fail-closed source ownership contract.
- Add desktop Chromium, Android Chromium and iOS WebKit proof at desktop, 390px and 320px widths.
- Keep the proof in blocking UI and accessibility commands.
- Record the active atomic slice in `.agents/current/**`.

## Non-goals

- Do not change search semantics, URL/history state, catalog API calls, focus ownership or route navigation.
- Do not change topic chips, sidebar radio labels, search submit, lesson action, pagination or detail controls.
- Do not change the visible × glyph, colors, dimensions, padding, margins, borders, shadows or responsive positioning.
- Do not update visual snapshots unless authoritative visual CI proves an intentional painted difference; no painted difference is expected.
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
- `frontend/app/phrases.css` owns the 36×36 painted box, absolute positioning, 48px search field, responsive `right` offsets and Phrases focus visuals.
- `frontend/app/phrases-search-clear-touch-targets.css` owns only the transparent effective event surface and directs its inline expansion toward the input.
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
- All four target perimeter points resolve to the clear button.
- Existing painted geometry and visual snapshots remain unchanged.
- `/phrases` search, filters, URL, Back/Forward, scroll restoration and detail return remain unchanged.
- `main` remains at the exact base SHA until expected-head merge.

## Acceptance criteria

- Source contract proves exact route/runtime selector ownership, import order, directional logical insets, 44/48 tokens and absence of painted-geometry declarations.
- Browser proof passes in desktop Chromium, Android Chromium and iOS WebKit.
- Browser proof covers 1440px desktop plus 390px and 320px compact widths, painted/effective geometry, transparent pseudo surface, all perimeter hits, input containment, submit separation, focus-visible, callback behavior and no horizontal overflow.
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
- Inline expansion may overlap `Найти` unless the target is expanded only toward the search field; CI #2875 proved symmetric expansion is invalid on Android Chromium and iOS WebKit.
- An overly broad selector could affect hidden, stale or unrelated Phrases controls.
- Replacing `package.json` or `layout.tsx` could accidentally alter unrelated command/import order; exact compare and source contracts must fail closed.

## Rollback

Expected-head revert of the product squash commit restores the previous Phrases interaction surface. No data migration, API rollback, cache invalidation or storage cleanup is required.
