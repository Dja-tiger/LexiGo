# Current Task

## Identity

- Issue: #70
- Branch: `feat/issue-70-progress-runtime-deletion`
- Base SHA: `fbe2f1338454bddae36cae9e72420de93c483e84`
- Head SHA: resolve from live branch ref
- PR: not opened yet

## Objective

Remove only the unreachable route-level Progress presentation from `LexigoPremiumApp` after the dedicated `/progress` island, while preserving all shared progress data and navigation consumers used by Home, Profile and lesson-result flows.

## Scope

- Delete `renderProgress()` from `frontend/components/lexigo-premium-app.tsx`.
- Remove the compatibility-only Progress render selection, Progress-specific resource-notice suppression and compatibility calendar-card condition.
- Replace candidate-presence assertions in `frontend/components/progress-route-island-source.test.ts` with exact absence assertions.
- Record the deletion manifest and preserved shared contracts in `frontend/docs/compatibility-cleanup.md`.
- Measure source and bundle reduction without changing existing ceilings.

## Non-goals

- No deletion of shared `progress`, `progressStatus`, `loadProgressResource`, refs, daily-goal data, Home/Profile consumers or lesson-result navigation.
- No auth fallback extraction, account recovery changes, unknown-route changes, CSS cleanup, redesign or visual baseline promotion.
- No backend, API, migration, dependency or workflow changes.

## Allowed paths

- `frontend/components/lexigo-premium-app.tsx`
- `frontend/components/progress-route-island-source.test.ts`
- `frontend/docs/compatibility-cleanup.md`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- Backend, migrations, OpenAPI, workflows, dependencies and unrelated frontend routes or styles.
- Visual baseline files unless an independently reviewed product difference is found; pure cleanup requires unchanged hashes.

## Runtime owners

- Canonical route owner: `frontend/components/lexigo-progress-app.tsx`.
- Route selection owner: `frontend/components/lexigo-bootstrapped-app.tsx`.
- Compatibility fallback and preserved shared progress-domain consumers: `frontend/components/lexigo-premium-app.tsx`.

## Documentation owners

- `frontend/docs/compatibility-cleanup.md`
- `.agents/current/**`

## Invariants

- `/progress` is selected for guest and authenticated direct entry before `LexigoPremiumApp`.
- Home, Profile, header, lesson-result and shared navigation continue using progress data and `/progress` navigation.
- Guest authentication, account recovery and unknown-route fallback remain reachable.
- Linux visual hashes and existing route bundle ceilings remain unchanged.

## Acceptance criteria

- Compatibility route-level Progress presentation markers are absent from `LexigoPremiumApp`.
- Shared progress-domain markers remain present and covered by source contracts.
- Direct entry, reload, new tab and Back/Forward use `LexigoProgressApp` for guest and authenticated states.
- Full required CI, browser matrix, visual regression, bundle evidence and containers pass on the immutable head.
- Expected-head squash merge and exact-SHA stage/public validation complete.

## Required checks

- Harness/change-scope classifier.
- Progress source contract, lint, TypeScript, unit tests, production build and dependency audit.
- Desktop Chromium/WebKit and Android/iOS browser matrix.
- Keyboard, axe, reduced motion, 200% reflow, history/recovery and Linux visual regression.
- Existing performance budgets and full container matrix.

## Risks

- Removing shared progress state or loaders that still serve Home/Profile/lesson-result.
- Accidentally routing Progress through the compatibility fallback for a guest state.
- Removing calendar integration globally instead of only the unreachable compatibility condition.

## Rollback

Revert the single expected-head squash merge; no schema or data rollback is required.
