# Current Task Progress

## 2026-08-15 Europe/Moscow

### Verified

- Issue #531 is the atomic `/dictionary` child of umbrella #205.
- Fresh base `main` is `e3cf4054068867012e01f6ccba528dc04498686f` after docs-only PR #530 reconciliation.
- Repository handoff identifies mobile Dictionary Light `78:54` and desktop Dictionary Light `78:193`; Dark uses the same geometry with semantic Dark tokens.
- Live Figma MCP remains Starter-plan tool-call limited; no fresh canvas approval is claimed.
- Existing `dictionary-route-island.spec.ts` owns direct-entry session/bootstrap handoff and route-history semantics and is already included in authoritative `test:e2e:ui` and navigation collections.
- Existing search/filter/pagination, touch targets, iOS PWA, browser zoom, reduced motion, accessibility, Dictionary Empty/Error/System States and Word Detail have separate owners.
- Runtime ownership confirms `LexigoDictionaryApp` exposes `data-route-client-island="dictionary"`, semantic main `#lexigo-main-content[aria-label="Словарь"]`, and `.lx-dictionary-catalog`.
- Shared route-navigation CSS exposes `mobile` at 390px, `header` at 1440px and `rail` only at 720–1099px.
- Canonical semantic appearance colors remain Light `#f4f7f5` and Dark `#10211d`.

### Finding

The missing #205 evidence was a canonical direct-route parity matrix with exact Figma node provenance, exact mobile/desktop viewport ownership, Light/Dark semantic appearance, route-navigation ownership, horizontal containment and reload stability. That evidence is now implemented inside the existing Dictionary route-island owner.

### Root cause

The Dictionary route-island test predates the final #205 route-by-route visual parity audit and focuses on session bootstrap/history handoff rather than approved Figma viewport/node provenance.

### Changed files

- `frontend/e2e/dictionary-route-island.spec.ts` — adds the canonical Dictionary parity matrix while preserving the existing session/bootstrap/history test.
- `.agents/current/TASK.md` — Issue #531 execution contract.
- `.agents/current/PROGRESS.md` — preflight and implementation evidence.
- `.agents/current/EXECUTION.md` — execution provenance.

### Checks passed

- PR #530 docs reconciliation CI #3537 passed;
- docs-only exact-main CI #3538 passed;
- Stage #3387 correctly skipped deployment for docs-only merge;
- no open PRs before starting Issue #531;
- branch created from exact fresh main;
- all guarded writes read back successfully and `main` remained unchanged at `e3cf4054068867012e01f6ccba528dc04498686f`;
- implementation read-back confirms four canonical cases: `78:54` and `78:193` × Light/Dark;
- existing session/bootstrap/history test remains present with its original behavior/assertions;
- canonical matrix uses exact `390x844` / `1440x1024` viewports, `mobile` / `header` navigation ownership, semantic canvas tokens, horizontal containment, no x-overflow, reload stability and exact `figma` annotations;
- authoritative collection audit confirms the existing spec is already selected by `test:e2e:ui` and navigation suites; no package/workflow mutation is needed.

### Checks failed

No repository/application check has failed yet. Full PR CI is the next executable proof gate. Live Figma canvas access remains externally quota-blocked.

### Current branch head

Resolve from live branch ref after this progress write. Previous implementation head before execution/progress evidence: `f8e5f90513ad61eb994782533b15c7a76bf9ab91`.

### Next action

Compare the task branch against exact base `main`, require the diff to remain limited to the Dictionary spec plus the three current Agent Docs files, open PR with `Closes #531` and parent #205 linkage, then treat the final resulting head as immutable for full CI/review/merge gates.
