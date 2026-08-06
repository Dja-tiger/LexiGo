# Current Task Progress

## 2026-08-06 17:49 Europe/Moscow

### Verified

- Live `main` remains `9085cc1f886c1d4d8119ef6d9b98291d1bf76309` after Agent Docs PR #422.
- No overlapping product PR is open; #304, #305 and #403 are unrelated Dependabot maintenance.
- Issue #74 remains open and canonical Word Detail, Home and Lesson Composer already have true 200% browser-zoom evidence.
- Canonical Active Lesson is owned by `active-lesson-presentation.tsx`, `active-lesson.css` and the existing deterministic Active Lesson fixture.
- The current Active Lesson compatibility check uses CSS `document.body.style.zoom = 2`, which does not prove browser-owned zoom.
- The new specification was read back completely from the branch and `main` remained unchanged after every write.

### Finding

Canonical Recall `/lesson/active` is the next bounded route acceptance surface. At a 1440px outer viewport and browser zoom factor `2`, its CSS viewport contracts to approximately 720px and must activate the existing mobile Active Lesson presentation while preserving the Recall prompt-to-feedback workflow.

### Root cause

No production defect is classified. The missing acceptance evidence was a dedicated fail-closed browser-owned zoom contract using the established Manifest V3 controller, independent CDP telemetry and the canonical Active Lesson fixture.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/e2e/active-lesson-browser-zoom.spec.ts`

### Checks passed

- Repository harness and mandatory instruction sources read.
- Live main, open PRs, Issue #74 and post-merge CI/deploy state verified.
- Allowed-path boundary defined.
- Exact target URL and extension service-worker ownership fail closed.
- Browser zoom normalization and factor `2` are asserted through the extension controller and independent CDP layout metrics.
- Root font size remains invariant while the CSS viewport contraction is bounded around half width.
- Mobile Back/Close, hidden desktop chrome, block progress layout and one-column answer actions are asserted.
- Prompt, answer field, actions, feedback, confidence controls and advance action receive containment/non-overlap checks.
- Keyboard-visible focus and the canonical Recall `backlog` → `Знал` → `Дальше` review payload are asserted.
- Runtime error capture and a structured metrics attachment are included.
- All changed paths were read back from the branch.
- `main` remained unchanged after every branch write.

### Checks failed

- None before authoritative CI.

### Current branch head

`39eb758ccc6ca6b6b6a1f05189fd9bd0588d8277` before this progress update.

### Next action

Verify the exact branch diff, open a Draft PR and use repository CI as the authoritative lint, TypeScript, build and browser execution environment. Fix only evidence-backed failures within the allowed path boundary.
