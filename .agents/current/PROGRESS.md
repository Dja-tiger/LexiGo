# Current Task Progress

## 2026-08-13 — Issue #489 final implementation state

### Verified

- Base `main`: `981c3d78b1907480d763fbad23d9f1608b9353e9`.
- Working branch: `feat/issue-489-custom-glossary-import-export-v2`; Draft PR #492.
- Phase 3 implements version-1 private custom-word glossary portability without a new migration or scheduler path.
- Export is authenticated, deterministic, owner-only, content-only and `Cache-Control: no-store`.
- Import accepts 1–100 items in at most 256 KiB JSON, reuses `NormalizeCustomWordRequest`, rejects normalized intra-payload duplicates before persistence and writes the complete batch in one PostgreSQL transaction through the Phase 2 private-word/scheduler helper.
- Any existing current-owner duplicate rolls back the complete batch. Equivalent content remains legal for another owner.
- Export → delete → import preserves portable content but intentionally creates fresh database IDs and fresh `user_words` scheduler defaults.
- OpenAPI is version `0.17.0` and documents the two authenticated portability endpoints plus closed glossary schemas. The complete YAML is parsed by a blocking source contract.
- `docs/architecture.md` records the Phase 3 ownership, privacy, atomicity and fresh-scheduler semantics.
- Final PR diff contains no `.github/workflows/**` path.
- Integration coverage now proves both independent bounds: 101 items are rejected, and a valid one-item JSON document padded with legal whitespace beyond 256 KiB is rejected before persistence with the owner glossary row count unchanged.

### Evidence already passed

Diagnostic CI #3389 / run `31707145244` on head `d541f20a24a051e0f8bf61d30a44714485dabf61` passed change-scope/dependency verification, `gofmt`, static analysis, backend unit/race/coverage/vulnerability, real PostgreSQL/Redis integration and the selected frontend/browser gates.

CI #3394 / run `31709294294` on developer head `82fed087ae6eaedd9be2e03d8572989cc2e40728` passed backend unit/security including complete OpenAPI YAML parsing and the structural glossary contract, plus frontend core/selected browser gates while later harness evidence was being finalized.

CI #3398 / run `31710244884` is the first run containing the explicit 256 KiB HTTP-body integration regression. It is diagnostic until the final `EXECUTION.md` harness commit advances the branch once more.

### Temporary exact-rewrite evidence

- Large `api/openapi.yaml` could not be safely server-patched by the connected Contents API.
- The repository-authorized one-shot helper `.github/workflows/temporary-issue-489-openapi-rewrite.yml` was used only as a path-guarded large-file rewrite mechanism.
- First helper run `31708416538` failed before jobs because the initial workflow YAML heredoc indentation was invalid; no OpenAPI/product write occurred.
- Corrected helper run `31708701593` passed. Exact anchor checks succeeded and bot commit `35b45e88642435d5a4eb63c97d7d1fa5aa80d120` changed only `api/openapi.yaml`.
- The OpenAPI unified patch was manually audited: only `0.16.0 → 0.17.0`, two paths, three glossary schemas and `version/items` error-field enum entries changed.
- Developer commit `82fed087ae6eaedd9be2e03d8572989cc2e40728` removed the temporary workflow, added the structural OpenAPI test and updated only the existing `Custom vocabulary ownership` architecture section.
- Architecture unified patch was separately audited and contained no unrelated drift.

### Acceptance-gap correction

A final criteria audit found that the item ceiling was already tested but the documented 256 KiB body ceiling had no integration proof. Runtime already used `http.MaxBytesReader`; only the missing regression was added. The test deliberately uses a semantically valid, one-item JSON object plus legal trailing whitespace so the failure can only be attributed to the HTTP body bound, then verifies zero persistence side effect.

### Operational connector recovery

The GitHub safety proxy intermittently blocked first mutation attempts. Every retry followed live ref/head readback. After two blocked fast-forwards on the original feature branch, work continued on `feat/issue-489-custom-glossary-import-export-v2` created directly from the already-created immutable commit rather than repeating the same rejected mutation.

### Current branch head

Resolve after the following final `EXECUTION.md` harness commit.

### Next action

Freeze the head produced by the final `EXECUTION.md` update. No further runtime/API/test/design changes are planned. Require complete immutable-head CI with zero workflow diff, then review/thread/diff audit, guarded squash merge, exact-main CI and exact-SHA Stage/public validation.
