# Current Task Progress

## Status

- Issue #70 proof-only slice is active on branch `test/issue-70-themed-card-orphan-proof`.
- Base SHA: `9001982fa6cf917741a455c84d78fe06b23a2045`.
- PR: pending.

## Completed

- Verified fresh live `main`, Issue #70, open PRs, exact main CI and stage product SHA after PR #349 reconciliation.
- Confirmed open PRs #304–#306 are unrelated Dependabot updates and remain outside this slice.
- Re-read repository instructions, project state, reset current records and the candidate CSS owners from exact `main`.
- Rejected `route-boundaries.css` as a cleanup candidate because error, loading and not-found production components consume its heading, text, mark and button selectors.
- Identified `.lx-themed-home` and `.lx-themed-library` as a bounded proof candidate across `themed-vocabulary.css`, `accessibility-focus.css` and `accessibility-navigation.css`.
- Confirmed indexed search finds no production TSX consumer for either candidate, while treating indexed search as discovery only.
- Confirmed live production consumers remain for `.lx-themed-selector`, `.lx-themed-symbol`, `.lx-themed-arrow` and collection-prefixed classes.
- Defined an atomic proof-only task contract before adding the executable test.
- Added `themed-card-orphan-source.test.ts` with an actual-checkout recursive scan of executable `app`, `components` and `lib` TypeScript/TSX.
- The scan excludes test/spec files and strips block and line comments.
- The contract requires zero executable consumers for both candidate classes.
- The contract bounds each candidate to five occurrences in `themed-vocabulary.css`, two in `accessibility-focus.css` and one in `accessibility-navigation.css`.
- Exact grouped selector blocks are protected so a future deletion must preserve live selector members.
- Live themed selector, symbol, arrow and collection owners remain mandatory through executable-consumer and CSS-declaration assertions.
- Read the task contract and source test back from the working branch.
- Confirmed `main` remained unchanged after each write.

## Pending

- Update execution evidence and compare the branch to exact base.
- Open a Draft PR and attach its number to current records.
- Run full authoritative CI on the final immutable developer-authored head.
- Diagnose any failed count/consumer assertion without weakening the proof.
- Verify Linux visual snapshots and route-performance budgets remain unchanged.
- Audit comments, reviews and unresolved review threads.
- Mark Ready only after complete green CI.
- Expected-head squash merge.
- Validate exact merge SHA through main CI and exact-SHA stage/public deployment.
- Reconcile durable state and reset current context in a separate Agent Docs PR.

## Scope guard

No production CSS, TypeScript/TSX runtime, snapshot, route-budget, backend/API, workflow, dependency, README or architecture file is permitted in this proof-only slice.
