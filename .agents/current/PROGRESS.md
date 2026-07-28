# Current Task Progress

## 2026-07-28 21:20 Europe/Moscow

### Verified

- Live `main`: `162b93b7dbfa53bcfe25e6ce055b0eb0797043d7`.
- No open pull request existed before branch creation.
- Branch `refactor/issue-70-remove-phrases-compatibility` was created from the exact live `main` SHA and read back before writes.
- PR #277 and `frontend/docs/compatibility-cleanup.md` prove that guest and authenticated `/phrases` routes resolve to `LexigoPhrasesApp` before the compatibility fallback.
- The exact 3,106-line `LexigoPremiumApp` source was audited by range from the immutable base blob `1cf19cfb8928e71d51be503cb37fd7cd3e60e5d7`.

### Finding

The dead route family is bounded to Phrases catalog/detail state, derived values, URL synchronization, loaders/effects, reset writes, handlers, `renderPhrases`, route resource notice and route-only imports/helpers. `DEFAULT_PHRASE_CATALOG`, phrase source support, mixed lessons, `toLearningItem`, cloze review and answer suggestions remain live and must be preserved.

### Root cause

Canonical Phrases ownership was extracted to `LexigoPhrasesApp`, but the previous route-level implementation remained compiled inside the compatibility fallback. The GitHub connector supports only complete file replacement, not line patches, so a minimal temporary branch workflow is required to apply exact anchored deletions safely to the large source file.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`

### Checks passed

- Mandatory Agent Harness documents and specialized rules read from current `main`.
- Exact live GitHub, PR, CI and deployment state verified.
- Reconciliation PR #278 completed and squash-merged before this slice.
- Current branch readback succeeded.
- Route-only/shared-domain consumer audit completed for every declared deletion family.

### Checks failed

- None.

### Current branch head

Resolve from live branch ref after this write.

### Next action

Create and run the temporary exact-anchor patch workflow, read back the resulting source/test diff, remove the workflow, update documentation and run authoritative PR CI on a developer-authored final head.
