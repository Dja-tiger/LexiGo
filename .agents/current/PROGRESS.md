# Current Task Progress

## 2026-08-13 17:55 +03:00

### Verified

- Live base `main` for this slice was verified as `981c3d78b1907480d763fbad23d9f1608b9353e9` before branch creation.
- Issue #493 and branch `feat/issue-493-custom-glossary-import-export` were created from that exact base.
- Draft PR #495 targets `main` and contains only the approved backend/API/harness paths.
- Phase 2 owner model remains authoritative: private content is `words.owner_user_id = current user`, `kind = 'word'`, `source = 'user-custom-v1'`; scheduling remains in existing `user_words`.
- OpenAPI full-file replacement was audited through the PR patch: `api/openapi.yaml` changes are limited to version `0.17.0`, two glossary paths, three glossary schemas and stable error fields `schemaVersion`/`items` (`+116/-2`).
- Existing `openapi_contract_test.go` performs full YAML parsing with `yaml.Unmarshal`; an additional glossary semantic source-contract was added.

### Finding

- The portable glossary must not carry scheduler/history fields. Import is capped at 100 items and 256 KiB, while export is not schema-capped to 100 because an account may already own more custom words through repeated single-item creation.
- Returning dynamic validation fields such as `items[1].lemma` would violate the existing stable `Error.field` enum used by typed clients. Runtime now returns stable field `items` and includes the indexed nested path in the human-readable message.
- Initial PR CI run #3402 reached backend formatting and found only `internal/words/custom_glossary.go` unformatted before static/unit checks. Integration on that obsolete head was cancelled after a newer commit superseded it.

### Root cause

- Go source written through the GitHub Contents API does not pass through `gofmt`; one composite literal alignment differed from canonical formatting.
- The first validation implementation optimized field precision without auditing the downstream OpenAPI stable-field contract.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md` (pending this checkpoint)
- `api/openapi.yaml`
- `backend/internal/server/server.go`
- `backend/internal/words/custom_glossary.go`
- `backend/internal/words/custom_glossary_http.go`
- `backend/internal/words/custom_glossary_openapi_contract_test.go`
- `backend/internal/words/custom_glossary_test.go`
- `backend/internal/words/custom_repository.go`
- `backend/integration/custom_glossary_test.go`

### Checks passed

- Branch/base comparison: branch was ahead-only with merge base equal to verified `main`.
- OpenAPI PR patch audit: no broad replacement drift; only intended additions and two one-line replacements.
- CI #3402: change-scope classification passed; frontend core quality passed before the head was superseded.
- Existing OpenAPI structural parser remains in the unit suite.

### Checks failed

- CI #3402 backend formatting: `internal/words/custom_glossary.go`; corrected by applying exact local `gofmt` output and reading the branch blob back.
- Two earlier connector write attempts were safety-layer blocked without repository mutation; work continued only through successful, read-back-verified writes.

### Current branch head

Resolve from live PR/branch after this harness update. The next immutable-head CI must use the final SHA after all harness changes.

### Next action

- Finish `EXECUTION.md`.
- Inspect the newest PR #495 CI on the final harness head; fix any static/unit/integration defect without weakening contracts.
- Verify review threads and final diff, mark Ready only after full required CI succeeds.
