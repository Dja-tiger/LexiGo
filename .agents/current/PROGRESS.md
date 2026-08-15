# Current Task Progress

## 2026-08-15 Europe/Moscow

### Verified

- Issue #528 is the atomic `/lesson/active` Active Lesson child of umbrella #205.
- Fresh base `main` is `336483615bf76e32100c52bb9317cb94ecc059b5` after docs-only PR #527 reconciliation.
- Repository handoff identifies mobile Recall Default `75:6`, mobile Recall Correct `75:30`, mobile Choice Incorrect `75:89`, desktop Study `75:120` and desktop Recall Correct `75:150`.
- Offline `75:57`, Lesson Result and Scenario lesson states have separate owners and are excluded.
- Existing `active-lesson-figma.spec.ts` already owns behavior/review/safe-exit/direct-entry/reload/history checks and remains the single Figma owner for Active Lesson.
- Existing `active-lesson-browser-zoom.spec.ts` owns real 200% browser zoom/reflow evidence.
- Active Lesson started focus mode intentionally hides primary route navigation.
- `frontend/package.json` already includes `e2e/active-lesson-figma.spec.ts` in the authoritative `test:e2e:ui` collection, as well as lesson/a11y collections; no package or workflow change is required.
- PR #529 is open from `test/issue-528-active-lesson-figma-parity` to `main` with `Closes #528` and parent #205 linkage.
- Live Figma MCP remains Starter-plan tool-call limited; no new canvas state is claimed.

### Finding

The missing #205 evidence was an explicit canonical viewport/state parity matrix with exact node provenance, semantic Light/Dark appearance and focus-mode route geometry. That evidence is implemented entirely inside the existing Figma Playwright owner.

### Root cause

The existing Active Lesson Figma owner predates the final route-by-route #205 audit and therefore did not explicitly encode every approved canonical node at the exact `390x844` / `1440x1024` viewport contract with node annotations.

### Changed files

- `frontend/e2e/active-lesson-figma.spec.ts` — adds the canonical Active Lesson parity matrix while preserving the existing Issue #193 behavior suite.
- `.agents/current/TASK.md` — Issue #528 / PR #529 execution contract.
- `.agents/current/PROGRESS.md` — current evidence and collection audit.
- `.agents/current/EXECUTION.md` — execution provenance and PR linkage.

### Checks passed

- PR #527 docs reconciliation exact-main CI #3531 passed;
- docs-only Stage #3378 correctly skipped deploy;
- no open PRs before starting Issue #528;
- branch created from exact fresh main;
- all guarded writes read back successfully and `main` remained unchanged at `336483615bf76e32100c52bb9317cb94ecc059b5`;
- updated Active Lesson spec read-back confirms ten canonical cases: five approved Figma nodes × Light/Dark semantic appearance;
- authoritative collection audit confirms the existing spec is already selected by `test:e2e:ui`; no collection-registration change is needed;
- pre-PR compare was ahead-only and limited to the Active Lesson spec plus the three current Agent Docs files.

### Checks failed

None yet. Full PR CI is the next proof gate.

### Current branch head

Resolve from live PR after this progress write. Previous head after PR execution linkage: `9116751ee04085793127cb8ca1c4e1b044c2b1d5`.

### Next action

Treat the resulting head as the immutable PR candidate, require full CI, audit reviews/threads and merge only with an unchanged expected head after all required checks pass.
