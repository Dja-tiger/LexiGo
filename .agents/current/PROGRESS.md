# Current Task Progress

## 2026-08-15 Europe/Moscow

### Verified

- Issue #525 is the atomic `/learn` Lesson Composer child of umbrella #205.
- Fresh base `main` is `b29344917805581cdf209730da2cd56570db41b4` after docs-only PR #524 reconciliation.
- No open PR or conflicting `issue-525` branch existed before branch creation.
- Branch `test/issue-525-learn-figma-parity` was created from the exact base SHA.
- Repository handoff identifies mobile collapsed `202:6`, mobile manual `203:5`, desktop full composer `204:2`; Light/Dark share ownership/geometry with semantic tokens.
- Existing composer E2E already owns progressive-disclosure interaction/payload and desktop behavior; `learn-browser-zoom.spec.ts` owns true 200% zoom; reduced-motion and touch targets have separate owners.
- Live Figma MCP remains Starter-plan tool-call limited; no new canvas state is claimed.

### Finding

The missing #205 evidence is a narrow executable `/learn` parity matrix tying the approved node IDs, semantic appearance, route/shell ownership, horizontal geometry and reload semantics together without duplicating existing behavior tests.

### Root cause

Current Learn coverage proves behavior and accessibility slices independently but does not provide one canonical route-level Figma parity contract across collapsed/manual/desktop states and Light/Dark appearance.

### Changed files

- `.agents/current/TASK.md` — Issue #525 execution contract.
- `.agents/current/PROGRESS.md` — current evidence and plan.

### Checks passed

- exact fresh-main SHA verified;
- open PR and branch-conflict audit clean;
- task branch created from exact base;
- TASK read-back verified;
- `main` remained unchanged after the first task write.

### Checks failed

- none.

### Current branch head

Resolve from live branch ref after this progress write. Previous head after TASK write: `260508c0eaff1f789d289cd1b6fb5c1c8e53980f`.

### Next action

Record execution provenance, inspect deterministic fixture signatures and fresh Learn ownership selectors, then add the minimal test-only canonical parity spec.
