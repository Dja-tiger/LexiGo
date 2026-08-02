# Current Task Progress

## Verified baseline

- Repository: `Dja-tiger/LexiGo`.
- Issue: #70 remains open.
- Branch: `test/issue-70-prove-authenticated-profile-fallback-unreachable`.
- Exact base/main SHA: `ab906738ab19287aac40016b5d28c2f341e3ae45`.
- Latest deployed product SHA: `29bf4bba7909fb370e9887d24d00e463da065e33`.
- Unrelated open PRs #304, #305 and #306 are Dependabot changes; none overlaps this proof slice.

## Fresh reachability audit

- Authenticated `/profile` is selected by `useProfileIsland = isProfileRoute(pathname) && initialSession !== null`.
- The canonical `LexigoProfileApp` branch renders before the final `LexigoPremiumApp` fallback.
- Guest direct `/profile`, login, registration, forgot-password and reset-password remain compatibility-owned and must not be removed.
- `LexigoPremiumApp.renderProfile()` still contains a separate authenticated summary after the guest `if (!session)` branch.
- `formatAccountDate` has one definition and one consumer, both in the authenticated duplicate family.
- The compatibility-local `logout` has one definition and one UI consumer in the authenticated duplicate.
- The compatibility-local `updateDailyGoal` has one definition and no call site.
- Canonical `LexigoProfileApp` independently owns authenticated logout and daily-goal mutation contracts.

## Implemented

- Added `frontend/components/profile-authenticated-fallback-source.test.ts`.
- The contract proves canonical authenticated Profile selection and render order before fallback.
- It isolates the guest and authenticated portions of `renderProfile()`.
- It protects guest auth/recovery presentation, validation and endpoint markers.
- It bounds the authenticated duplicate presentation and exact helper occurrence counts.
- It proves canonical `LexigoProfileApp` retains authenticated logout, daily goal, appearance and calendar ownership.
- It protects the remaining guest Profile, Library and Lesson compatibility dispatch.
- No production runtime or existing source contract changed.

## Branch evidence

- Task-record commit: `00acdc27f84fdcec255fa9c6aaa0db68040af135`.
- Proof-contract commit: `264146b94859dfea7177000d2453b5c98c240d2b`.
- Proof-contract blob: `bcd8b898c11924b570d243aba071691fc7267ac6`.
- Draft PR: #341.
- Pre-final head: `6b5c62f2c7bb167cb9c6c346cfc38b01f1b6fb3c`.
- PR diff remained restricted to the four allowed paths.
- `main` remained unchanged at `ab906738ab19287aac40016b5d28c2f341e3ae45` through pre-final validation.

## Pre-final validation evidence

- Authoritative CI #2509 / run `30737704993` passed completely.
- The exact source manifest passed without weakening route predicates, guest markers or helper occurrence counts.
- Frontend lint, typecheck, unit tests, production build and dependency audit passed.
- Backend unit/security/integration passed.
- Both UI shards, lesson completion, Dictionary smoke, iOS PWA, controlled service worker and CSP passed.
- Linux visual regression passed without snapshot changes.
- Accessibility audit and performance budgets passed without contract or ceiling changes.
- Web and API container builds passed.
- No runtime, UI, request, session, History, storage, accessibility, visual or bundle behavior changed.

## Remaining

- The evidence-record commits change the PR head; run one final immutable-head authoritative CI.
- Reconfirm the final four-path diff and unchanged `main`.
- Repeat PR comments, reviews and unresolved-thread audit.
- Mark Ready and perform expected-head squash merge only if the final head remains completely green.
- Require exact merge-SHA main CI and exact-SHA stage deploy, public smoke and public browser validation before reconciliation or runtime deletion.
