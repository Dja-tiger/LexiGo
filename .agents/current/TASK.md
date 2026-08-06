# Current Task

## Identity

- Issue: #74
- Branch: `docs/issue-74-related-phrase-targets-reconciliation`
- Base SHA: `477bccd8f38e648a3ad536dcc58526303297a376`
- Head SHA: resolve from live branch ref
- PR: not opened yet

## Objective

Reconcile the completed PR #413 product delivery into canonical repository memory, publish the factual Issue #74 completion evidence, and reset `.agents/current/**` without changing runtime behavior.

## Scope

- Update `.agents/PROJECT_STATE.md` with PR #413, authoritative PR CI #2917, squash SHA `477bccd8f38e648a3ad536dcc58526303297a376`, exact-SHA main CI #2918 and Deploy Stage #2756 evidence.
- Record the completed Word Detail related-phrase target slice and remaining Issue #74 acceptance scope.
- Add one factual completion comment to Issue #74.
- Reset `.agents/current/TASK.md`, `.agents/current/PROGRESS.md` and `.agents/current/EXECUTION.md` to canonical templates before opening the PR.
- Deliver the reconciliation through the fail-closed docs-only CI path.

## Non-goals

- No frontend, backend, workflow, dependency, deployment or runtime change.
- No closure of Issue #74.
- No new product slice.
- No changes to Dependabot PRs #304, #305 or #403.
- No stage deployment from the docs-only reconciliation.

## Allowed paths

- `.agents/PROJECT_STATE.md`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- All product, test, workflow, dependency and deployment paths.
- Issue state changes other than one factual comment on Issue #74.
- Any product code or visual-baseline modification.

## Runtime owners

- None. This is an Agent Docs reconciliation slice.

## Documentation owners

- Durable repository memory: `.agents/PROJECT_STATE.md`.
- Active-task records during execution and canonical reset before merge: `.agents/current/**`.
- External factual completion evidence: Issue #74.

## Invariants

- Product SHA remains `477bccd8f38e648a3ad536dcc58526303297a376`.
- PR #413, CI #2917, main CI #2918 and Deploy Stage #2756 facts are recorded exactly.
- Issue #74 remains open for remaining live controls, whole-application 200% browser zoom and physical-device acceptance.
- Final changed paths are exactly the four allowed Agent Docs files.
- Final `.agents/current/**` contents equal the canonical reset templates.
- Docs-only CI must classify the change as Agent Docs only and must not run product or deployment jobs.

## Acceptance criteria

- `.agents/PROJECT_STATE.md` identifies PR #413 as the latest completed product slice and `477bccd8...` as the latest deployed product SHA.
- The completed related-phrase target contract, exact visual provenance and remaining Issue #74 scope are recorded accurately.
- Issue #74 contains one factual completion comment with immutable refs and remains open.
- `.agents/current/**` is reset to canonical templates.
- The docs PR contains exactly four allowed paths, has no unresolved review threads, passes lightweight CI, is squash-merged with expected-head protection, and exact merged-SHA docs CI succeeds.

## Required checks

- Readback after every write.
- Exact branch/main ref verification.
- Focused compare against base SHA.
- Docs-only change-scope classifier and Agent Harness validation.
- Review-thread and review-state inspection.
- Expected-head squash merge.
- Exact merged-SHA lightweight main CI.
- Verify that no stage deployment is triggered by the docs-only merge.

## Risks

- Stale or imprecise workflow identifiers could corrupt repository memory.
- Resetting current task files before durable evidence is complete could lose delivery context.
- A non-doc path would incorrectly activate product CI/deployment.
- Duplicate Issue #74 completion comments would create conflicting evidence.

## Rollback

Revert the docs-only reconciliation commit. Product code, images and stage deployment remain unchanged because this slice has no runtime paths.