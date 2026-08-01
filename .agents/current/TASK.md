# Current Task

## Identity

- Issue: #70
- Branch: `docs/fix-phrases-cascade-rule`
- Base SHA: `4b4da827856c2551321332afeed4f9c9473bdcb3`
- PR: #332

## Objective

Synchronize the normative computed-cascade rule with the production Phrases order-independence contract already delivered by PR #330.

## Verified discrepancy

- `frontend/app/layout.tsx` imports `phrases.css` before `catalog-enhancements.css`.
- `frontend/components/phrases-css-ownership.test.ts` requires that adversarial order and proves every overlapping Phrases selector outranks the shared base.
- `.agents/AGENTS.issue-261-css-specificity.md` still required the previous shared-before-route order, contradicting live source, tests and `.agents/PROJECT_STATE.md`.

## Scope

- Replace the stale import-order requirement with the PR #330 route-before-shared order-independence contract.
- Record the exact specificity pairs and regression gates.
- Preserve the confirmed incident history and all other normative CSS rules.

## Non-goals

- No runtime, CSS, test, workflow, dependency, README, architecture or Issue-state change.
- No new product slice until this normative discrepancy is merged and current context is reset.

## Allowed paths

- `.agents/AGENTS.issue-261-css-specificity.md`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Acceptance criteria

- The specialized rule matches live layout and executable ownership tests.
- The branch diff contains only the four allowed Agent Docs paths.
- Lightweight Agent Docs CI passes while heavy product jobs remain skipped.
- Review audit, expected-head squash merge and post-merge lightweight CI complete.

## Rollback

Revert the documentation commits. Product runtime is unaffected.
