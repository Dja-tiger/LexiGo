# Current Task Execution

## Pre-flight

- Repository: `Dja-tiger/LexiGo`.
- Verified base: `9bf254cf423b0d0bf69db836882b253797d24466`.
- Active branch: `refactor/issue-70-remove-authenticated-profile-fallback`.
- Draft PR: #344.
- Live stage before this slice remains successful on product SHA `c516a47910dfad46e174f90c9adf27919f7b4d4d`, run `30738638783`.
- No other PR was open when the product branch was created.

## Source evidence

- `LexigoBootstrappedApp` selects authenticated `/profile` into `LexigoProfileApp` before the final `LexigoPremiumApp` fallback.
- `LexigoPremiumApp.renderProfile()` retains a complete `if (!session)` guest branch covering login, registration, forgot-password, reset-password and reset-token flows.
- The removed authenticated return was located strictly after that guest branch.
- `formatAccountDate`, compatibility-local `logout` and compatibility-local `updateDailyGoal` had no consumers after removing the authenticated duplicate.
- Canonical `LexigoProfileApp` independently retains logout, daily-goal, appearance and calendar mutations.
- Canonical `LexigoProgressApp` owns `/progress` before the compatibility fallback; no Progress runtime file is part of this slice.

## Implementation

- Deleted the top-level `formatAccountDate` helper.
- Deleted compatibility-local authenticated logout runtime.
- Deleted compatibility-local unused daily-goal mutation runtime.
- Deleted the authenticated Profile page heading, state panels, account cards and actions from `renderProfile()`.
- Added `return null` after the preserved guest branch to keep the impossible authenticated fallback fail-closed.
- Converted `profile-authenticated-fallback-source.test.ts` to require physical absence of every deleted marker and endpoint.
- Kept exact guest auth/recovery markers, canonical Profile owner markers, guest Profile dispatch, Library dispatch and Lesson fallback markers.
- Updated the directly affected Progress source contract: `progress.dailyGoal` and Profile navigation are now retired markers, while remaining shared state/loading and Lesson comparison consumers remain mandatory.

## Diff evidence

- Product deletion commit: `55dac63d68a1c3a9bc401aa4fd87c039d2966c5a`.
- Direct collateral-contract correction commit: `96bc459fbfadc458c061cbcfc99a556ec5800e8f`.
- Product TSX: 37 additions, 88 deletions.
- The only production additions outside `return null` are local indentation normalization in existing code; runtime semantics are unchanged.
- No runtime path outside `frontend/components/lexigo-premium-app.tsx` is modified.
- Test changes are restricted to the Profile deletion manifest and the directly affected Progress ownership contract.
- No path outside the declared six-path allowlist is included.

## Validation evidence

- Exact source read-back confirms `formatAccountDate`, compatibility-local logout, compatibility-local daily-goal mutation and authenticated Profile JSX are absent.
- Exact source read-back confirms `renderProfile()` preserves the guest branch and ends with fail-closed `return null`.
- CI #2521 / run `30751504521` on `d8ba37e959b9e3959c5a71d97712c57f23aa634a` passed the new five-test Profile contract.
- Its only frontend unit failure was `progress-route-island-source.test.ts`, which still required the deleted Profile-only `progress.dailyGoal` consumer.
- The same diagnostic showed Profile navigation was the second obsolete shared marker; both are now asserted absent rather than silently dropped.
- Remaining shared Progress consumers are still explicitly required.
- CI #2521 is superseded and is not merge authority because the contract correction and task evidence advance the branch head.

## Remaining execution

1. Resolve final head from PR #344 after the task-evidence commits.
2. Require complete full CI success on that exact head.
3. Verify unchanged Linux visual snapshots and route-performance budgets.
4. Verify empty comment/review/thread surface.
5. Mark Ready and expected-head squash merge.
6. Require exact merge SHA main CI and exact-SHA stage/public success.
7. Reconcile `.agents/PROJECT_STATE.md` and reset `.agents/current/**` separately.

## Rollback

Revert PR #344. Guest auth/recovery, canonical authenticated Profile ownership and canonical Progress ownership are independent of the removed duplicate.
