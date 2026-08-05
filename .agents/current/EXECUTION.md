# Current Task Execution

## Task

- Issue: #398
- Branch: `fix/issue-398-stage-deploy-concurrency`
- Base SHA: `173258f9e9bf61ac97d1c053556d1bf96fe46763`
- Head SHA: resolve from live branch ref
- PR: #400

## Skills used

### Connected GitHub production workflow

Purpose:

Diagnose and correct a GitHub Actions stage-deployment concurrency race through an atomic workflow/test slice.

Instruction source:

- repository `AGENTS.md` and mandatory `.agents/**` overlays;
- `docs/agent-harness.md`;
- connected GitHub and CI-diagnostics skills;
- official GitHub Actions concurrency, job-condition and context documentation.

Version or verification date:

2026-08-05.

Inputs:

- Deploy Stage #2689 and skipped #2690 workflow/job evidence;
- Issue #12 exact-image deployment status;
- `.github/workflows/deploy-stage.yml`;
- `scripts/ci/agent_docs_scope_test.py`;
- deployment-scripts validation workflow;
- live `main`, Issue #398 and latest deployed product state.

Files inspected:

- mandatory Agent Harness documents;
- current stage workflow;
- CI scope regression suite;
- deployment-scripts validation workflow;
- official GitHub Actions documentation for workflow/job concurrency, job `if` and `needs` contexts.

Actions performed:

- classified #2689 as a successful deployment with a workflow-level control-plane cancellation after both jobs completed;
- identified the later skipped Dependabot workflow_run as the cancelling member of the static concurrency group;
- confirmed GitHub refuses retry because the cancelled workflow contains no failed/cancelled job;
- created Issue #398 with exact evidence and acceptance criteria;
- created the atomic branch and current task handoff;
- removed static workflow-level concurrency from `deploy-stage.yml`;
- added the same `deploy-stage` / `cancel-in-progress: true` contract to `jobs.deploy` after the existing fail-closed deploy condition;
- left the scope job, exact artifact validation, image selection, SSH deployment, public smoke/browser checks and Issue #12 reporting unchanged;
- extended `agent_docs_scope_test.py` to reject workflow-level or scope-job concurrency and require deploy-job concurrency;
- read both modified product/test files back from commit `90c0fcba144625754c96ff9509b2cc200307ca4e`;
- opened Draft PR #400 with exactly five changed paths;
- updated the final pre-CI handoff.

Commands or procedures:

GitHub connector reads/writes, workflow/job inspection, source search, official primary-documentation verification and branch-explicit readback.

Artifacts produced:

- Issue #398;
- PR #400;
- branch `fix/issue-398-stage-deploy-concurrency`;
- job-scoped stage concurrency owner;
- workflow source regression contract;
- updated `.agents/current/**` handoff.

Result:

Non-deployable workflow runs no longer have workflow-level access to the shared deployment concurrency group in source. Only the accepted `deploy` job carries serial cancellation. Authoritative CI and live post-merge deployment validation remain pending.

Failures:

GitHub Actions refused retry of #2689 because there was no failed or cancelled job to rerun. No source or implementation check has failed yet.

Root cause:

Workflow-level concurrency was acquired by every workflow run before the existing deploy job condition could reject non-deployable events.

Fallback:

If GitHub rejects job-level concurrency or post-merge behavior is incorrect, preserve the existing deploy gate and redesign the workflow into an unconstrained scope gate plus a separately invoked serial deploy workflow. Do not weaken exact-scope validation or allow parallel stage mutation.

Limitations:

Source contracts prove placement and preserved gates; post-merge exact-image deployment will prove the accepted path. A live cancellation collision can only be observed when a second non-deployable workflow_run arrives while deployment is active and must not be fabricated by bypassing repository controls.

Reusable lesson:

Place concurrency at the narrowest state-mutating job after fail-closed eligibility is known. Workflow-level concurrency is unsafe when a workflow intentionally receives events whose jobs are later skipped.
