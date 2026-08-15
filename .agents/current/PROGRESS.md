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
- Live Figma MCP remains Starter-plan tool-call limited; no new canvas state is claimed.

### Finding

The missing #205 evidence was an explicit canonical viewport/state parity matrix with exact node provenance, semantic Light/Dark appearance and focus-mode route geometry. That evidence can be added entirely inside the existing Figma Playwright owner.

### Root cause

The existing Active Lesson Figma owner predates the final route-by-route #205 audit and therefore did not explicitly encode every approved canonical node at the exact `390x844` / `1440x1024` viewport contract with node annotations.

### Changed files

- `frontend/e2e/active-lesson-figma.spec.ts` — adds the canonical Active Lesson parity matrix while preserving the existing Issue #193 behavior suite.
- `.agents/current/TASK.md` — Issue #528 execution contract.
- `.agents/current/PROGRESS.md` — current evidence and collection audit.
- `.agents/current/EXECUTION.md` — execution provenance.

### Checks passed

- PR #527 docs reconciliation exact-main CI #3531 passed;
- docs-only Stage #3378 correctly skipped deploy;
- no open PRs before starting Issue #528;
- branch created from exact fresh main;
- all guarded writes read back successfully and `main` remained unchanged at `336483615bf76e32100c52bb9317cb94ecc059b5`;
- updated Active Lesson spec read-back confirms ten canonical cases: five approved Figma nodes × Light/Dark semantic appearance;
- authoritative collection audit confirms the existing spec is already selected by `test:e2e:ui`; no collection-registration change is needed.

### Checks failed

None yet. CI has not run on the implementation candidate.

### Current branch head

Resolve from live branch after this progress write. Code candidate before this documentation update: `016dbcb6dc3edcf4a22f5acae5ad205e41204bdd`.

### Next action

Update execution provenance, verify the final branch diff is limited to the existing Active Lesson spec plus current Agent Docs, open the Issue #528 PR and require full immutable-head CI before any merge.
