# Current Task

## Identity

- Issue: repository state reconciliation after #505/#506/#507
- Branch: `docs/reconcile-figma-delivery-state`
- Base SHA: `07503e6fdd619a924b72c9f48f80f482bf36e28d`
- Head SHA: resolve from live branch ref
- PR: TBD

## Objective

Reconcile repository-owned Agent Harness state with the verified Figma/PWA delivery sequence and reset `.agents/current` after the completed product slice.

## Scope

Update `.agents/PROJECT_STATE.md` with exact merged/runtime/Figma evidence from #505/#506/#507 and the remaining #68/#201/#203/#205/#487 gates; restore `.agents/current/*` to the canonical clean templates before merge.

## Non-goals

No runtime code, CI workflow, Figma canvas, issue acceptance semantics, deployment configuration, design asset, or native `.fig` mutation.

## Allowed paths

`.agents/PROJECT_STATE.md`, `.agents/current/TASK.md`, `.agents/current/PROGRESS.md`, `.agents/current/EXECUTION.md`.

## Prohibited paths

Everything else.

## Runtime owners

None; this is repository-state documentation only.

## Documentation owners

`.agents/PROJECT_STATE.md` is the operational project-state source; `.agents/current/*` must end as clean task templates.

## Invariants

Do not claim #507 Stage until exact merge SHA validation is green. Do not claim native `.fig` storage or Figma Screen Map synchronization. Keep physical-device #68 acceptance manual.

## Acceptance criteria

Project state names current main and latest verified Stage SHA, records #201 node-level audit and active Figma limitations, records #505/#506/#507 delivery, and leaves `.agents/current/*` clean for the next task.

## Required checks

Agent Docs classifier/harness validation only; runtime jobs must remain skipped.

## Risks

Stale delivery claims if final Stage evidence is copied before completion.

## Rollback

Revert the docs-only reconciliation squash merge.
