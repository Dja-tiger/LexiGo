# Current Task Progress

## Status

- Issue #70 atomic deletion slice is active in Draft PR #344.
- Base SHA: `9bf254cf423b0d0bf69db836882b253797d24466`.
- Product deletion commit: `55dac63d68a1c3a9bc401aa4fd87c039d2966c5a`.
- Direct collateral-contract correction commit: `96bc459fbfadc458c061cbcfc99a556ec5800e8f`.
- Final head SHA must be resolved from live PR after the task-evidence commits.
- CI #2521 / run `30751504521` on `d8ba37e959b9e3959c5a71d97712c57f23aa634a` proved the new Profile source contract green and exposed one stale Progress source invariant; it is superseded by the corrected final head and is not merge authority.

## Completed

- Verified live main, open PRs, Issue #70, Issue #12 and exact deployed product SHA before writes.
- Completed mandatory repository harness and specialized rule reading.
- Reconciled PR #341 in docs-only PR #342 and squash-merged it as `9bf254cf423b0d0bf69db836882b253797d24466` after lightweight CI #2514.
- Re-read the reset current context from exact new main before starting this product slice.
- Audited `LexigoPremiumApp`, `LexigoBootstrappedApp`, canonical `LexigoProfileApp` and the PR #341 source manifest.
- Confirmed the exact deletion candidate has no reachable authenticated `/profile` path and no helper consumers outside the duplicate.
- Removed `formatAccountDate`, compatibility-local `logout`, compatibility-local unused `updateDailyGoal` and the post-guest authenticated Profile JSX.
- Preserved the complete guest login, registration, forgot-password, reset-password and reset-token presentation and runtime.
- Added fail-closed `return null` for the impossible authenticated compatibility state.
- Converted the Profile source manifest from candidate-presence assertions to exact physical-absence assertions.
- Preserved canonical Profile mutation markers for logout, daily goal, appearance and calendar ownership.
- CI diagnostics confirmed all five new Profile source-contract tests pass.
- Diagnosed the only frontend unit failure as the pre-existing Progress source contract requiring `progress.dailyGoal` and Profile navigation inside `LexigoPremiumApp`; both were consumers of the deleted duplicate rather than shared Progress runtime.
- Updated `progress-route-island-source.test.ts` to require those two Profile-only consumers to remain absent while preserving state/loading, `latestProgressRef` and `lessonProgressBeforeRef` shared consumers.
- Read both source contracts back from the working branch after correction.
- Confirmed no Progress runtime file was modified.
- Confirmed the PR changed-file list remains limited to the declared runtime/test/current-task paths before this evidence update.
- Confirmed production TSX is deletion-dominant: 88 deletions versus 37 additions; additions are the fail-closed return and local indentation normalization only.

## Pending

- Resolve the final immutable head after all task-evidence commits.
- Run and complete authoritative full CI on that exact head.
- Verify unchanged Linux visual snapshots and all route-performance budgets.
- Inspect comments, reviews and unresolved threads again on final head.
- Mark PR #344 Ready only after all required checks pass.
- Perform expected-head squash merge.
- Validate exact merge SHA through post-merge main CI and exact-SHA stage/public deployment.
- Reconcile durable state and reset current context in a separate docs-only PR.

## Scope guard

No Progress runtime, CSS, snapshot, route-budget, bootstrap route, canonical Profile, API, backend, migration, workflow, dependency, README or architecture file is permitted in this slice.
