# Current Task Execution

## Task

- Issue: #398
- Branch: `fix/issue-398-stage-deploy-concurrency`
- Base SHA: `173258f9e9bf61ac97d1c053556d1bf96fe46763`
- Head SHA: resolve from live branch ref
- PR:

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
- selected job-level concurrency after the existing fail-closed deploy condition as the bounded fix;
- created the atomic branch and current task handoff.

Commands or procedures:

GitHub connector reads/writes, workflow/job inspection, source search and official primary-documentation verification.

Artifacts produced:

- Issue #398;
- branch `fix/issue-398-stage-deploy-concurrency`;
- populated `.agents/current/**` handoff.

Result:

Root cause and bounded implementation path are confirmed. Product workflow and regression-test changes are not yet written.

Failures:

GitHub Actions refused retry of #2689 because there was no failed or cancelled job to rerun.

Root cause:

Workflow-level concurrency is acquired by every workflow run before the existing deploy job condition can reject non-deployable events.

Fallback:

If job-level concurrency does not validate in GitHub Actions, preserve the existing deploy gate and redesign the workflow into an unconstrained scope gate plus a separately invoked serial deploy workflow. Do not weaken exact-scope validation or allow parallel stage mutation.

Limitations:

A static/source contract can prove placement and preserved gates; post-merge exact-image deployment proves the accepted path. Reproducing a live collision requires a second non-deployable workflow_run while deployment is active and must not be fabricated by bypassing repository controls.

Reusable lesson:

Place concurrency at the narrowest state-mutating job after fail-closed eligibility is known. Workflow-level concurrency is unsafe when the workflow intentionally receives events that later become skipped jobs.
