# Current Task Progress

## 2026-07-28 21:51 Europe/Moscow

### Verified

- Live `main`: `162b93b7dbfa53bcfe25e6ce055b0eb0797043d7`.
- Branch `refactor/issue-70-remove-phrases-compatibility` was created from the exact live `main` SHA and read back before writes.
- Draft PR #280 is the active delivery PR from the exact branch to `main`; closed PR #279 is an unmerged technical predecessor only.
- PR #277 and `frontend/docs/compatibility-cleanup.md` prove that guest and authenticated `/phrases` routes resolve to `LexigoPhrasesApp` before the compatibility fallback.
- The exact 3,106-line `LexigoPremiumApp` source was audited by range from immutable base blob `1cf19cfb8928e71d51be503cb37fd7cd3e60e5d7`.
- Temporary patcher v1 run `30385938542` failed closed before commit because literal YAML indentation made one exact multiline anchor non-portable; runtime/test blobs remained unchanged.
- Re-creating the deleted workflow at its original path did not reactivate the deleted Actions registration.
- The stale workflow path was deleted and a uniquely named exact-branch v2 workflow was registered at `.github/workflows/issue-70-phrases-runtime-patch-v2.yml` before this separate developer-authored push.
- The unique v2 definition is push-only, contents-write only, excludes bot events and retains strict one-match, prohibited/required marker and exact two-path guards.

### Finding

The dead route family is bounded to Phrases catalog/detail state, derived values, URL synchronization, API loaders/effects, reset writes, handlers, `renderPhrases`, route resource notice and route-only imports/helpers. `DEFAULT_PHRASE_CATALOG`, phrase source support, mixed lessons, `toLearningItem`, cloze review and answer suggestions remain live and must be preserved.

### Root cause

Canonical Phrases ownership was extracted to `LexigoPhrasesApp`, but the previous route-level implementation remained compiled inside the compatibility fallback. The GitHub connector supports only complete file replacement, not line patches, so a minimal temporary exact-branch workflow is required to apply anchored deletions safely to the large source file.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `.github/workflows/issue-70-phrases-runtime-patch-v2.yml` — temporary

### Checks passed

- Mandatory Agent Harness documents and specialized rules read from current `main`.
- Exact live GitHub, PR, CI and deployment state verified.
- Reconciliation PR #278 completed and squash-merged before this slice.
- Current branch and every written file read back successfully.
- Route-only/shared-domain consumer audit completed for every declared deletion family.
- Failed v1 produced no runtime/test commit and was removed before retry.
- Technical PR #279 was closed without merge; active work continues in Draft PR #280.
- The original temporary workflow path is absent; unique v2 was created only after the task allow-list was updated.

### Checks failed

- Temporary patcher v1 run `30385938542`: fail-closed anchor mismatch; no repository runtime changes.
- Re-created workflow at the deleted registration path produced no run; no runtime changes resulted.

### Current branch head

Resolve from live branch ref after this developer-authored push trigger.

### Next action

Verify the uniquely registered v2 patch commit and exact source/test readback, remove the temporary workflow, update delivery documentation and run authoritative PR CI on a developer-authored final head.
