# Current Task Progress

## 2026-08-04 16:26 Europe/Moscow

### Verified

- Live `main` before branch creation: `1a2eec84d5886b6e9ab15755feacbcb639440c4e`.
- Latest deployed product SHA: `45ba441da5f8faf1248389311461cf2adf787786`; stage run `30906428881` passed deploy, public smoke and 12/12 public browser checks.
- No active product PR intersects Issue #75; open PRs #304–#306 are unrelated Dependabot work.
- Issue #78 implementation is complete but its remaining acceptance gate is a manual `Deploy Production` workflow dispatch unavailable through the connected tools; no repository workaround was introduced.
- Issue #75 remains open with seven unchecked acceptance criteria.
- Phrases runtime already owns search controls, accessible topic filters, URL state, result count, clear/empty states, detail navigation, scroll restoration and React/data-layer sorting.
- Existing app-router browser evidence proves detail Back restores filters, page and scroll.
- Existing UI ownership evidence proves one React sorting toolbar.
- Existing authenticated backend search covered lemma, translation, topic and aliases but not `examples`.
- Guest Phrases search already covered prompt, answer, topic and examples.
- `phrases-production.spec.ts` existed but was not registered in the authoritative `test:e2e:ui` command.

### Finding

The remaining product defect was guest/authenticated search-field divergence: a phrase found by example text while signed out disappeared after authentication. Acceptance evidence was also fragmented and the focused production Phrases contract was not part of authoritative UI CI.

### Root cause

`backend/internal/words/repository.go` did not expand the JSONB `examples` array in its case-insensitive search predicate. Existing browser fixtures forwarded query/topic but returned static endpoint-wide data, so they could not prove filtered outcomes.

### Changed files

- `backend/internal/words/repository.go`
- `backend/integration/catalog_pagination_test.go`
- `frontend/e2e/phrases-search-acceptance.spec.ts`
- `frontend/components/phrases-search-acceptance-source.test.ts`
- `frontend/package.json`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Checks passed

- Mandatory Agent Harness and specialized rules read from exact live `main` before writes.
- Current main/open PR/Issue/stage state verified.
- Seven-item Issue #75 acceptance matrix mapped to current runtime, source and browser owners.
- Branch `agent/issue-75-search-parity` created from exact base and remains `behind_by=0`.
- PostgreSQL search predicate now expands `examples` inside all existing user/kind/source/topic/status bounds.
- Real integration fixture now stores example text and asserts English lemma, Russian translation, alias and example queries.
- Focused browser fixture applies request-scoped topic/query/sort/page semantics rather than returning static data.
- Browser journey covers Russian search, English example search, query+topic empty result, selected chip/radio state, Back/Forward, reset, result count, detail return and scroll restoration in desktop Chromium/iOS WebKit.
- Source contract maps all seven acceptance owners and requires the focused spec exactly once in `test:e2e:ui`.
- All functional writes were read back from the isolated branch.
- Diff audit contains only the eight allowed files; no frontend runtime, CSS, snapshot, budget, schema, workflow, dependency or lockfile changed.

### Checks failed

- No CI result yet.

### Current branch head

Resolve from live branch ref; latest known commit: `0c94711df29f85eec02d497d89332bb84673613b`.

### Next action

Open a Draft PR, treat only CI on its newest immutable head as authoritative, and fix any real compile/integration/browser failure without weakening the acceptance contract.
