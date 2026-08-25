# Current Task Progress

## 2026-08-24 22:45 Europe/Berlin

### Verified

- Live pre-flight after docs reconciliation #683 found no open PRs and `main=dd7db59be38cbc2dd28e00cd101e3d64e56c64b8`.
- Issue #205 remains open and requires route-by-route visual parity plus consistent shell/navigation ownership.
- Generic `route-navigation.css` starts tablet rail at 720px, but closed Issue #603 intentionally overrides only 720–767px to compact/mobile for seven ordinary route families because rail caused true-browser-zoom clipping.
- `issue-603-browser-zoom-reflow.css` is imported late from root `layout.tsx` and therefore owns effective 720–767px compact presentation.
- The late #603 owner still copied retired navy/purple mobile paint, while canonical <=719 compact presentation in `adaptive-knowledge-coach-home.css` already uses semantic Foundation tokens.
- No existing open Issue covers this exact visual gap; Issue #684 was created under #205.

### Finding

The navigation-owner difference at exact 720px is intentional reflow compatibility, not the defect. The defect is stale presentation inside that intentional owner: true 200% browser zoom on seven ordinary routes receives the old floating dark/purple mobile bar in both explicit Light and Dark.

### Root cause

`issue-603-browser-zoom-reflow.css` copied the historical mobile RouteChrome declarations and is loaded after the current semantic compact owner. Its route-scoped 720–767px selectors therefore win the cascade for background, border, link and active paint as well as old floating-bar geometry.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `frontend/app/issue-603-browser-zoom-reflow.css`
- `frontend/components/issue-603-browser-zoom-reflow-source.test.ts`
- `frontend/e2e/issue-684-zoom-compact-semantic.spec.ts`
- `frontend/playwright.visual.config.ts`

### Checks passed

- Source/read-back review confirms #603 route list, reflow/content/reminder repairs and 720–767 ownership remain intact.
- Runtime CSS now mirrors current semantic compact navigation geometry/paint and removes retired copied values from the late owner.
- Fail-closed source contract compares the late owner to canonical compact declarations and rejects retired paint.
- Dedicated true-browser-zoom Light/Dark computed-style proof is registered in authoritative Visual CI and checks exact 720px, exactly one mobile owner, semantic surface/border/text/primary paint and absence of retired computed RGB values.

### Checks failed

- No executable CI result yet for the new branch head.
- Existing #603 and consolidated browser-zoom visual fingerprints are expected to fail until exact Linux changed actuals are produced and manually reviewed; do not approve them from source changes alone.

### Current branch head

Resolve from live branch ref before opening the Draft PR / treating any CI as immutable evidence.

### Next action

Open a Draft PR after scope/read-back audit, run full diagnostic immutable-head CI, inspect the exact Linux Visual artifact for all changed 720px route/theme captures, and only then update approved fingerprints/provenance if the visual result is correct.
