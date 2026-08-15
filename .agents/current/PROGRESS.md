# Current Task Progress

## 2026-08-15 Europe/Moscow

### Verified

- Issue #528 is the atomic `/lesson/active` Active Lesson child of umbrella #205.
- Fresh base `main` is `336483615bf76e32100c52bb9317cb94ecc059b5` after docs-only PR #527 reconciliation.
- Repository handoff identifies mobile Recall Default `75:6`, mobile Recall Correct `75:30`, mobile Choice Incorrect `75:89`, desktop Study `75:120` and desktop Recall Correct `75:150`.
- Offline `75:57`, Lesson Result and Scenario lesson states have separate owners and are excluded.
- Existing `active-lesson-figma.spec.ts` already owns behavior/review/safe-exit/direct-entry/reload/history checks and is already included in the authoritative UI collection.
- Existing `active-lesson-browser-zoom.spec.ts` owns real 200% browser zoom/reflow evidence.
- Active Lesson started focus mode intentionally hides primary route navigation.
- Live Figma MCP remains Starter-plan tool-call limited; no new canvas state is claimed.

### Finding

The missing #205 evidence is not another behavior suite. It is an explicit canonical viewport/state parity matrix with exact node provenance, semantic Light/Dark appearance and focus-mode route geometry.

### Root cause

The existing Active Lesson Figma owner predates the final route-by-route #205 audit and therefore does not explicitly encode every approved canonical node at the exact `390x844` / `1440x1024` viewport contract with node annotations.

### Changed files

- `.agents/current/TASK.md` — Issue #528 execution contract.
- `.agents/current/PROGRESS.md` — preflight evidence and scope boundary.

### Checks passed

- PR #527 docs reconciliation exact-main CI #3531 passed;
- docs-only Stage #3378 correctly skipped deploy;
- no open PRs before starting Issue #528;
- branch created from exact fresh main;
- task write read-back passed and main remained unchanged.

### Checks failed

None.

### Current branch head

Resolve from live branch after this progress write.

### Next action

Record execution provenance, inspect the exact current `active-lesson-figma.spec.ts` owner, then add the narrow canonical parity matrix without production or baseline changes.
