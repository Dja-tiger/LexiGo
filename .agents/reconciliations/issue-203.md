# Issue #203 Delivery Reconciliation

## Delivery

- Issue: #203 — `[Medium][OpenPencil][Handoff] Зафиксировать production source of truth и архивировать параллельные варианты`
- PR: #636 — `docs(openpencil): make production handoff authoritative`
- Final developer head: `e3fab0bcd4d84283de99be0feba1de612f8427df`
- Final immutable-head full CI: #3936 / run `32433610236` — `success`
- Squash merge / delivered main: `96e4f99f853a6ae4124fb6367fd4e968e941447e`
- Issue state after merge: closed/completed
- Exact-main push CI: required by the task contract, but the connected GitHub workflow-run action exposes only pull-request-triggered runs for a commit SHA; no main-run ID or conclusion is asserted in this record without observable evidence.

## Problem resolved

After LexiGo moved active design/handoff work from Figma to repository-owned OpenPencil, repository documentation still contained a mixed ownership model. The active `.op` had production screens that were not represented by one authoritative route/state manifest, and the dedicated Lesson Result handoff still described historical Figma nodes as an active source of truth.

That ambiguity could make a future implementation choose archival Figma provenance, an exploration frame, or an incomplete screen-map entry instead of the current OpenPencil production source.

## Delivered source-of-truth boundary

PR #636 establishes the repository-owned OpenPencil artifacts as the active production design/handoff boundary:

- `design/openpencil/LexiGo Design System.op` remains the editable repository-owned design source;
- `docs/figma/openpencil-screen-map.json` remains the detailed OpenPencil/import inventory;
- `docs/figma/openpencil-production-handoff.json` is the machine-readable canonical route/state -> OpenPencil source -> delivered GitHub Issue/PR mapping;
- `frontend/docs/adaptive-knowledge-coach.md` is reconciled to the same active ownership model;
- historical Figma file keys and node IDs are retained only as archival provenance and are not a live delivery dependency;
- no Figma MCP, Figma plan/quota, or cloud-canvas access is required for future handoff work.

## Recovered Lesson Result evidence

The active `.op` already contained the complete Lesson Result production state matrix and PR #636 maps it explicitly rather than relying on archival `217:*` identifiers:

- matrix: `fig_2745`;
- mobile Complete / Daily Goal / Next Block / Due Review / Sync Pending: `fig_3072`, `fig_3042`, `fig_3011`, `fig_2981`, `fig_2951`;
- desktop Complete / Daily Goal / Next Block / Due Review / Sync Pending: `fig_2910`, `fig_2869`, `fig_2828`, `fig_2787`, `fig_2746`.

The handoff also reconciles already delivered Phrases and Guest Home / First Use states so they are no longer described as unresolved design gaps.

## Executable contract

`scripts/ci/agent_docs_scope_test.py` now fails closed when the active production handoff drifts from repository-owned OpenPencil evidence. The contract validates semantic ownership rather than paragraph formatting and rejects:

- loss of OpenPencil as the active production source;
- missing or duplicate canonical route/state ownership;
- unresolved `screens` / `activeScreens` keys;
- missing direct `fig_*` frames;
- frame name or geometry drift for directly mapped production nodes;
- disappearance of any of the ten Lesson Result frames;
- reintroduction of an active `Figma source of truth` claim in the human handoff.

The `.op` itself was not mutated by this slice; the contract parses existing repository-local design evidence structurally and does not render the design document.

## Immutable-head validation

Final developer head `e3fab0bcd4d84283de99be0feba1de612f8427df` passed full PR CI #3936 / run `32433610236` with conclusion `success`.

The successful matrix includes the new OpenPencil/Agent Docs contract and the existing backend, frontend, browser, accessibility, CSP, service-worker, iOS PWA, performance, lesson-completion, dictionary-smoke and visual-regression gates. The preceding diagnostic run #3933 exposed one deterministic sentinel defect in the newly added contract: the human documentation quoted the exact forbidden active-Figma phrase while explaining that it was forbidden. The wording was repaired without weakening the structural assertions, and the new immutable head then passed the complete matrix.

Review audit before merge was clean: no submitted reviews and no inline review threads were present. `main` remained on the exact PR base `7ccb027828f1a180dcb62b073ddf03b7d41cfc07` until the protected squash merge.

## Post-merge state

The squash merge produced `main@96e4f99f853a6ae4124fb6367fd4e968e941447e`, and GitHub automatically closed Issue #203 as `completed` through `Closes #203`.

The repository CI workflow is configured for both `pull_request` and `push` to `main`. The current connected workflow-run lookup, however, explicitly filters commit lookups to pull-request-triggered runs. Its lookup for the delivered merge SHA therefore cannot prove or disprove the push-run result. This reconciliation intentionally records that observability limitation instead of inventing an exact-main run ID or conclusion.

No Stage or production deployment proof is required for this delivery because PR #636 changed only design/handoff documentation, a repository-local CI contract, and Agent Harness task records. It did not change frontend runtime, backend/API, persisted data, deployment configuration, visual baselines, or the OpenPencil `.op` content.

## Acceptance outcome

Issue #203 is delivered at the repository ownership level:

- each canonical handoff route/state has one explicit active OpenPencil source selection;
- delivery Issue/PR status is machine-readable and human-readable;
- Lesson Result, Phrases, and Guest Home no longer carry stale design-gap status;
- Figma identifiers are preserved only as historical provenance;
- future drift is guarded by an executable fail-closed repository contract;
- immutable developer-head full CI is green;
- review/thread audit is clean;
- protected `main` contains the squash-delivered source-of-truth contract and Issue #203 is closed/completed.

The only unasserted acceptance datum is the exact-main push-run conclusion because the available connector does not expose non-PR workflow-run listing by merge SHA. A future agent with that observable should append the run evidence if repository policy requires it for historical completeness; this does not justify fabricating evidence or reopening the delivered design ownership boundary.

## Repository memory

`.agents/current/TASK.md`, `PROGRESS.md`, and `EXECUTION.md` are reset byte-for-byte to the canonical repository templates in this reconciliation slice.

`.agents/PROJECT_STATE.md` is intentionally not rewritten through a potentially truncated connector response. This immutable reconciliation record preserves the complete verified Issue #203 / PR #636 delivery facts without risking historical-state loss.

## Next work

After this pure Agent Docs reconciliation passes its lightweight fail-closed CI and merges, select the next implementable engineering issue from the live open roadmap. Prefer work that can be completed and validated automatically; physical-device/manual UX evidence tasks should remain evidence gates rather than substitutes for an engineering slice.
