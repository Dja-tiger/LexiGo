# Current Task

## Identity

- Issue: #243
- Branch: `chore/issue-243-agent-docs-ci`
- Base SHA: `387cc50c199218d71b49b39beb9d92859b6e299c`
- Head SHA: resolve from live branch ref
- PR: pending

## Objective

Add a conservative CI fast path for pure Agent Harness documentation changes so they validate repository memory without running product/backend/browser/container gates or triggering automatic stage deployment.

## Scope

- Add exact path filtering to the existing `CI` workflow for pure Agent Harness documentation changes.
- Add a dedicated Agent Docs workflow that runs the harness source contract and path-routing regression contract.
- Record the completed PR #240 reconciliation and the active Issue #243 tooling slice in repository memory.
- Preserve the complete existing CI matrix for every non-Agent-Docs or mixed change.

## Non-goals

- No runtime, API, dependency, product UI, test expectation or deployment-script changes.
- No broad skip for arbitrary documentation.
- No change to manual stage deployment.
- No weakening of full CI for mixed changes.

## Allowed paths

- `.github/workflows/ci.yml`
- `.github/workflows/agent-docs.yml`
- `scripts/ci/agent_docs_workflow_test.py`
- `.agents/PROJECT_STATE.md`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `.agents/SKILLS.md` only if a stable reusable procedure must be promoted
- `.agents/AGENTS*.md` only if a new confirmed failure category is discovered

## Prohibited paths

- `backend/**`
- `frontend/**`
- `deploy/**`
- runtime configuration and dependencies
- product visual baselines

## Runtime owners

- `.github/workflows/ci.yml` owns the complete product CI trigger and test/build matrix.
- `.github/workflows/deploy-stage.yml` remains unchanged and only reacts to successful push-triggered `CI` workflow runs on `main`.
- `.github/workflows/agent-docs.yml` will own pure Agent Harness documentation validation.

## Documentation owners

- `.agents/PROJECT_STATE.md`
- `.agents/current/**`
- `docs/agent-harness.md`
- `scripts/ci/check-agent-harness.sh`

## Invariants

- A mixed change must run full CI.
- Workflow, script, README, architecture, runtime, dependency and deployment changes must run full CI.
- Only `AGENTS.md`, `.agents/**` and `docs/agent-harness.md` may qualify for the Agent Docs path.
- Pure Agent Docs pushes to `main` must not produce a successful `CI` workflow run, runtime images or an automatic stage deployment.
- Manual stage deployment remains available.
- The dedicated Agent Docs workflow must validate the harness and its own routing contract.

## Acceptance criteria

- Issue #243 acceptance criteria are implemented and source-protected.
- Full CI path commands and matrix remain byte-for-byte unchanged outside the trigger filter.
- Agent Docs path validation is deterministic for pure, mixed and unrelated path sets.
- Final PR diff contains only allowed paths.

## Required checks

- `python3 scripts/ci/agent_docs_workflow_test.py`
- `bash scripts/ci/check-agent-harness.sh`
- YAML parse/source inspection for both workflows
- Full required CI on the final workflow-changing head
- Review threads empty before expected-head squash merge
- Post-merge main validation; automatic stage deployment must be absent for a later pure Agent Docs commit

## Risks

- Incorrect `paths-ignore` semantics could skip product CI for mixed changes.
- A mismatched dedicated workflow path list could leave pure Agent Docs changes without validation.
- Required-check configuration may depend on the existing `CI` workflow name; the PR must verify actual check behavior before merge.

## Rollback

Revert the workflow and routing-test commit. The repository returns to the previous full-CI-for-all-changes behavior without runtime data migration or deployment rollback.