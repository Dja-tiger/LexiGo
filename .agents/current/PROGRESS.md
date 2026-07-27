# Current Task Progress

## 2026-07-27 19:25 Europe/Berlin

### Verified

- live `main` before branch creation: `eeab812c6785ae9a92aee948ecb63729ab850932`;
- no parallel product PR was open;
- stage runtime remains product image `dc59c8cc0906e8fe3f2ec787c87aecb0a4b23754` from run `30279520923`;
- parent Issue #115 remains open and identifies Learn, Phrases and Active Lesson as the remaining compatibility routes;
- Issue #254 was created for the atomic Learn route-island slice;
- branch `agent/issue-254-learn-route-island` was created from exact live `main`.

### Finding

`/learn` is currently rendered by `LexigoPremiumApp`. Lesson Composer state is interleaved with Phrases, auth compatibility, catalog browsing and Active Lesson state. A wrapper-only dynamic import would not reduce the route graph and would violate the independent-entry acceptance criterion.

### Root cause

The original compatibility graph predates route-specific client entries. Learn preview/create/resume/discard behavior and presentation still share one component-level state machine with unrelated routes.

### Changed files

- `.agents/current/TASK.md` — exact scope, owners, invariants, checks, risks and rollback.
- `.agents/current/PROGRESS.md` — this factual task log.

### Checks passed

- mandatory Agent Harness pre-flight completed;
- Issue #254 acceptance matrix created;
- branch base and changed task file read back by exact ref/blob.

### Checks failed

- none.

### Current branch head

Resolve from live branch ref after this commit.

### Next action

Extract the minimum typed Learn-owned controller/presentation boundary, add bootstrap route-graph ownership and source contracts, then run targeted CI before opening the Draft PR.
