# Current Task

## Identity

- Issue: #70
- Branch: `refactor/issue-70-remove-authenticated-profile-fallback`
- Base SHA: `9bf254cf423b0d0bf69db836882b253797d24466`
- Head SHA: resolve from live branch ref
- PR: not opened yet

## Objective

Delete only the authenticated Profile presentation and helper family that PR #341 proved unreachable inside `LexigoPremiumApp`, while preserving the live guest login, registration and password-recovery boundary and the canonical authenticated `LexigoProfileApp` owner.

## Scope

- Remove the post-guest authenticated return from `renderProfile()`.
- Remove `formatAccountDate`, compatibility-local `logout` and compatibility-local unused `updateDailyGoal`.
- Keep `renderProfile()` as the guest Profile authentication/recovery owner and return `null` for the impossible authenticated fallback state.
- Convert the PR #341 presence manifest into fail-closed absence assertions.
- Record exact source, diff and CI evidence in `.agents/current/**`.

## Non-goals

- No guest auth, registration, forgot-password, reset-password or reset-token changes.
- No canonical Profile redesign or mutation changes.
- No Library, Lesson, unknown-route, session bootstrap, navigation or account-runtime changes.
- No CSS, visual baseline, Figma, API, backend, migration, fixture, workflow, dependency, README or architecture change.

## Allowed paths

- `frontend/components/lexigo-premium-app.tsx`
- `frontend/components/profile-authenticated-fallback-source.test.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- Every path not listed above.
- In particular: bootstrap routing, canonical `lexigo-profile-app.tsx`, CSS, snapshots, route-budget ceilings, backend/API, workflows, dependencies and public documentation.

## Runtime owners

- Authenticated `/profile`: `LexigoProfileApp` selected by `LexigoBootstrappedApp` before fallback.
- Guest `/profile`: `LexigoPremiumApp.renderProfile()`.
- Session restoration and dynamic route selection: `LexigoBootstrappedApp`.
- Library, Lesson and unknown-route compatibility behavior: remaining `LexigoPremiumApp` runtime.

## Documentation owners

- Current slice evidence: `.agents/current/**`.
- Durable completion/deployment evidence: `.agents/PROJECT_STATE.md` in a later reconciliation-only PR.

## Invariants

- Guest direct entry, reload, login, registration, forgot-password, reset-password and reset-token flows remain unchanged.
- Authenticated `/profile` remains fully owned by `LexigoProfileApp`.
- The compatibility fallback remains reachable for guest Profile, Library, Lesson and unknown/product routes.
- No UI, request, session, History, storage, accessibility, visual or navigation behavior changes on reachable paths.
- The runtime deletion is limited to the exact PR #341 manifest; neighboring code is not inferred dead.

## Acceptance criteria

- The authenticated Profile return and all four exact helper/runtime markers are physically absent from `lexigo-premium-app.tsx`.
- `renderProfile()` still contains every protected guest auth/recovery marker and ends with a fail-closed `return null` after the guest branch.
- Canonical Profile logout, daily-goal, appearance and calendar contracts remain protected by the source test.
- Final diff is restricted to the five allowed paths and production TSX changes are deletion-dominant.
- Full authoritative CI passes on the final immutable head, including unchanged Linux visual snapshots and route-performance budgets.
- Comments, reviews and unresolved threads are empty before Ready.
- Expected-head squash merge succeeds.
- Exact merge SHA passes post-merge main CI and exact-SHA stage/public validation before reconciliation.

## Required checks

- Exact source-contract unit test.
- Frontend lint, typecheck, unit tests, production build and dependency audit.
- Backend unit/security/integration.
- Full browser matrix, accessibility, CSP, controlled service worker, iOS PWA, Linux visual regression and performance budgets.
- Web and API container builds.

## Risks

- Removing live guest auth/recovery by crossing the `if (!session)` boundary.
- Removing a helper with an unproven consumer.
- Weakening the manifest instead of converting it to absence evidence.
- Masking a hidden routing regression with fallback UI rather than retaining a fail-closed impossible-state return.

## Rollback

Revert the product PR. The canonical authenticated Profile remains independent, and rollback restores only the unreachable duplicate family.
