# Current Task Progress

## 2026-08-15 15:36 Europe/Moscow

### Verified

- `main` / base SHA is `e2f4a754cb5dab65d55af248d4e7e6359083c710`; no open PR existed before starting #533.
- Issue #533 is the next executable Figma child under #205.
- Repository-approved Word Detail nodes are mobile Dark `78:99` and desktop Dark `78:274`; Light is semantic-token-derived from the same approved hierarchy/geometry.
- Live Figma MCP remains unavailable due Starter-plan tool-call quota, so no fresh canvas/screenshot approval is claimed.
- Existing authoritative owner is `frontend/e2e/word-detail-visual.spec.ts`; it is collected by Visual regression and already owns deterministic Light/Dark baselines, 200% text reflow, forced-colors and browser-owned zoom.
- Standalone `/words/[id]` remains detail state inside `data-route-client-island="dictionary"`; semantic main is `Карточка слова`.
- Mandatory read-back confirmed the existing browser-owned zoom section remains intact and all four content-addressed baseline SHA-256 values are unchanged.
- Branch compare against exact base is ahead-only with exactly four changed files: the existing Word Detail visual owner plus `.agents/current/{TASK,PROGRESS,EXECUTION}.md`.
- Draft PR #535 is open against `main`.

### Finding

Implemented a test-only 4-case canonical parity matrix inside the existing Word Detail visual owner:
- mobile Dark `390x844`, Figma `78:99`;
- mobile Light `390x844`, same geometry + Light semantic tokens;
- desktop Dark `1440x1024`, Figma `78:274`;
- desktop Light `1440x1024`, same geometry + Light semantic tokens.

The matrix verifies direct route ownership, semantic main/detail surface, canonical content/practice action, explicit appearance/canvas token, horizontal containment, no x-overflow, one visible shared RouteChrome owner, reload stability and empty runtime errors. Mobile navigation is explicitly required to be `mobile`. Desktop navigation is recorded as browser evidence first and required to stay stable across reload rather than being inferred from generic breakpoint CSS.

### Root cause

No product defect has been established. This slice addresses missing executable Figma parity evidence. The prior Dictionary audit demonstrated that generic navigation breakpoint CSS can be overridden by downstream route/adaptive cascade, so desktop Word Detail ownership is intentionally evidence-driven.

### Changed files

- `frontend/e2e/word-detail-visual.spec.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Checks passed

- preflight ownership audit;
- repository-approved Figma node mapping audit;
- source owner/collection audit;
- baseline non-mutation review;
- complete source read-back including the existing browser-owned zoom tail;
- ahead-only branch compare with exactly four allowed changed files;
- Draft PR #535 creation from exact base `e2f4a754cb5dab65d55af248d4e7e6359083c710`.

### Checks failed

- none yet; immutable-head CI is pending on the final provenance-updated head.

### Current branch head

Resolve from live branch ref after this final Agent Docs provenance commit. Product test commit: `f571a85e44b942739b2320877933def9597cf431`. PR #535 was initially opened at `02d8cc5f81daa9278969b79e8c89545b70bd559d` before PR-number provenance updates.

### Next action

Freeze the branch after this commit, resolve the final head SHA and use only CI/review reads until browser evidence proves a required correction. Inspect authoritative Visual regression artifacts for the observed desktop RouteChrome owner. If a concrete owner is established, encode only that observed expectation and rerun the new immutable head; do not change production CSS or visual baselines.
