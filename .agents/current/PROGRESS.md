# Current Task Progress

## 2026-08-06 17:43 Europe/Moscow

### Verified

- Live `main` is `9085cc1f886c1d4d8119ef6d9b98291d1bf76309` after Agent Docs PR #422.
- No overlapping product PR is open; #304, #305 and #403 are unrelated Dependabot maintenance.
- Issue #74 remains open and canonical Word Detail, Home and Lesson Composer already have true 200% browser-zoom evidence.
- Canonical Active Lesson is owned by `active-lesson-presentation.tsx`, `active-lesson.css` and the existing deterministic Active Lesson fixture.
- The current Active Lesson compatibility check uses CSS `document.body.style.zoom = 2`, which does not prove browser-owned zoom.

### Finding

Canonical Recall `/lesson/active` is the next bounded route acceptance surface. At a 1440px outer viewport and browser zoom factor `2`, its CSS viewport should contract to approximately 720px and activate the existing mobile Active Lesson presentation.

### Root cause

No production defect is classified yet. The missing acceptance evidence is a dedicated fail-closed browser-owned zoom contract using the established Manifest V3 controller and independent CDP telemetry.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`

### Checks passed

- Repository harness and mandatory instruction sources read.
- Live main, open PRs, Issue #74 and post-merge CI/deploy state verified.
- Allowed-path boundary defined.
- Current task record read back from the branch.
- `main` remained unchanged after the first branch write.

### Checks failed

- None.

### Current branch head

Resolve from live branch ref after this write.

### Next action

Record execution provenance, implement `frontend/e2e/active-lesson-browser-zoom.spec.ts`, read back every changed path, verify the exact diff and open a Draft PR for authoritative CI.
