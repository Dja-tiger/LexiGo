# Current Task Progress

## 2026-07-28 19:36 Europe/Moscow

### Verified

- Issue: #70 — remove unused application implementations and conflicting global styles.
- Branch: `test/issue-70-phrases-compatibility-proof`.
- Base SHA: `3d4a8dd49255da11f25fd38f92b2a8637d443517`.
- No open pull request existed when the slice started.
- `LexigoBootstrappedApp` selects `LexigoPhrasesApp` for `/phrases` and `/phrases/[slug]` without a session condition.
- The Phrases render branch appears before the final `LexigoPremiumApp` fallback.
- `LexigoPremiumApp` remains reachable for guest authentication, account recovery and other fallback states; deleting the complete component is not safe.
- `LexigoPhrasesApp` owns guest catalog data, authenticated bounded catalog reads, independent direct detail, URL/History state and Learn handoff.

### Finding

- The Phrases catalog/detail family embedded in `LexigoPremiumApp` is unreachable from canonical Phrases routes for both guest and authenticated entry.
- The compatibility app still contains route-only catalog/detail state, effects, API loaders and presentation branches that duplicate the dedicated island.
- The same compatibility app also contains live phrase lesson-domain behavior that must not be removed with the route family.

### Root cause

- Route extraction completed canonical ownership but intentionally retained the old compatibility implementation as rollback/dead-code debt until reachability and shared-domain boundaries were proven.

### Changed files

- `.agents/AGENTS.issue-70-compatibility-reachability.md`
- `.agents/AGENTS.md`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/components/phrases-route-island-source.test.ts`
- `frontend/docs/compatibility-cleanup.md`

### Checks passed

- Mandatory harness, Issue #70, current `PROJECT_STATE`, architecture and route-island rules were read before writes.
- Exact bootstrap read proves session-independent Phrases route selection and render precedence over the fallback.
- Exact canonical Phrases source read proves guest, authenticated, direct-detail, URL/History and Learn-handoff ownership.
- Exact compatibility source reads identified the route-only candidate markers and the live shared phrase lesson markers.
- Source contract readback confirms guest/auth reachability, render order, deletion candidates and preserved shared-domain assertions.
- Deletion manifest readback confirms one bounded next runtime slice, CSS stop conditions and full validation requirements.
- Every write was branch-scoped and read back from `test/issue-70-phrases-compatibility-proof`.

### Checks failed

- None before CI.

### Current branch head

- Resolve from the live branch ref after this progress write.

### Next action

- Record execution evidence, compare the branch to the exact base, verify `main` did not move, open a Draft PR and run the complete required CI matrix. Do not begin runtime deletion until this proof slice is merged and exact-SHA validated.
