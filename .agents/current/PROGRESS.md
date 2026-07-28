# Current Task Progress

## 2026-07-28 18:48 Europe/Moscow

### Verified

- Issue #115 remains open only because its architecture-documentation acceptance criterion is not yet fully delivered.
- Live `main` at branch creation: `279eb4dcfe461ce6c9b056146644689e488e44cc`.
- Branch: `docs/issue-115-route-island-architecture`.
- Draft PR: #275.
- Executable source of truth is `LexigoBootstrappedApp` plus `production-app-entry.test.ts`.
- Bootstrap dynamically loads dedicated Home, Learn, Active Lesson, Dictionary, Phrases, Progress, authenticated Profile, Scenario catalog and Scenario detail entries.
- `LexigoPremiumApp` remains only the bootstrap fallback and is not the canonical owner of Phrases or Active Lesson.

### Findings

- README described `LexigoPremiumApp` as the owner of unextracted Phrases and Active Lesson.
- `docs/architecture.md` stated that only Phrases remained in the compatibility graph and referred to an unextracted-screen React model.
- Runtime, browser and bundle contracts were already correct; public documentation was the stale downstream consumer.
- The first executable documentation test was placed inside frontend unit tests, but frontend CI copies only `frontend/` into `/workspace`; repository-root README and architecture were not present there.

### Root causes

- Previous route-island slices protected executable imports, browser behavior, visual output and performance budgets but did not include public architecture documents in an executable downstream-consumer contract.
- The first contract selected its owner from the checkout layout instead of the authoritative CI filesystem boundary.

### Changed files

- `.agents/AGENTS.issue-115-architecture-docs.md`
- `.agents/AGENTS.md`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `README.md`
- `docs/architecture.md`
- `scripts/ci/agent_docs_scope_test.py`

### Checks passed

- Mandatory harness and Issue #115 acceptance criteria re-read before writes.
- README readback confirms all nine canonical route entries and the narrow compatibility fallback boundary.
- Architecture readback confirms complete route-to-entry mapping, Phrases API/URL-state ownership, route budgets and Issue #70 cleanup boundary.
- Root-level Python contract readback confirms bootstrap import verification and rejection of all three confirmed stale ownership phrases.
- The unreachable `frontend/components/architecture-documentation-contract.test.ts` was deleted and must be absent from the final diff.
- Branch remained based on `279eb4dcfe461ce6c9b056146644689e488e44cc`; live `main` did not move during writes.

### Checks failed

- PR CI #2279 / run `30374395504` failed only in the new frontend-isolated documentation test: both cases returned `ENOENT: no such file or directory, open '/README.md'`.
- Artifact `8694316141` and `vitest.log` proved that 455 existing tests passed and only the two new tests failed because `/workspace` contains only frontend sources.
- Failure classification: stale test-environment assumption. Documentation and runtime were not defective.
- Local read-only clone was also unavailable because the execution container could not resolve `github.com`; exact GitHub connector blobs, CI artifacts and branch comparisons were used instead.

### Recovery

- Removed the unreachable frontend test.
- Moved the semantic contract into `scripts/ci/agent_docs_scope_test.py`, which runs from the complete repository checkout in the always-required classifier job before CI chooses lightweight or full execution.
- Updated the mandatory architecture-documentation lesson with symptom, root cause, why it escaped, prevention and regression gate.
- Kept workflows and `frontend-container.sh` unchanged.

### Current branch head

- Resolve from the live PR ref after this progress write.

### Next action

- Update PR evidence, confirm the final changed-path manifest, then use the newest full CI run as the authoritative immutable-head gate. After success, audit reviews, mark Ready, expected-head squash merge, validate post-merge main/stage scope and close Issue #115.
