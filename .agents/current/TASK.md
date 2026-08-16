# Current Task

## Identity

- Issue: repository-memory reconciliation after merged PR #561 / parent Issue #18
- Branch: docs/reconcile-pr-561
- Base SHA: faa62cc2ea023d8e52aecc5d97c8cabe97748daf
- Head SHA: resolve from live branch ref
- PR:

## Objective

Reconcile Agent Harness state after PR #561 merged and exact-main CI/Stage passed, then reset `.agents/current/**` from repository templates before starting the next product/design slice.

## Scope

- Record the verified PR #561 merge, exact-main CI and exact-SHA Stage status in `.agents/PROJECT_STATE.md`.
- Preserve the fact that parent Issue #18 remains open in live GitHub even though the selection-reason transparency slice is delivered.
- Reset `.agents/current/TASK.md`, `PROGRESS.md` and `EXECUTION.md` byte-for-byte from repository templates after durable state is promoted.

## Non-goals

- No product/runtime code changes.
- No backend/API/scheduler changes.
- No Figma/OpenPencil source changes.
- No workflow or deployment changes.
- No closure of Issue #18 without a separate acceptance audit.
- No start of Issue #203/#205 implementation inside this reconciliation PR.

## Allowed paths

- .agents/PROJECT_STATE.md
- .agents/current/TASK.md
- .agents/current/PROGRESS.md
- .agents/current/EXECUTION.md

## Prohibited paths

- frontend/**
- backend/**
- design/**
- docs/figma/**
- deploy/**
- .github/workflows/**
- all other repository paths

## Runtime owners

Read-only evidence only; no runtime owner changes.

## Documentation owners

- `.agents/PROJECT_STATE.md` for durable verified delivery state.
- `.agents/current/**` for transient task state, reset from `.agents/templates/**` at completion.

## Invariants

- Live GitHub remains authoritative over stale repository memory.
- `main` remains unchanged by all writes in this branch.
- Final diff contains only the four allowed Agent Harness paths.
- Do not claim Issue #18 closed while live GitHub reports it open.
- No Stage redeploy is required for a docs-only reconciliation.

## Acceptance criteria

- PR #561 merge SHA `faa62cc2ea023d8e52aecc5d97c8cabe97748daf` is recorded.
- Exact-main CI #3678 / run `31967827204` is recorded as successful.
- Stage deployment status on exact SHA `faa62cc2ea023d8e52aecc5d97c8cabe97748daf` is recorded as successful, including public smoke/browser success.
- `.agents/current/**` matches the repository templates in the final branch state.
- Agent Docs validation/CI passes on the final developer-authored head.
- Final branch compare contains only allowed Agent Harness changes.

## Required checks

- Read-back after every branch write.
- Verify branch head after every write and confirm `main` remains `faa62cc2ea023d8e52aecc5d97c8cabe97748daf` until expected merge.
- Agent Harness / docs-scope CI selected by repository classifier.
- Clean PR diff and review/thread audit before merge.

## Risks

- Accidentally converting an open parent Issue into a false completed claim.
- Losing durable historical evidence while replacing `PROJECT_STATE.md`.
- Starting a new product task before current context is reset.

## Rollback

Close/revert the reconciliation PR; product/runtime merge `faa62cc2...` and Stage deployment remain unaffected.
