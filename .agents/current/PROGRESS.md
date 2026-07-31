# Current Task Progress

## 2026-07-31 16:27 Europe/Moscow

### Verified

- Live main before the slice: `ec3d3f05f97a61b4600abc2d5947726d599e8618`.
- Issue #70 remains open.
- PR #323 corrected stale PROJECT_STATE and passed lightweight CI #2448 before merge.
- Legacy Learn presentation was removed by PR #318 and exact-SHA stage validation passed.
- Fresh selector search showed canonical `LexigoLearnApp` still consumes `lx-composer-context`, `lx-setup-card`, `lx-setup-block`, `lx-mode-selector`, `lx-source-selector`, `lx-setup-footer`, `lx-lesson-preview` and `lx-setup-submit`.

### Finding

There is no safe orphaned Learn CSS deletion family. The next bounded evidence slice is an executable inventory of the final compatibility fallback and the route islands that precede it.

### Changed files

- `frontend/components/compatibility-fallback-source.test.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Process deviation

The source-test file was created before `.agents/current/TASK.md` was populated. No runtime, CSS, workflow or default-branch file changed. The task record now explicitly freezes the allow-list; all current files must be read back before further writes.

### Current branch head

Resolve after the current task-memory commits.

### Next action

Populate EXECUTION, read back all four files, compare the branch with main, then open a Draft PR and run authoritative CI. Any failing assertion must be classified against actual source before changing the contract.
