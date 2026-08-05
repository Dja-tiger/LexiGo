# Current Task Progress

## 2026-08-05 19:15 Europe/Moscow

### Verified

- live product/docs `main` at slice start: `173258f9e9bf61ac97d1c053556d1bf96fe46763`;
- latest deployed product SHA: `597e1fcf5c707ca07b6b3fb4783352be91d0555b`;
- Draft PR #400 targets `main` from `fix/issue-398-stage-deploy-concurrency`;
- Issue #398 records the Deploy Stage concurrency race;
- Deploy Stage #2689 / run `31022198395` completed both jobs and all deployment/public steps successfully before workflow-level cancellation;
- later skipped Dependabot-triggered run #2690 / `31022367262` entered the static workflow-level group `deploy-stage` and caused the cancellation;
- `jobs.deploy.if` already contains the exact accepted-event and validated-scope gate;
- official GitHub Actions documentation supports `jobs.<job_id>.concurrency`, permits job-level `needs` context and marks jobs rejected by `jobs.<job_id>.if` as skipped rather than running;
- branch product/test commit before final handoff: `90c0fcba144625754c96ff9509b2cc200307ca4e`.

### Finding

The existing fail-closed scope and deploy conditions were correct. The defect was solely concurrency admission at workflow level, before non-deployable events could be rejected by the deploy job condition.

### Root cause

Static top-level `concurrency.group: deploy-stage` applied to every `workflow_run`, including pull-request, Dependabot and docs-only CI completions. Those runs could cancel a real deployment even though `jobs.deploy.if` would later skip them.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `.github/workflows/deploy-stage.yml`
- `scripts/ci/agent_docs_scope_test.py`

### Checks passed

- live GitHub state and exact workflow/job evidence inspection;
- current deploy workflow, source-contract and deployment-scripts validation inspection;
- official GitHub Actions job-level concurrency, job-condition and `needs` context verification;
- workflow-level `concurrency` removed;
- unchanged fail-closed `scope` and `deploy.if` gates read back from product/test commit;
- `jobs.deploy.concurrency.group: deploy-stage` and `cancel-in-progress: true` read back from product/test commit;
- source regression contract now rejects top-level concurrency, rejects concurrency on `scope`, and requires deploy-job concurrency after the deploy condition;
- both changed product/test files were read back from immutable commit `90c0fcba144625754c96ff9509b2cc200307ca4e`;
- Draft PR #400 opened with exactly five changed paths.

### Checks failed

- retry of run #2689 was rejected by GitHub because no job failed or was cancelled; no implementation check has failed yet.

### Current branch head

Resolve from live branch `fix/issue-398-stage-deploy-concurrency`; `90c0fcba144625754c96ff9509b2cc200307ca4e` is the last product/test commit before final handoff documentation updates.

### Next action

Run authoritative repository CI plus Deployment scripts check on the final documented PR #400 head. If green, verify diff/reviews, perform expected-head squash merge, then validate exact merge-SHA main CI and automatic exact-image stage/public deployment under job-level concurrency.
