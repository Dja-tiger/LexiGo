# Current Task Progress

## 2026-07-28 18:36 Europe/Moscow

### Verified

- Issue #115 remains open only because its architecture-documentation acceptance criterion is not yet validated.
- Live `main` at branch creation: `279eb4dcfe461ce6c9b056146644689e488e44cc`.
- Branch: `docs/issue-115-route-island-architecture`.
- No parallel pull request was open when the slice started.
- Executable source of truth is `LexigoBootstrappedApp` plus `production-app-entry.test.ts`.
- Bootstrap dynamically loads dedicated Home, Learn, Active Lesson, Dictionary, Phrases, Progress, authenticated Profile, Scenario catalog and Scenario detail entries.
- `LexigoPremiumApp` remains only the bootstrap fallback and is not the canonical owner of Phrases or Active Lesson.

### Finding

- README still described `LexigoPremiumApp` as the owner of unextracted Phrases and Active Lesson.
- `docs/architecture.md` still stated that only Phrases remained in the compatibility graph and referred to an unextracted-screen React model.
- Runtime, browser and bundle contracts were already correct; the public documentation was the stale downstream consumer.

### Root cause

- Previous route-island slices protected executable imports, browser behavior, visual output and performance budgets but did not include public architecture documents in an executable downstream-consumer contract.

### Changed files

- `.agents/AGENTS.issue-115-architecture-docs.md`
- `.agents/AGENTS.md`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `README.md`
- `docs/architecture.md`
- `frontend/components/architecture-documentation-contract.test.ts`

### Checks passed

- Mandatory harness and Issue #115 acceptance criteria re-read before writes.
- README readback confirms all nine canonical route entries and the narrow compatibility fallback boundary.
- Architecture readback confirms complete route-to-entry mapping, Phrases API/URL-state ownership, route budgets and Issue #70 cleanup boundary.
- New source contract readback confirms bootstrap import verification and rejection of all three confirmed stale ownership phrases.
- Branch compare against `279eb4dcfe461ce6c9b056146644689e488e44cc`: behind `0`; only declared paths changed.
- Live `main` remained unchanged after branch writes.

### Checks failed

- Local read-only clone was unavailable because the execution container could not resolve `github.com`; exact GitHub connector blobs and branch comparisons were used instead. This is an execution-environment limitation, not a repository or product failure.

### Current branch head

- Resolve from the live branch ref after this progress write.

### Next action

- Read back current records, open a Draft PR, run the complete required CI matrix, classify any failure from exact logs, then perform review audit, Ready transition, expected-head squash merge and post-merge validation before closing Issue #115.
