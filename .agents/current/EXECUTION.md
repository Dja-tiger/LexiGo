# Current Task Execution

## Pre-flight

- Repository: `Dja-tiger/LexiGo`.
- Verified base: `9001982fa6cf917741a455c84d78fe06b23a2045`.
- Active branch: `test/issue-70-themed-card-orphan-proof`.
- Issue: #70.
- Open PRs #304–#306 are unrelated Dependabot updates.
- Stage remains successful on product SHA `07aa9d55c265a392ec20db9057fb7e0f880a8884`, run `30761598976`.
- Allowed paths are limited to one new source-contract test and `.agents/current/**`.

## Candidate analysis

- `route-boundaries.css` was rejected because production `error.tsx`, `loading.tsx` and `not-found.tsx` consume its route boundary, heading/text, bootstrap mark and button selectors.
- `.lx-themed-home` and `.lx-themed-library` occur only in CSS discovery results and have no indexed production TSX consumer.
- Each candidate occurs five times in `themed-vocabulary.css`, twice in `accessibility-focus.css` and once in `accessibility-navigation.css`.
- `.lx-themed-selector` remains live in `LexigoLearnApp`.
- `.lx-themed-symbol` remains live in Learn and compatibility Library presentation.
- `.lx-themed-arrow` remains live in compatibility Library presentation.
- Collection-prefixed classes remain live and own collection-specific symbol themes.

## Implementation

- Added `frontend/components/themed-card-orphan-source.test.ts`.
- The test recursively reads executable TypeScript/TSX from `app`, `components` and `lib` in the actual frontend checkout.
- It excludes test/spec files and strips block/line comments before searching.
- It requires zero production consumers for `lx-themed-home` and `lx-themed-library`.
- It requires exact per-file candidate occurrence counts across all three CSS owners.
- It protects the exact grouped cursor, hover-arrow, overflow, pseudo-element, child-layer, focus and reduced-motion selector blocks.
- It requires executable consumers for `lx-themed-selector`, `lx-themed-symbol`, `lx-themed-arrow` and collection-prefixed classes.
- It protects selected-state, symbol, arrow and three collection-specific declaration owners.
- No production CSS or runtime file was modified.

## Branch evidence

- Task contract commit: `ce968caab02313831243c632b8246f9c7617ca97`.
- Source-contract implementation commit: `42ae98350fb6f6fab2dd40cd4b3815ccb7bd3c35`.
- Progress evidence commit: `7365c00001061af386f84b36d02c2d0fe0751e9f`.
- Every changed path was read back from the working branch.
- `main` remained at `9001982fa6cf917741a455c84d78fe06b23a2045` after every write.

## Validation plan

1. Compare the branch against exact `main` and require only the four allowed paths.
2. Open a Draft PR and attach its number to current records.
3. Run complete full CI on the final immutable developer-authored head.
4. Treat the source test as authoritative actual-checkout consumer evidence.
5. Require unchanged Linux visual regression and route-performance budgets.
6. Audit comments, reviews and unresolved review threads.
7. Mark Ready only after final-head CI is fully green.
8. Expected-head squash merge.
9. Require exact merge SHA main CI and stage/public validation.
10. Reconcile project state and reset current context separately.

## Rollback

Revert the proof PR. Production CSS and runtime remain unchanged.
