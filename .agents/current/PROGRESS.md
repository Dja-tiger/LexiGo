# Current Task Progress

## 2026-08-13 — Issue #489 execution

### Verified

- Live base `main`: `981c3d78b1907480d763fbad23d9f1608b9353e9`.
- Current working branch: `feat/issue-489-custom-glossary-import-export-v2`; Draft PR #492.
- #485 / PR #486 Phase 2 is fully delivered on product SHA `53e16a00e2bbe70921c1c5220923faee1f63bc37`; immutable-head CI #3382, exact-main CI #3383 and Stage #3225 are green.
- Post-merge harness reconciliation was squash-merged as `981c3d78b1907480d763fbad23d9f1608b9353e9`; exact-main Agent Docs CI #3387 / run `31705902635` is green.
- Phase 2 owns normalization, owner-scoped private uniqueness, one-word transactional scheduler enrollment and owner-only deletion.
- Phase 3 runtime now adds version-1 glossary envelopes, 1..100 import bound, 256 KiB JSON-body bound, pre-persistence field/intra-payload validation, owner-only deterministic export, one-transaction import and shared scheduler enrollment.
- Authenticated routes are registered before the dynamic custom-word delete route.
- Portable export is `Cache-Control: no-store` and carries only content fields.
- Real PostgreSQL integration covers empty export, owner isolation, deterministic export, content-only projection, two-item scheduler enrollment, export-delete-import with fresh IDs/state, cross-account equivalent content, intra-payload duplicates, existing-owner conflict rollback, version bound and 101-item rejection.

### Finding

The product behavior does not require a migration or scheduler change. The only remaining large contract owner is `api/openapi.yaml` plus architecture/harness reconciliation. The GitHub Contents connector has no server-side patch operation and returns the large OpenAPI file only through chunked resources; a manual full-file reconstruction would create unacceptable deletion/drift risk.

The repository harness explicitly permits an objectively necessary one-shot, path-guarded write workflow if it is deleted before final CI and the bot-authored head is not treated as final. That fallback is necessary here to perform exact string replacements inside the existing large OpenAPI source without reconstructing unrelated content.

### Root cause

Parent #25 lacked a portable glossary backup/restore contract. Connector limitations additionally make large-file exact replacement unsafe through the normal Contents API, requiring a temporary in-repository exact-rewrite helper for OpenAPI only.

### Changed files

Current product/harness diff includes `.agents/current/**`, `backend/internal/words/**`, `backend/internal/server/server.go` and `backend/integration/custom_glossary_test.go`.

Temporary allowed path to be added and later removed: `.github/workflows/temporary-issue-489-openapi-rewrite.yml`.

### Checks passed

Diagnostic CI #3389 / run `31707145244` on pre-privacy head `d541f20a24a051e0f8bf61d30a44714485dabf61` has already proved change-scope classification, dependency verification, `gofmt`, static analysis, backend unit/race/coverage/vulnerability gates, real PostgreSQL/Redis integration, frontend core, controlled service worker, performance budgets, content security, iOS PWA dictionary and Dictionary smoke.

This diagnostic run is not final acceptance because later privacy/OpenAPI/docs commits advance the branch.

### Checks failed

No product-contract failure has been observed. Operationally, the GitHub safety proxy repeatedly blocked first-attempt ref/commit mutations; every retry followed ref readback. After two blocked fast-forwards on the original feature branch, a new `-v2` branch was created from the already-created immutable commit rather than retrying the same write again.

### Current branch head

Latest applied head before this harness update: `ca0ac58397acdebd7a5fe458b8dc0fca98da92af`.

### Next action

Commit this harness update, add the temporary exact-rewrite workflow, let its push-triggered job patch only `api/openapi.yaml` and remove itself, audit the resulting OpenAPI unified diff, create a developer-authored follow-up head, add structural OpenAPI/source and architecture coverage, then run the full immutable-head CI.
