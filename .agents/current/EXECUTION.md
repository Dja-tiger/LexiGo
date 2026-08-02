# Current Task Execution

## Pre-flight

- Repository: `Dja-tiger/LexiGo`.
- Verified base: `65b73f0c9551880b8e84d371e473e9001e70cab9`.
- Active branch: `test/issue-70-resource-notice-orphan-proof`.
- Issue: #70.
- Open PRs #304–#306 are unrelated Dependabot updates.
- Stage remains successful on product SHA `b5eea8177255f2bc595340ef9e2abc5bc46a16a3`, run `30752387593`.
- Allowed paths are limited to one new source-contract test and `.agents/current/**`.

## Source evidence

- `mobile-pwa-fixes.css` contains eight `.lx-resource-notice*` selector-token occurrences.
- GitHub indexed search found no TS/TSX consumer for `.lx-resource-notice`, but indexed search is discovery only.
- `AsyncResourceNotice` currently delegates to `AsyncStatePanel`.
- `AsyncStatePanel` renders `.lx-async-state` and applies the canonical compact state contract.
- `system-states.css` owns `.lx-async-state.compact` and the live `.lx-resource-stack .lx-async-state` geometry correction.
- `.lx-resource-stack` remains consumed by multiple route islands.
- `.lx-session-notice` remains consumed by `LexigoBootstrappedApp` and shares grouped declarations with the legacy candidate.
- `renderLibrary()` remains live for product-owned Dictionary History entries and was rejected as a deletion candidate.

## Implementation

- Added `frontend/components/resource-notice-orphan-source.test.ts`.
- The test recursively reads executable TypeScript/TSX from `app`, `components` and `lib` in the actual frontend checkout.
- It excludes test/spec files and strips block/line comments before searching.
- It requires zero production consumers of the `lx-resource-notice` prefix.
- It requires exactly eight legacy selector-token occurrences and one occurrence of every exact selector marker.
- It protects the grouped selector boundaries that a future deletion must reduce without removing `.lx-session-notice` declarations.
- It proves the canonical replacement path through `AsyncResourceNotice` → `AsyncStatePanel` → `.lx-async-state`.
- It protects live `.lx-resource-stack`, `.lx-session-notice`, state-layer imports and import ordering.
- No production CSS or runtime file was modified.

## Branch evidence

- Task contract commit: `955f71295c1c6362ca233150653f94ed6b6379cd`.
- Source-contract implementation commit: `a8f0caf2dab4b260ad621c264a270dd9f4c75530`.
- Progress evidence commit: `3378c8ddb20afb49664960ff3ab7ba3cc8a2ada9`.
- Every changed path was read back from the working branch.
- `main` remained at `65b73f0c9551880b8e84d371e473e9001e70cab9` after each write.

## Validation plan

1. Compare the branch against exact `main` and require only the four allowed paths.
2. Open a Draft PR and run full CI.
3. Treat the new source test as the authoritative checkout-level consumer proof.
4. Require unchanged Linux visual regression and route-performance budgets even though no CSS changes are present.
5. Audit comments, reviews and unresolved threads.
6. Mark Ready only after final immutable-head CI is fully green.
7. Expected-head squash merge.
8. Require exact merge SHA main CI and stage/public validation.
9. Reconcile project state and reset current context separately.

## Rollback

Revert the proof PR. Production CSS and runtime remain unchanged.
