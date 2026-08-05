# Current Task Progress

## 2026-08-05 19:05 Europe/Moscow

### Verified

- live `main`: `173258f9e9bf61ac97d1c053556d1bf96fe46763`;
- latest deployed product SHA: `597e1fcf5c707ca07b6b3fb4783352be91d0555b`;
- Issue #398 is open and records the Deploy Stage concurrency race;
- Deploy Stage #2689 / run `31022198395` completed both jobs and all deployment/public steps successfully before workflow-level cancellation;
- later skipped Dependabot-triggered run #2690 / `31022367262` entered the static workflow-level group `deploy-stage` and caused the cancellation;
- current `.github/workflows/deploy-stage.yml` declares top-level `concurrency` before job-level deployability is known;
- `jobs.deploy.if` already contains the exact accepted-event and validated-scope gate;
- official GitHub Actions documentation supports `jobs.<job_id>.concurrency` and permits the `needs` context at job level.

### Finding

The existing fail-closed scope and deploy conditions are correct. The defect is solely the location of concurrency admission: workflow-level concurrency is acquired before job-level `if`, so a run that will later be skipped can cancel an authoritative deployment.

### Root cause

Static top-level `concurrency.group: deploy-stage` applies to every `workflow_run`, including pull-request, Dependabot and docs-only CI completions. Job eligibility is evaluated too late to prevent those non-deployable runs from entering the shared group.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Checks passed

- live GitHub state and exact workflow/job evidence inspection;
- repository Harness pre-flight inherited from the immediately completed reconciliation;
- current deploy workflow and source-contract inspection;
- official GitHub Actions job-level concurrency and `needs` context verification.

### Checks failed

- retry of run #2689 was rejected by GitHub because no job failed or was cancelled.

### Current branch head

Resolve from live branch `fix/issue-398-stage-deploy-concurrency`.

### Next action

Move concurrency to `jobs.deploy`, add a fail-closed source regression contract, read both files back and open a Draft PR for full CI plus Deployment scripts check.
