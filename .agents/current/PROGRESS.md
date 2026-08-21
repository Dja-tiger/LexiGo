# Current Task Progress

## 2026-08-21 13:24 +03

### Verified

- Live `main` is `37fe3016673ab261e4df4232274535f834578b77`.
- No open PR exists in `Dja-tiger/LexiGo` at task start.
- Issue #641 is open under parent #205 and defines a test/evidence-only OpenPencil system-state audit.
- Branch `test/issue-641-system-state-openpencil` was created from exact `main@37fe3016…`.
- `.agents/current/**` was on canonical reset templates before task declaration.
- Existing system-state owners: `frontend/e2e/system-states.spec.ts`, `frontend/e2e/system-states-visual.spec.ts`, `frontend/e2e/system-state-touch-targets.spec.ts`, `frontend/components/system-states-contract.test.ts`.
- Active OpenPencil mapping contains Home Loading `fig_4258`, Dictionary Empty `fig_4234`, shared Error `fig_4222`, Desktop Offline `fig_4104`, Active Lesson Recall Offline `fig_3193`, plus separate First Use loading/error states.

### Finding

`frontend/e2e/system-states-visual.spec.ts` still models active provenance as Figma-only (`figmaNode`, Figma wording) even though #203 promoted repository-owned OpenPencil as the active design source. Existing exact Linux fingerprints are already approved and should not change.

### Root cause

Design-source migration updated repository handoff/mapping, but this older visual owner was not migrated from legacy Figma node provenance to fail-closed `screenMapKey + openPencilNode + route + viewport` resolution. Later #205 audit slices explicitly left applicable system-state reconciliation outstanding.

### Changed files

- `.agents/current/TASK.md` — declared Issue #641 scope, path allow-list, invariants and delivery gates.
- `.agents/current/PROGRESS.md` — this factual task record.

### Checks passed

- Live open-PR search: none.
- `main` verified unchanged after branch creation and TASK write.
- TASK read-back confirmed exact branch content and blob `cfc26bb425c51a66327ee4650bee59e2b44b4070`.

### Checks failed

- During task setup, two calls were incorrectly routed to `create_pull_request(main→main)` while intending to create Issue #641. GitHub rejected both before mutation with HTTP 422 `No commits between main and main`.
- Recovery completed: writes stopped, `main` was re-read and remained `37fe3016…`; the exact `create_issue` schema was then loaded and Issue #641 created successfully. Do not repeat the misrouted call.

### Current branch head

- TASK declaration commit: `e5b3619ca6242e6a777412add03ebbdc1a66b32b`.
- Resolve current head again after this PROGRESS write.

### Next action

Record EXECUTION/tool-selection recovery, then inspect the exact visual owner by line ranges and implement the OpenPencil provenance/source contract without changing runtime or approved hashes.
