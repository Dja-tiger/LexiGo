# Current Task

## Identity

- Issue: #70
- Branch: `refactor/issue-70-active-lesson-css-ownership`
- Base SHA: `a605aadcc4cc7fb4355962d73e854960714b9800`
- Head SHA: resolve from live branch ref
- PR: pending

## Objective

Replace the misleading generic `system-states-lesson.css` ownership boundary with an explicitly route-scoped Active Lesson queued-state stylesheet without changing selectors, declarations, cascade order or visual behavior.

## Scope

- Add `frontend/app/active-lesson-queued-state.css` with byte-equivalent CSS declarations.
- Replace the root layout import while preserving its position after `active-lesson.css`.
- Delete `frontend/app/system-states-lesson.css`.
- Convert the existing proof into a fail-closed ownership and retired-path contract.

## Non-goals

- No selector, declaration, specificity or responsive behavior change.
- No merge into the 777-line canonical stylesheet in this slice.
- No runtime, API, History, storage or lesson-domain change.
- No visual baseline, bundle-budget or workflow change.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/app/layout.tsx`
- `frontend/app/active-lesson-queued-state.css`
- `frontend/app/system-states-lesson.css`
- `frontend/components/active-lesson-css-boundary.test.ts`

## Prohibited paths

- `.github/workflows/**`
- other frontend stylesheets or runtime sources
- visual snapshots and bundle budgets
- backend, API, migrations and deployment files

## Runtime owners

- `frontend/components/lexigo-active-lesson-app.tsx` remains the route runtime owner.
- `frontend/components/active-lesson-presentation.tsx` remains the queued-review markup owner.
- `frontend/app/active-lesson.css` remains the canonical base presentation owner.
- `frontend/app/active-lesson-queued-state.css` becomes the explicit queued-state presentation owner.

## Documentation owners

- `.agents/current/**` records this atomic slice.
- `frontend/docs/compatibility-cleanup.md` remains unchanged until post-merge reconciliation.

## Invariants

- Exact queued-review CSS declarations remain unchanged.
- Import position remains after `active-lesson.css`.
- Forced-colors Canvas/Highlight behavior remains unchanged.
- The generic retired path must not exist or be imported.

## Acceptance criteria

- Layout imports the route-scoped file exactly once after `active-lesson.css`.
- The generic stylesheet path is absent.
- Source contract proves exact consumer and bounded ownership.
- Final compare contains only declared paths.
- Required full CI and visual/browser evidence pass on immutable head.

## Required checks

- Change-scope classification.
- Frontend lint, TypeScript, unit/source tests, production build and dependency audit.
- Complete browser, accessibility, visual, performance and container CI required by classification.
- Review/comments/threads audit and expected-head squash merge.
- Exact-SHA stage/public validation if deployment classification requires it.

## Risks

- A rename can accidentally alter cascade order if the root import moves; the source contract asserts the ordering.
- Pure CSS ownership cleanup must not promote visual baselines.

## Rollback

Squash-revert the PR, restoring the original filename and import. No data or API rollback is required.
