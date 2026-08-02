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
- `main` remained unchanged at `ab906738ab19287aac40016b5d28c2f341e3ae45` after both writes.

## Remaining

- Record execution details and verify the final four-path diff.
- Open a Draft PR.
- Require full authoritative CI, including source/unit contract, all browser projects, guest/auth Profile journeys, accessibility, visual regression, performance budgets and containers.
- If the exact source counts fail, classify the mismatch and correct the manifest rather than weakening the proof.
- After pre-final evidence is recorded, require a final immutable-head CI, clean review audit, expected-head squash merge and exact-SHA main/stage/public validation.
