# Current Task Progress

## 2026-07-28 21:17 Europe/Berlin

### Verified

- Live `main` is exactly `986ab18f4faa2f8a0581133e976cb104a3e4434a`.
- No pull request or competing Issue #70 branch was open at task start.
- PR #282 runtime deletion and PR #283 repository-memory reconciliation are merged and exact-SHA stage/public validated.
- `frontend/docs/compatibility-cleanup.md` requires one independently proven selector family per CSS cleanup slice.
- `.agents/AGENTS.issue-261-css-specificity.md` requires comment-stripped consumer search, specificity/import-order analysis, computed-cascade evidence and unchanged authoritative Linux hashes.

### Finding

The removed compatibility Phrases detail used `.lx-detail-speech-row`, and the retired compatibility lesson prompt used `.lx-test-prompt-row`. Repository search finds both class contracts only in `frontend/app/speech-player.css`; current Phrase Detail, Word Detail and Active Lesson use independent canonical class families.

### Root cause

Route-island extraction and the bounded Phrases runtime deletion removed the final markup consumers, but the grouped legacy speech layout rules remained in the shared speech stylesheet pending a separate CSS ownership audit.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md` pending

### Checks passed

- Exact-main and no-open-PR pre-flight.
- Global repository search for `.lx-detail-speech-row` and `.lx-test-prompt-row` returned only `speech-player.css`.
- Canonical `PhraseDetailPresentation`, `WordDetailPresentation` and `ActiveLessonPresentation` were read back and use independent route-specific speech layout classes.
- `speech-player.css` import order was inspected; canonical route layers load after the shared speech layer.
- The selected family is isolated from live speech state, feedback, reduced-motion and compact feedback rules.

### Checks failed

- None.

### Current branch head

Resolve from live branch ref after execution record.

### Next action

Record execution provenance, add the fail-closed source contract, delete only the exact grouped legacy selectors, update the compatibility manifest and run authoritative full CI without baseline changes.