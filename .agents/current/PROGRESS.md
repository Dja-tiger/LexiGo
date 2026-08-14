# Current Task Progress

## 2026-08-15 00:31 Europe/Moscow

### Verified

- Issue #522 is the atomic Home child of umbrella #205.
- Fresh base `main` is `7837f01bb969ab0551d06ab8f3288d570734c33f` after docs-only PR #521 reconciliation.
- No open PR conflicted with the new slice at branch creation.
- Branch `test/issue-522-home-figma-parity` was created from the exact base SHA.
- Repository handoff identifies Home mobile Dark `196:223` and desktop Light `194:249`; opposite appearances are token-derived.
- Existing Home tests already separately own true 200% browser zoom, reduced motion, touch targets, desktop Light layout, mobile Dark layout and route/session/history behavior.
- Live Figma MCP remains Starter-plan tool-call limited; no new canvas state is claimed.

### Finding

The missing #205 evidence is not a new Home redesign. It is a single executable route-island parity matrix that binds the approved Home node IDs, appearance semantics, shell/navigation ownership, horizontal geometry and reload stability together.

### Root cause

The existing Home coverage is fragmented across route/history, adaptive layout, reduced-motion/touch and browser-zoom specs. No single contract currently proves the four canonical layout/appearance combinations against the repository-side Figma handoff.

### Changed files

- `.agents/current/TASK.md` — Issue #522 execution contract.
- `.agents/current/PROGRESS.md` — current evidence and plan.

### Checks passed

- exact fresh-main SHA verified;
- open PR audit clean;
- task branch created from exact base;
- TASK read-back verified;
- `main` remained unchanged after the first branch write.

### Checks failed

- none.

### Current branch head

Resolve from live branch ref after this progress write. Previous head after TASK write: `823df630c6669132f07fa03023505ebcee4c2005`.

### Next action

Record execution provenance, inspect the fresh `home-route-island.spec.ts`, then add the minimal canonical parity matrix without touching product React/CSS.
