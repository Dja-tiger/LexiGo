# Current Task

## Identity

- Issue: #70
- Branch: `test/issue-70-prove-authenticated-profile-fallback-unreachable`
- Base SHA: `ab906738ab19287aac40016b5d28c2f341e3ae45`
- Delivery type: executable compatibility reachability proof

## Objective

Prove, without changing production runtime, that the authenticated presentation branch inside `LexigoPremiumApp.renderProfile()` is unreachable because `LexigoBootstrappedApp` selects the dedicated authenticated `LexigoProfileApp` before the compatibility fallback, while the guest login/registration/password-recovery branch remains live and must be preserved.

## Live evidence

- Current `main`: `ab906738ab19287aac40016b5d28c2f341e3ae45`.
- Latest deployed product SHA: `29bf4bba7909fb370e9887d24d00e463da065e33`; exact-SHA main CI and stage/public validation are successful.
- Unrelated open PRs #304, #305 and #306 are Dependabot changes and do not overlap this slice.
- Bootstrap predicate: authenticated `/profile` uses `isProfileRoute(pathname) && initialSession !== null`.
- The `LexigoProfileApp` render branch precedes the final `LexigoPremiumApp` fallback.
- Guest `/profile` still requires compatibility-owned login, registration, forgot-password and reset-password presentation.
- `renderProfile()` also contains an authenticated Profile summary branch that duplicates the canonical Profile island.

## Exact candidate manifest

This proof must bound the later deletion candidate to:

- the authenticated return after the `if (!session)` guest branch in `renderProfile()`;
- `formatAccountDate`, consumed only by that authenticated return;
- the compatibility-local `logout`, consumed only by that authenticated return;
- the compatibility-local `updateDailyGoal`, which has no call site and belongs to the retired authenticated Profile family.

The proof must not classify the following as dead:

- `renderProfile()` itself;
- `submitAuth`, auth form state and validation;
- login/register/forgot/reset requests and presentation;
- reset-token URL handling;
- session bootstrap or route selection;
- canonical `LexigoProfileApp` logout, progress goal, appearance, calendar or account panels;
- shared Premium lesson, Library, unknown-route or account-runtime behavior.

## Scope

- Add one dedicated source-level contract that proves route/session reachability and exact candidate/helper counts.
- Protect all guest auth/recovery markers.
- Prove the canonical authenticated owner contains the replacement Profile contracts.
- Record factual implementation and CI evidence in `.agents/current/**`.

## Allowed paths

- `frontend/components/profile-authenticated-fallback-source.test.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- Production runtime, including `lexigo-premium-app.tsx`, bootstrap and `lexigo-profile-app.tsx`.
- Existing Profile source contracts.
- CSS, visual snapshots and Figma baselines.
- API, backend, migrations and fixtures.
- Bundle/performance ceilings.
- Workflows, dependencies, README and architecture documents.

## Invariants

- Guest direct entry, reload, reset-token flow and auth/recovery remain compatibility-owned.
- Authenticated `/profile` remains canonical in `LexigoProfileApp`.
- The proof cannot infer dead code from names alone; it must combine bootstrap predicate, render order, fallback dispatch and exact source consumers.
- No runtime, UI, request, session, History, storage, accessibility, visual or bundle behavior changes.

## Contract matrix

Because this is proof-only, all user-visible behavior must be identical for guest and authenticated direct entry, reload, Back/Forward, compact/desktop, Chromium/WebKit/Android/iOS, Light/Dark, keyboard/screen reader and reset-token flows. Full browser, accessibility, visual and performance gates remain required to ensure the source contract itself does not alter build/runtime behavior.

## Acceptance criteria

- The new source contract proves authenticated Profile island selection before fallback.
- It isolates the guest and authenticated portions of `renderProfile()` and protects guest auth/recovery markers.
- It records exact occurrence counts for the authenticated duplicate markers and its helper-only consumers.
- It proves canonical `LexigoProfileApp` owns authenticated logout and daily-goal contracts.
- Final diff contains only the four allowed paths.
- Full authoritative CI passes on final immutable head.
- Reviews, comments and unresolved threads are empty before Ready.
- Expected-head squash merge succeeds.
- Exact merge SHA passes post-merge main CI and stage/public validation.

## Current evidence

- Draft PR: #341.
- Pre-final developer-authored head: `6b5c62f2c7bb167cb9c6c346cfc38b01f1b6fb3c`.
- Authoritative CI #2509 / run `30737704993` passed completely.
- The exact source contract passed without relaxed markers or occurrence counts.
- Frontend lint, typecheck, unit tests, production build and dependency audit passed.
- Backend unit/security/integration passed.
- Both UI shards, lesson completion, Dictionary smoke, iOS PWA, controlled service worker and CSP passed.
- Linux visual regression, accessibility audit and performance budgets passed without snapshot, contract or ceiling changes.
- Web and API container builds passed.
- No production runtime changed in this proof-only PR.
- This evidence-record update changes the PR head; one final immutable-head authoritative CI remains required before Ready and merge.

## Non-goals

- No runtime deletion in this PR.
- No Profile redesign, route extraction, CSS cleanup or architecture-documentation change.
- No Dependabot work.

## Rollback

Revert the proof-only PR. Production runtime is unchanged.
