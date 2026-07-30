# Current Task Progress

## 2026-07-31 01:05 Europe/Moscow

### Verified

- Live `main` is `d7a2c037040b1a1d8d978fa038b2528abd92661e` after reconciliation PR #314.
- Issue #70 remains open and still covers app-entry cleanup, global CSS ownership, bundle dead-code evidence, visual regression and README ownership.
- `/learn` is selected by the Learn route graph and rendered through `LexigoLearnApp` before the compatibility fallback.
- `LexigoLearnApp` owns Lesson Composer reads, mutations, presentation and History.

### Finding

The next safe slice is proof-only. `LexigoPremiumApp` still contains a bounded `renderLearn` presentation candidate, but shared lesson creation, auth, Library, Profile and Active Lesson owners remain live and cannot be removed without a separate deletion audit.

### Root cause

Learn moved to a dedicated route island before the legacy compatibility presentation was formally bounded by a two-sided source contract.

### Changed files

- `frontend/components/learn-route-island-source.test.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Checks passed

- Live Issue/main/stage reconciliation review.
- Exact bootstrap render-order inspection.
- Canonical Learn ownership and compatibility candidate impact map.

### Checks failed

- The first preferred branch name already existed as a Git ref but was not returned by branch search; a unique `-v2` branch was created instead. No repository content was changed by the failed ref creation.

### Current branch head

Resolve from live branch ref.

### Next action

Complete execution memory, compare the branch against current main, open a Draft PR and run authoritative full CI.
