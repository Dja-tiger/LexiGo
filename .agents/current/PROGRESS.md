# Current Task Progress

## 2026-07-31 19:18 Europe/Moscow

### Verified

- Live main before the slice: `ec3d3f05f97a61b4600abc2d5947726d599e8618`.
- Issue #70 remains open.
- PR #323 corrected stale PROJECT_STATE and passed lightweight CI #2448 before merge.
- Legacy Learn presentation was removed by PR #318 and exact-SHA stage validation passed.
- Fresh selector search showed canonical `LexigoLearnApp` still consumes `lx-composer-context`, `lx-setup-card`, `lx-setup-block`, `lx-mode-selector`, `lx-source-selector`, `lx-setup-footer`, `lx-lesson-preview` and `lx-setup-submit`.
- Draft PR #324 contains only the fallback source contract and `.agents/current/**`.

### Finding

There is no safe orphaned Learn CSS deletion family. The bounded evidence slice inventories the final compatibility fallback and the dedicated route islands that precede it.

### Changed files

- `frontend/components/compatibility-fallback-source.test.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### CI evidence

- Authoritative CI #2450 / run `30636055474` passed change classification, backend unit/security, backend integration, frontend lint and TypeScript.
- The unit gate failed only in the new source contract because it asserted the nonexistent copy `LexiGo не смог открыть страницу` inside `LexigoPremiumApp`.
- Exact source inspection proved the unknown/product route boundary structurally: `routeGraphForPath` returns `product`, and the final bootstrap else-branch renders `<LexigoPremiumApp key={routeKey} initialSession={initialSession} />`.
- The assertion was replaced with that actual structural evidence. Runtime and CSS remain unchanged.

### Process deviation

The source-test file was created before `.agents/current/TASK.md` was populated. No runtime, CSS, workflow or default-branch file changed. The allow-list is frozen and the deviation is recorded.

### Current branch head

Resolve from the live branch after the progress commit.

### Next action

Read back the corrected contract and branch diff, then evaluate the new authoritative CI on the exact developer-authored head. If fully green, perform review audit, Ready transition, expected-head squash merge and exact-SHA stage/public validation.
