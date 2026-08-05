# Current Task

## Identity

- Issue: #398
- Branch: `fix/issue-398-stage-deploy-concurrency`
- Base SHA: `173258f9e9bf61ac97d1c053556d1bf96fe46763`
- Head SHA: resolve from live branch ref
- PR: #400

## Objective

Prevent skipped or otherwise non-deployable `Deploy Stage` workflow runs from cancelling an authoritative stage deployment, while preserving fail-closed exact-scope validation and serial cancellation between real deploy jobs.

## Scope

- move the `deploy-stage` concurrency contract from workflow level to the `deploy` job;
- keep `scope` outside the deployment concurrency group so every successful main push CI can validate its exact scope artifact;
- enter the shared concurrency group only after the existing deploy job `if` accepts workflow dispatch or a successful non-Agent-Docs main push CI;
- retain `cancel-in-progress: true` for competing real deploy jobs;
- add a source regression contract proving workflow-level concurrency is absent and job-level concurrency is present on `deploy`;
- preserve exact image selection, SSH deployment, public smoke/browser validation and Issue #12 reporting.

## Non-goals

- changing CI path classification or scope artifact format;
- changing stage image selection, deployment scripts, health checks or public browser coverage;
- changing production deployment workflow;
- adding synthetic deployment triggers or bypassing environment protection;
- changing application runtime or dependencies.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `.github/workflows/deploy-stage.yml`
- `scripts/ci/agent_docs_scope_test.py`

## Prohibited paths

- `.github/workflows/deploy-prod.yml`
- `.github/workflows/ci.yml`
- application, backend, database and frontend files;
- deployment shell scripts and compose files;
- dependency manifests;
- `.agents/PROJECT_STATE.md` before post-merge reconciliation.

## Runtime owners

- `.github/workflows/deploy-stage.yml` owns automatic/manual stage gating, exact-image deployment and stage reporting.
- `scripts/ci/agent_docs_scope.py` remains the unchanged fail-closed scope classifier and artifact validator.
- `scripts/ci/agent_docs_scope_test.py` owns CI/deployment workflow source contracts.

## Documentation owners

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Invariants

- `workflow_dispatch` remains deployable.
- Only successful `push` CI runs for `main` with validated non-Agent-Docs scope are automatically deployable.
- Non-deployable workflow runs never enter the shared `deploy-stage` concurrency group.
- Real deploy jobs remain serialized and a newer accepted deploy job may cancel an older accepted deploy job.
- Exact `ci-scope-<head_sha>` validation remains mandatory for automatic deployments.
- `IMAGE_TAG` and `APP_BUILD_ID` remain immutable SHA-derived values.
- Public endpoint smoke, desktop Chromium/iOS WebKit validation and Issue #12 reporting remain unchanged.

## Acceptance criteria

- top-level `concurrency` is absent from `deploy-stage.yml`;
- `jobs.deploy.concurrency.group` is exactly `deploy-stage` with `cancel-in-progress: true`;
- the existing deploy job condition remains fail-closed and precedes admission to the deploy job;
- the scope job can complete for docs-only and product main CI without entering deployment concurrency;
- source regression tests fail if concurrency returns to workflow level or disappears from the deploy job;
- PR CI and Deployment scripts check pass on one immutable head;
- expected-head squash merge and exact-SHA main CI complete;
- post-merge automatic stage deployment of the exact merge SHA completes successfully;
- observed skipped non-deployable Deploy Stage runs remain skipped/successful and do not change deployment status.

## Required checks

- fail-closed changed-path audit;
- `python3 scripts/ci/agent_docs_scope_test.py`;
- full repository CI selected for workflow/script changes;
- Deployment scripts check;
- review comments, reviews and unresolved threads check;
- expected-head squash merge;
- exact merge-SHA main CI, exact-image stage deploy, public smoke and public browser evidence.

## Risks

- YAML indentation could attach concurrency to the wrong job or invalidate the workflow;
- moving concurrency too early would reproduce the race, while moving it outside deploy would allow parallel stage mutation;
- manual and automatic deploy jobs must continue sharing the same group;
- a skipped job must not overwrite Issue #12 or consume the stage environment.

## Rollback

Revert the job-level concurrency move and its regression contract together. This restores the prior workflow-level serialization but also restores the known cancellation race, so rollback is emergency-only while Issue #398 remains open.
