# Current Task Execution

## Task

- Issue: #489 (`#25` Phase 3)
- Branch: `feat/issue-489-custom-glossary-import-export-v2`
- Base SHA: `981c3d78b1907480d763fbad23d9f1608b9353e9`
- Head SHA: resolve from live branch ref after this commit
- PR: #492

## Skills used

### GitHub repository workflow

Purpose:

- deliver Phase 3 custom glossary portability under the LexiGo production-safe Agent Harness;
- inspect live owners, implement one atomic backend/API slice, prove it in real CI and preserve reproducible delivery evidence.

Instruction source:

- installed GitHub plugin skill `skills://plugins/github/github/skill.md`;
- repository `AGENTS.md`, `.agents/AGENTS.md`, `.agents/AGENTS.base.md`, `.agents/SKILLS.md`, `.agents/current/**` and `docs/agent-harness.md`.

Version or verification date:

- live repository/harness verified 2026-08-13.

Inputs:

- parent Issue #25;
- child Issue #489;
- delivered Phase 1 listening contract (#481) and Phase 2 private custom-word ownership contract (#485 / #486);
- current `words`, `user_words`, server, OpenAPI and integration-test owners.

Files inspected:

- repository Agent Harness and live GitHub `main`/PR/CI state;
- `backend/internal/words/custom_word.go`, `custom_repository.go`, `custom_http.go`, `model.go`, `repository.go` and existing OpenAPI contract tests;
- `backend/internal/server/server.go`;
- migration `000022_custom_words.up.sql`;
- `backend/integration/custom_words_test.go`, shared request helpers and `httpx.DecodeJSONLimit`;
- complete `api/openapi.yaml` and `docs/architecture.md` through GitHub reads/resource inspection.

Actions performed:

- created Issue #489 with explicit version, item/body bounds, ownership, atomic rollback and round-trip acceptance;
- reconciled stale Phase 2 Agent Harness state before product ownership;
- added version-1 glossary envelope/result contracts and complete-payload normalization;
- refactored single custom-word persistence through shared `insertCustomWordTx` without changing existing CRUD semantics;
- added deterministic owner-only portable export and one-transaction all-or-nothing import;
- registered authenticated `/api/v1/words/custom/export` and `/api/v1/words/custom/import` routes;
- added `Cache-Control: no-store` plus stable validation/conflict HTTP errors;
- added unit tests and real PostgreSQL/Redis integration covering owner isolation, deterministic content-only export, exact scheduler enrollment, cross-account equivalent content, intra-payload duplicates, existing-owner rollback, export-delete-import fresh scheduler state, version bound, 100-item ceiling and the 256 KiB HTTP body ceiling;
- updated OpenAPI to 0.17.0 with two portability endpoints and three closed schemas and added a complete-YAML structural contract test;
- updated only the existing `Custom vocabulary ownership` architecture section;
- confirmed final changed-path inventory has zero `.github/workflows/**` diff.

Commands or procedures:

- GitHub connector reads/writes and Git Data blob/tree/commit/ref operations;
- GitHub Actions is authoritative because the local runtime cannot resolve github.com for a usable repository checkout;
- diagnostic CI #3389 / run `31707145244` proved formatting/static/unit/race/security/integration and selected frontend/browser gates on the implementation foundation;
- CI #3394 / run `31709294294` proved the later OpenAPI structural contract and core product gates on developer head `82fed087ae6eaedd9be2e03d8572989cc2e40728`;
- CI #3398 / run `31710244884` is the first diagnostic run containing the explicit 256 KiB HTTP body regression;
- the head produced by this file update is the intended final developer-authored candidate and must pass a fresh complete immutable-head CI before merge.

Temporary exact-rewrite procedure:

- `api/openapi.yaml` is large and the connected Contents API has no safe server-side patch operation;
- after explicit harness authorization, one path-guarded temporary workflow performed exact anchored OpenAPI replacements;
- first helper run `31708416538` failed before job execution because the workflow heredoc indentation was invalid and wrote nothing;
- corrected run `31708701593` succeeded; bot commit `35b45e88642435d5a4eb63c97d7d1fa5aa80d120` changed only `api/openapi.yaml`;
- the unified OpenAPI patch was manually audited before acceptance;
- developer commit `82fed087ae6eaedd9be2e03d8572989cc2e40728` removed the helper and added architecture/structural-contract changes; final PR inventory has no workflow change.

Artifacts produced:

- Issue #489 and Draft PR #492;
- versioned custom glossary domain/repository/HTTP implementation;
- real PostgreSQL/Redis integration regression including body-size and item-count bounds;
- OpenAPI 0.17.0 glossary contract and structural parser test;
- updated architecture ownership contract;
- current Agent Harness evidence.

Result:

- Phase 3 implementation and acceptance coverage are feature-complete.
- No further runtime/API/test/design changes are planned unless final immutable-head CI exposes a real defect.
- Delivery remains incomplete until final CI, review/thread/diff audit, guarded squash merge, exact-main CI and exact-SHA Stage/public validation pass.

Failures and recovery:

- GitHub safety proxy intermittently rejected first mutation attempts; every retry followed live ref/head readback.
- After two blocked fast-forwards on the original feature branch, work continued on `feat/issue-489-custom-glossary-import-export-v2` created from the already-created immutable commit rather than repeating the same rejected write.
- Temporary workflow run #1 failed because of workflow YAML indentation; the corrected run succeeded.
- The first body-limit regression draft used escaped quotes in a Go raw string. This was caught during self-review before final acceptance; the test now normalizes that raw literal to a valid JSON document before adding whitespace, so the observed 400 can prove only the HTTP body bound and it verifies zero persistence side effect.

Root cause:

- Phase 2 intentionally excluded glossary import/export, leaving parent #25 portability acceptance incomplete.
- Large-file connector limitations required the temporary exact-rewrite fallback for OpenAPI.

Fallback:

- Git Data blob/tree/commit/ref operations were used when normal writes were rejected safely.
- The 180-line architecture source was read completely and updated directly, avoiding a second temporary workflow.

Limitations:

- no custom phrases;
- no frontend/Figma glossary UI;
- no microphone/pronunciation/listening-first UI;
- no scheduler algorithm or schema migration changes.

Reusable lesson:

- portable user content must separate content identity from persistence/scheduler identity: export content only and re-import through the canonical owner-scoped enrollment path to create fresh scheduler state.
- documented resource ceilings are not fully accepted until both semantic-count and raw-body limits have executable tests.
- temporary large-file rewrite automation is acceptable only when exact-anchor guarded, output diff reviewed, helper removed and the final candidate head is developer-authored with zero workflow diff.
