# Current Task

## Identity

- Issue: #642 evidence only
- Branch: evidence/issue-642-openpencil-renders
- Base SHA: 564bc24ab2b7f47e9f8d6e82989cbfd1df51adce
- Head SHA: resolve from live branch ref
- PR: pending, must never merge

## Objective

Generate exact repository-owned OpenPencil PNG references for the eight First Use loading/error nodes without mutating the product source of truth.

## Scope

- temporarily set `render:true` for the eight target entries in `docs/figma/openpencil-screen-map.json`;
- trigger the existing OpenPencil visual acceptance workflow through an ephemeral Draft PR;
- download and inspect the resulting active-source PNG evidence;
- close the evidence PR without merge.

## Non-goals

- no `.op` or token mutation;
- no runtime/test/workflow change;
- no merge to main.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `docs/figma/openpencil-screen-map.json`

## Prohibited paths

- `design/**`
- `frontend/**`
- `backend/**`
- `api/**`
- `.github/workflows/**`
- dependency/runtime/deploy files

## Runtime owners

None; evidence-only branch.

## Documentation owners

`docs/figma/openpencil-screen-map.json` temporary render metadata only; Issue #642.

## Invariants

- active `.op` identity remains unchanged;
- only eight `render` booleans may differ from main;
- branch/PR must be closed without merge after artifact capture.

## Acceptance criteria

- OpenPencil acceptance workflow renders n117/n128/n277/n288/n442/n456/n614/n628 from exact committed `.op`;
- artifact is captured with run/head provenance;
- evidence PR is closed unmerged.

## Required checks

OpenPencil visual acceptance workflow.

## Risks

Accidental merge would mutate screen-map render metadata; prevent by keeping Draft and closing after evidence capture.

## Rollback

Close PR and delete/abandon branch; main is never changed.
