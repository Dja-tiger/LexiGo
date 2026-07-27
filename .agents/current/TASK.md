# Current Task

## Identity

- Issue: #243
- Branch: `chore/issue-243-agent-docs-ci`
- Base SHA: `387cc50c199218d71b49b39beb9d92859b6e299c`
- Head SHA: resolve from live branch ref
- PR: #244

## Objective

Add a conservative CI fast path for pure Agent Harness documentation changes so they validate repository memory without running product/backend/browser/container gates or triggering automatic stage deployment.

## Scope

- Keep the existing `CI` workflow registered for every pull request and `main` push so branch-protection checks cannot remain permanently pending.
- Add an exact changed-path classifier to `CI` for pure Agent Harness documentation changes.
- Run only lightweight routing-contract and Agent Harness validation when the classifier reports a pure Agent Docs change.
- Skip backend, frontend, browser and container jobs only for that exact pure scope.
- Publish a fail-closed CI scope artifact and make automatic stage deployment consume it before deploying.
- Update repository-wide runner policy to include the two new configurable lightweight CI jobs.
- Record the completed PR #240 reconciliation and the active Issue #243 tooling slice in repository memory.
- Preserve the complete existing product CI commands and browser/container matrix for every non-Agent-Docs or mixed change.

## Non-goals

- No runtime, API, dependency, product UI, test expectation or deployment-script behavior changes beyond the automatic deployment eligibility gate.
- No broad skip for arbitrary documentation.
- No change to manual stage deployment.
- No weakening of full CI for mixed changes.

## Allowed paths

- `.github/workflows/ci.yml`
- `.github/workflows/deploy-stage.yml`
- `scripts/ci/agent_docs_scope.py`
- `scripts/ci/agent_docs_scope_test.py`
- `scripts/ci/runner_policy_test.py`
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

- `.github/workflows/ci.yml` owns the required CI check lifecycle, exact scope classification, product test/build matrix and CI scope artifact.
- `.github/workflows/deploy-stage.yml` owns automatic/manual stage eligibility and must fail closed when the CI scope artifact is missing or invalid.
- `scripts/ci/agent_docs_scope.py` owns deterministic path classification for pull-request and push base/head ranges.
- `scripts/ci/agent_docs_scope_test.py` owns regression protection for pure, mixed, unrelated and ambiguous scopes plus workflow wiring.
- `scripts/ci/runner_policy_test.py` owns the configurable-runner job graph contract.

## Documentation owners

- `.agents/PROJECT_STATE.md`
- `.agents/current/**`
- `docs/agent-harness.md`
- `scripts/ci/check-agent-harness.sh`

## Invariants

- The `CI` workflow remains registered for all pull requests and `main` pushes.
- A mixed change must run full CI.
- Workflow, classifier script, README, architecture, runtime, dependency and deployment changes must run full CI.
- Only `AGENTS.md`, `.agents/**` and `docs/agent-harness.md` may qualify for the Agent Docs path.
- Empty, unavailable or ambiguous base/head ranges classify as non-Agent-Docs and therefore run full CI.
- Pure Agent Docs pushes to `main` must not build/publish runtime images or perform automatic stage deployment.
- Automatic stage deploy requires a valid scope artifact from the exact successful `CI` workflow run.
- Manual stage deployment remains available and bypasses the automatic scope-artifact requirement.
- All eight CI jobs use the configurable hosted-runner expression; hard-coded self-hosted labels and serialized matrices remain prohibited.
- Existing product job commands, browser matrix and container publication semantics remain unchanged for non-Agent-Docs changes.

## Acceptance criteria

- Issue #243 acceptance criteria are implemented and source-protected.
- Pure Agent Docs changes run the classifier/routing contract and `scripts/ci/check-agent-harness.sh`, while heavy jobs are skipped.
- Mixed and unrelated changes execute the complete existing CI matrix.
- Stage automatic deployment is skipped only when the exact CI artifact reports `agent_docs_only=true`.
- Missing, malformed or mismatched scope evidence blocks automatic deployment.
- Repository storage and runner policy checks accept the new job/artifact graph.
- Final PR diff contains only allowed paths.

## Required checks

- `python3 scripts/ci/agent_docs_scope_test.py`
- `python3 scripts/ci/actions_storage_policy_test.py`
- `python3 scripts/ci/runner_policy_test.py`
- classifier CLI tests against synthetic Git histories
- `bash scripts/ci/check-agent-harness.sh`
- source inspection for unchanged product job commands/matrix
- full required CI on the final workflow-changing head
- review threads empty before expected-head squash merge
- post-merge main validation and normal tooling-change stage validation
- subsequent pure Agent Docs reconciliation must prove heavy CI jobs and automatic stage deploy are skipped

## Risks

- Incorrect changed-range selection could classify a mixed push as documentation-only.
- Job-level skip wiring could break required-check aggregation or dependency semantics.
- Missing scope artifact handling could either deploy unsafely or block legitimate stage releases.
- `workflow_run` artifact download permissions or action inputs could differ from assumptions and require evidence from final CI/stage runs.

## Rollback

Revert the workflow, classifier and runner-policy commit. The repository returns to the previous full-CI-and-stage-for-all-main-changes behavior without runtime data migration or product rollback.