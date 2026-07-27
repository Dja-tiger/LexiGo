# Current Task Progress

## 2026-07-28 02:35 Europe/Moscow

### Verified

- live `main`: `0bc5203da2487e947b860ce67a69cf04121cc3c8`;
- no open PR and no parallel branch for the new slice;
- Issue #254 and PRs #255/#256 are complete;
- stage remains healthy on product image `9c7a2a46a974a2fd3b16f2de95d8e6f7694584b8`, run `30313824186`;
- Phrases Issue #199 is blocked because canonical Figma node IDs are absent;
- Active Lesson production design and browser contracts are approved under Issues #193/#194;
- Issue #257 was created and branch `agent/issue-257-active-lesson-route-island` was based on exact live `main`.

### Finding

`/lesson/active` still falls through to `LexigoPremiumApp`, so cold entry loads the compatibility graph that also owns Phrases and legacy route state. The presentation, fixture matrix, Linux baselines and route budget harness already exist; the missing boundary is an independent controller/entry.

### Root cause

Active Lesson presentation was modernized before the route-island program. Its controller, API mutations, completion snapshot and navigation state remain embedded in the original monolithic application graph.

### Changed files

- `.agents/current/TASK.md` — exact contract, scope, invariants, checks, risks and rollback.
- `.agents/current/PROGRESS.md` — verified task-selection and pre-flight facts.
- `.agents/current/EXECUTION.md` — initial reproducible procedures and evidence.

### Checks passed

- mandatory Agent Harness and GitHub plugin instructions read from final `main`;
- live main/PR/Issue/branch/CI/stage reconciliation completed;
- Phrases design blocker and Active Lesson approved Figma sources revalidated;
- repository-wide Active Lesson owner/consumer/test search completed;
- isolated issue and branch created from exact main.

### Checks failed

- none.

### Current branch head

Pre-commit head: `0bc5203da2487e947b860ce67a69cf04121cc3c8`.

### Next action

Build the minimal typed Active Lesson controller/entry from existing production contracts, add route ownership source protection and run focused unit/build/browser validation before opening the Draft PR.
