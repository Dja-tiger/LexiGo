# Current Task Execution

## Task

- Issue: #115 — Complete route-island architecture documentation and close the epic.
- Branch: `docs/issue-115-route-island-architecture`.
- Base SHA: `279eb4dcfe461ce6c9b056146644689e488e44cc`.
- Head SHA: resolve from live PR ref before every immutable-head gate.
- PR: Draft #275.

## Skills used

### Repository Agent Harness

Purpose: preserve exact-base branching, atomic scope, explicit write paths, full CI and post-merge delivery.

Instruction source: `AGENTS.md`, `.agents/AGENTS.md`, every indexed mandatory rule, `.agents/SKILLS.md`, `.agents/PROJECT_STATE.md`, `.agents/current/**` and `docs/agent-harness.md`.

Version or verification date: 2026-07-28.

Inputs: live `main`, Issues #12/#70/#115/#199, merged PRs #273/#274, stage run `30371866995`, public documentation and executable frontend/CI source contracts.

Files inspected: root/agent instructions, README, `docs/architecture.md`, `frontend/components/lexigo-bootstrapped-app.tsx`, `frontend/components/production-app-entry.test.ts`, `scripts/ci/frontend-container.sh`, `.github/workflows/ci.yml`, `scripts/ci/agent_docs_scope_test.py` and current task records.

Actions performed:

- verified that the previous Issue #199 product slice and its reconciliation were fully merged and exact-SHA stage validated;
- created the Issue #115 branch from exact current `main`;
- declared scope/non-goals/allowed paths before every category of write;
- read changed paths back from the target branch;
- kept runtime, frontend container mounts and workflows unchanged;
- opened Draft PR #275 and retained it as Draft after the first CI failure.

Commands or procedures: GitHub exact-file reads, explicit branch-scoped file writes, base-to-head compare, live Issue/PR inspection, workflow/job/log/artifact inspection and main-head verification.

Artifacts produced: current task/progress/execution records, Draft PR #275 and CI diagnostics artifact `8694316141`.

Result: the final Issue #115 criterion remains isolated from Issue #70 runtime cleanup and is undergoing corrected full validation.

Failures:

- Local read-only clone failed because the execution container could not resolve `github.com`.
- Initial PR CI #2279/run `30374395504` failed in the new frontend documentation test.

Root causes:

- External DNS/network access was unavailable inside the local container.
- The frontend test assumed repository-root files were available above `process.cwd()`, but `frontend-container.sh` copies only `frontend/` into `/workspace`; the attempted path became `/README.md`.

Fallback:

- Used exact GitHub connector blobs and downloaded CI artifact evidence instead of the unavailable local clone.
- Moved the root-document contract into the existing always-required root-level Python test boundary instead of widening container mounts or weakening validation.

Limitations: authoritative validation remains the complete repository CI required for README/general architecture and CI-contract changes.

Reusable lesson: choose a contract owner from the real CI filesystem boundary, and keep branch-scoped connector/artifact evidence as the fallback when local repository networking is unavailable.

### Executable Ownership Audit

Purpose: derive public architecture from the shipped bootstrap and production-root inventory rather than historical handoff text.

Instruction source: `.agents/AGENTS.base.md`, `.agents/AGENTS.progress-pr214.md`, Issue #115 acceptance criteria and `frontend/components/production-app-entry.test.ts`.

Version or verification date: 2026-07-28.

Inputs: dynamic imports and route-selection predicates in `LexigoBootstrappedApp`; existing dedicated route roots and bundle evidence from completed route-island slices.

Files inspected: `frontend/components/lexigo-bootstrapped-app.tsx`, `frontend/components/production-app-entry.test.ts`, README and `docs/architecture.md`.

Actions performed:

- inventoried all canonical route entries and the compatibility fallback;
- separated canonical route ownership from persistent shell/session/outbox owners;
- confirmed that Phrases and Active Lesson no longer load through `LexigoPremiumApp`;
- mapped the remaining compatibility/dead-code boundary to Issue #70;
- mapped existing direct-entry/history and permanent bundle evidence to the final Issue #115 documentation criterion.

Commands or procedures: exact source reads, dynamic-import inventory, route predicate/render-chain audit and semantic documentation comparison.

Artifacts produced: updated README ownership summary and normative route-to-entry architecture table.

Result: both public documents now describe all canonical client islands and the narrow fallback without overstating legacy cleanup.

Failures: none.

Root cause: not applicable.

Fallback: not applicable.

Limitations: compatibility fallback deletion remains outside this slice and requires separate source/bundle/browser/visual proof.

Reusable lesson: a fallback component can remain loaded without owning any canonical extracted route; documentation must distinguish those contracts.

### Architecture Documentation Contract

Purpose: prevent public ownership documentation from drifting behind executable route extraction again.

Instruction source: confirmed Issue #115 stale-documentation finding, CI #2279 evidence and repository error-learning requirements.

Version or verification date: 2026-07-28.

Inputs: bootstrap dynamic imports, canonical component names, README, architecture, three confirmed stale ownership phrases, CI workflow topology and frontend-container workspace construction.

Files inspected: `scripts/ci/agent_docs_scope_test.py`, `scripts/ci/frontend-container.sh`, `.github/workflows/ci.yml`, `.agents/AGENTS.issue-115-architecture-docs.md` and `.agents/AGENTS.md`.

Actions performed:

- initially added a semantic frontend unit contract;
- downloaded artifact `8694316141` after CI failure and inspected `vitest.log`;
- confirmed that 455 existing tests passed and only the two new cases failed with `ENOENT: /README.md`;
- classified the failure as a stale test-environment assumption, not a documentation or runtime defect;
- removed the unreachable frontend test from the branch;
- extended the mandatory root-level `agent_docs_scope_test.py` with the same semantic inventory/stale-claim assertions;
- preserved the existing workflow because the classifier already executes this file from the complete checkout before scope routing;
- promoted both the original documentation drift and the CI-boundary failure into the mandatory AGENTS lesson.

Commands or procedures: workflow topology audit, exact job log/artifact download, failure classification, explicit cleanup deletion, root-level Python contract write and blob readback.

Artifacts produced: executable root-level documentation contract and mandatory architecture-documentation ownership/CI-boundary rule.

Result: future route-owner changes must update public docs or fail the always-required classifier job, including pure Agent Docs and full product paths.

Failures: initial frontend contract was unreachable by design of the isolated workspace.

Root cause: test ownership was selected without first auditing `frontend-container.sh` copy/mount semantics.

Fallback: run the contract in the existing root checkout rather than changing shared CI mounts or duplicating documents.

Limitations: the contract protects known canonical component inventory and stale claims; it does not replace human review of architectural clarity.

Reusable lesson: public architecture is a testable downstream consumer of runtime ownership, but root documents require a root-checkout validation owner.
