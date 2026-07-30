# Current Task

## Identity

- Issue: #70
- Branch: `refactor/issue-70-remove-home-compatibility`
- Base SHA: `dbb7d04c083cc266ab3f9247564a7b293e32d272`
- Head SHA: resolve from live branch ref
- PR: pending

## Objective

Remove only the unreachable legacy Home presentation from `LexigoPremiumApp` now that PR #311 proves `/` selects `LexigoHomeApp` before the compatibility fallback.

## Scope

- Delete `renderHome` and the `navigation.view === "home"` compatibility dispatch branch.
- Remove only imports/constants that become provably orphaned by that deletion.
- Convert the Home source contract from candidate-presence evidence to absence/preservation evidence.
- Update the compatibility cleanup plan and current execution memory.

## Non-goals

- No deletion or extraction of `LexigoPremiumApp` itself.
- No changes to guest authentication, account recovery, unknown-route fallback, Learn, Library, Profile, Active Lesson or Lesson Result behavior.
- No CSS cleanup, redesign, visual baseline promotion, API/backend/workflow changes or bundle-ceiling changes.
- No work on unrelated dependency PRs.

## Allowed paths

- `frontend/components/lexigo-premium-app.tsx`
- `frontend/components/home-route-island-source.test.ts`
- `frontend/docs/compatibility-cleanup.md`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- Backend, migrations, workflows and deployment configuration.
- Global or route CSS.
- Visual snapshots and performance ceilings.
- Canonical Home island implementation.

## Runtime owners

- `LexigoBootstrappedApp`: route-graph selection and compatibility fallback.
- `LexigoHomeApp`: canonical Home progress reads, active-lesson resolution, next action and Figma presentation.
- `LexigoPremiumApp`: shared auth, recovery, navigation, lesson, catalog and fallback behavior that must remain.

## Documentation owners

- `frontend/docs/compatibility-cleanup.md`
- `.agents/current/**`

## Invariants

- `/` continues to render `LexigoHomeApp` for direct entry, reload and History restoration.
- Shared progress loading, active-lesson state, lesson creation/resume, auth and fallback owners remain available in `LexigoPremiumApp`.
- No CSS selector or declaration changes.
- Existing route, browser, accessibility, visual and performance contracts remain unchanged.

## Acceptance criteria

- Legacy `renderHome`, its dispatch branch and Home-only presentation markers are absent from `LexigoPremiumApp`.
- Shared Learn/Library/Profile/Lesson/auth/progress owners are explicitly protected by source contracts.
- Full required CI passes on the final developer-authored head.
- Review audit is clean, merge uses expected head, and exact-SHA stage/public validation succeeds.

## Required checks

- Home source contract, lint, TypeScript, unit tests and production build.
- Full browser, accessibility, visual/performance and container CI.
- Review audit, expected-head squash merge and exact-SHA stage/public validation.

## Risks

- Removing a symbol that is shared with lesson or auth behavior rather than Home-only presentation.
- Accidentally changing fallback dispatch semantics for non-Home views.

## Rollback

Revert the bounded runtime/test/documentation commit; the canonical Home island remains unchanged.