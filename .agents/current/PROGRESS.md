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
- Existing authenticated backend search covers lemma, translation, topic and aliases but not `examples`.
- Guest Phrases search already covers prompt, answer, topic and examples.
- `phrases-production.spec.ts` exists but is not registered in the authoritative `test:e2e:ui` command.

### Finding

The remaining product defect is guest/authenticated search-field divergence: a phrase found by example text while signed out disappears after authentication. Acceptance evidence is also fragmented and the focused production Phrases spec is not part of authoritative UI CI.

### Root cause

`backend/internal/words/repository.go` does not expand the JSONB `examples` array in its case-insensitive search predicate. Browser fixtures forward query/topic but do not filter responses, so they cannot prove the resulting authenticated behavior.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`

### Checks passed

- Mandatory Agent Harness and specialized rules read from exact live `main` before writes.
- Current main/open PR/Issue/stage state verified.
- Seven-item Issue #75 acceptance matrix mapped to current runtime, source and browser owners.
- Branch `agent/issue-75-search-parity` created from exact base.

### Checks failed

- No implementation checks run yet.

### Current branch head

Resolve from live branch ref; first task-record commit: `f450a98b363b23771946a0af1ea1189a557df9fe`.

### Next action

Add the bounded PostgreSQL example predicate, real integration assertions, focused browser/source acceptance evidence and authoritative UI registration without changing presentation.
