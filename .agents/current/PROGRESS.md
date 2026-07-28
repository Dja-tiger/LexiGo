# Current Task Progress

## 2026-07-28 14:31 Europe/Moscow

### Verified

- Mandatory repository harness and all indexed mandatory documents were read from live `main` before writes.
- Live GitHub state was checked: `main` `3475d1443bbccedb63bca54e67c5762aec2374e3`, no open PRs, Issue #199 open, stage on exact image `5472e8f0479a750483709222745cdee92f504258`.
- PROJECT_STATE reconciliation was completed separately through PR #272 before this product slice.
- Exact Figma production contexts were read for catalog/detail Light/Dark mobile/desktop and resilient-state nodes.
- Existing Phrases API, navigation, History, route-shell, Dictionary-island, system-state, accessibility and bundle contracts were read from live source.

### Finding

- Canonical Phrases still falls through `LexigoBootstrappedApp` into `LexigoPremiumApp`.
- The monolith already has typed authenticated catalog/detail reads and correct URL helpers, but it also imports unrelated auth, lesson, progress and compatibility ownership.
- Existing repository IA intentionally keeps Phrases as a Dictionary catalog kind rather than a fifth primary route.
- The approved Figma presentation requires a dedicated catalog/detail hierarchy and resilient result surface while preserving query/topic controls.

### Root cause

Phrases was the final canonical product route left in the compatibility client graph while its production Figma slice was not yet approved. PR #270 completed that design prerequisite; Issue #199 now requires extraction and implementation.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`

### Checks passed

- Pre-flight branch/main verification.
- Figma exact-node design-context read.
- Architecture, API, History, responsive, accessibility and bundle source inspection.

### Checks failed

- None. Product implementation has not yet been validated.

### Current branch head

Resolve from live branch ref after this write; branch started at `3475d1443bbccedb63bca54e67c5762aec2374e3`.

### Next action

Record execution evidence, implement the dedicated Phrases types/presentation/island and bootstrap boundary, then run source/unit/build checks before opening the Draft PR.
