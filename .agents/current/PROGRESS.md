# Current Task Progress

## 2026-07-28 21:27 Europe/Moscow

### Verified

- Live `main`: `162b93b7dbfa53bcfe25e6ce055b0eb0797043d7`.
- No open pull request existed before branch creation.
- Branch `refactor/issue-70-remove-phrases-compatibility` was created from the exact live `main` SHA and read back before writes.
- PR #277 and `frontend/docs/compatibility-cleanup.md` prove that guest and authenticated `/phrases` routes resolve to `LexigoPhrasesApp` before the compatibility fallback.
- The exact 3,106-line `LexigoPremiumApp` source was audited by range from the immutable base blob `1cf19cfb8928e71d51be503cb37fd7cd3e60e5d7`.
- Temporary workflow blob `bc90a875f66293e1434e284a0a76bca63cfe06bf` was read back from the branch; it is exact-branch scoped, contents-write only, idempotent for bot pushes and path-guards the patch to the two declared frontend files.

### Finding

The dead route family is bounded to Phrases catalog/detail state, derived values, URL synchronization, API loaders/effects, reset writes, handlers, `renderPhrases`, route resource notice and route-only imports/helpers. `DEFAULT_PHRASE_CATALOG`, phrase source support, mixed lessons, `toLearningItem`, cloze review and answer suggestions remain live and must be preserved.

### Root cause

Canonical Phrases ownership was extracted to `LexigoPhrasesApp`, but the previous route-level implementation remained compiled inside the compatibility fallback. The GitHub connector supports only complete file replacement, not line patches, so a minimal temporary branch workflow is required to apply exact anchored deletions safely to the large source file.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `.github/workflows/issue-70-phrases-runtime-patch.yml` — temporary

### Checks passed

- Mandatory Agent Harness documents and specialized rules read from current `main`.
- Exact live GitHub, PR, CI and deployment state verified.
- Reconciliation PR #278 completed and squash-merged before this slice.
- Current branch and every written file read back successfully.
- Route-only/shared-domain consumer audit completed for every declared deletion family.
- Temporary workflow uses exact anchor counts, prohibited/required marker checks, `git diff --check` and an exact two-path guard before commit.

### Checks failed

- None.

### Current branch head

Resolve from live branch ref after this developer-authored trigger write.

### Next action

Verify the patch commit and exact source/test readback, remove the temporary workflow, update delivery documentation and run authoritative PR CI on a developer-authored final head.
