# Current Task Execution

## Pre-flight

- Repository: `Dja-tiger/LexiGo`.
- Verified base: `e5978d3af77e6c5e14e22ee189d72c32d7b79461`.
- Active branch: `style/issue-70-remove-resource-notice-selectors`.
- Issue: #70.
- Stage before this slice is successful on product SHA `c0b8aede5563fd8619072746db77ba69a8c6329e`, run `30760260623`.
- Open PRs #304–#306 are unrelated Dependabot updates.

## Source evidence

- PR #346 proved zero executable production consumers of `lx-resource-notice` using an actual-checkout recursive scan.
- `mobile-pwa-fixes.css` contained exactly eight bounded legacy selector-token occurrences.
- `AsyncResourceNotice` renders through `AsyncStatePanel` and canonical `.lx-async-state`.
- `.lx-resource-stack` remains live across route islands.
- `.lx-session-notice` remains live in `LexigoBootstrappedApp` and shared three declaration groups with the orphan candidate.

## Implementation

- Deleted the standalone `.lx-resource-notice` block.
- Deleted `.lx-resource-notice > div`, `.lx-resource-notice strong` and `.lx-resource-notice span` rules.
- Reduced the shared button rule to `.lx-session-notice button` with the same declaration body.
- Reduced the offline/timeout rule to `.lx-session-notice.offline, .lx-session-notice.timeout` with the same declaration body.
- Reduced the malformed rule to `.lx-session-notice.malformed` with the same declaration body.
- Converted `resource-notice-orphan-source.test.ts` to assert zero legacy prefix occurrences in production CSS.
- Added exact single-occurrence contracts for all three retained live session-notice declaration bodies.
- Preserved zero-consumer scanning, canonical async-state ownership, live resource-stack/session-shell and CSS import-order contracts.

## Branch evidence

- Task contract commit: `79f934c91faf0e1e31705a6ae3208d38e2382f27`.
- CSS deletion commit: `7fb5f7aa54c5cba725040fdb20b71188df0c064d`.
- Source-contract conversion commit: `365ea588c94dd9fd04461d89bb5b5eb666a26883`.
- Progress evidence commit: `ae6ae760383307dea62ef6ff0a5aac143e02e307`.
- Every modified path was read back from the working branch.
- `main` remained at `e5978d3af77e6c5e14e22ee189d72c32d7b79461` after every write.

## Validation plan

1. Compare branch to exact base and require only the five allowed paths.
2. Require deletion-dominant CSS diff and zero legacy prefix tokens.
3. Open Draft PR and update current records with PR/head evidence.
4. Run complete authoritative CI on the final immutable developer-authored head.
5. Require unchanged Linux visual snapshots and route-performance budgets.
6. Audit comments, reviews and unresolved review threads.
7. Mark Ready and expected-head squash merge only after full green.
8. Require exact merge SHA main CI and stage/public validation.
9. Reconcile project state and reset current context separately.

## Rollback

Revert the product PR. Canonical resource-error presentation does not depend on the removed selectors.
