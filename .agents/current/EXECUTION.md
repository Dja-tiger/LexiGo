# Current Task Execution

## Task

- Issue: #72 `[Medium][UX] Унифицировать гостевой доступ к словам и фразам`
- Branch: `feat/issue-72-guest-catalog-parity`
- Base SHA: `e6b2d74891fb4e52f23152758812551361717857`
- Latest smoke implementation SHA before final Agent Docs write: `7252096289ef6917d9f14f74817c987d2c15a0c9`
- Head SHA: resolve from live branch ref after this final Agent Docs write
- PR: #476 `feat(catalog): unify guest words and phrases access` (Draft until final immutable-head gates/review audit are clean)

## Skills used

### github

Purpose:

Inspect live repository/PR/Issue state, read canonical owners and harness rules, make branch-scoped commits, verify generated diffs/read-back, and poll GitHub Actions without writing to `main`.

Instruction source:

`skills://plugins/github/github/skill.md` plus repository `AGENTS.md`, `.agents/AGENTS.md`, `.agents/AGENTS.base.md`, `.agents/SKILLS.md`, `.agents/PROJECT_STATE.md`, `.agents/current/TASK.md`, and `docs/agent-harness.md`.

Version or verification date:

2026-08-11.

Inputs:

Issue #72, Draft PR #476, live `main`, feature branch, CI workflow runs, changed files, backend/frontend/OpenAPI/runtime/smoke contracts.

Files inspected:

- Repository/agent owners listed above.
- `backend/internal/server/server.go`.
- `backend/internal/words/http.go`, `repository.go`, model/tests/integration contracts.
- `api/openapi.yaml`.
- `frontend/components/dictionary-catalog.tsx` and shared catalog navigation.
- `frontend/components/lexigo-dictionary-app.tsx`.
- `frontend/components/word-detail-*`.
- `frontend/components/lexigo-phrases-app.tsx`, `phrases-catalog.tsx`, phrase detail presentation.
- `frontend/components/lexigo-premium-app.tsx`.
- `frontend/lib/auth-return.ts`, navigation/phrase helpers.
- focused frontend source contracts and Playwright suites.
- `frontend/scripts/dictionary-navigation-smoke.sh`.
- `frontend/package.json`, `backend/go.mod`, `backend/go.sum`.

Actions performed:

- Verified `main` stayed at the expected base before branch writes.
- Classified initial CI #3255 failures into real runtime owner regression vs stale/format-fragile source contracts.
- Restored the shared Dictionary Words/Phrases navigation owner and made its source contract whitespace-safe.
- Updated Word Detail ownership contract for intended guest content-only direct detail while retaining personalized auth-only state.
- Memoized Phrases filter derivation to prevent catalog-load effect loops.
- Added exact post-auth `return_to` consumption in `LexigoPremiumApp`, using the existing safe internal target parser and canonical navigation serializer.
- Added a focused auth-return source contract.
- Added browser acceptance for guest Word Detail -> login -> exact return and guest Phrases -> registration -> exact return on desktop Chromium and iOS WebKit.
- Registered the acceptance suite in blocking UI CI.
- Documented public word list/detail endpoints and content-only response schemas in OpenAPI.
- Added full-document YAML parsing to the backend OpenAPI test and explicit negative assertions for public auth/status/SRS leakage.
- Added `gopkg.in/yaml.v3` as the focused parser dependency.
- Captured the repository-standard `go mod tidy` diff emitted by CI #3286 and committed the exact required indirect module/checksum graph to `backend/go.mod` and `backend/go.sum`.
- Audited PR #476 review state: mergeable, no review threads, no submitted reviews; reconciled PR body with actual completed scope/evidence.
- Diagnosed CI #3290 `Frontend E2E (Dictionary smoke)` from its job log. The product correctly rendered the new guest Dictionary, while `dictionary-navigation-smoke.sh` still required the historical `Словарь доступен после входа` auth gate.
- Updated only the canonical Dictionary smoke owner so the unauthenticated shell smoke now requires `data-route-client-island="dictionary"`, the `Словарь` catalog heading, explicit demo/non-persistence guidance, and absence of the historical auth gate.
- Expanded the Issue #72 task allowlist narrowly for that required smoke owner before the script write.
- Performed read-back and generated-diff checks after writes, including large-file replacements and the smoke correction.

Commands or procedures:

- GitHub connector file/commit/PR/Issue reads.
- GitHub branch-scoped file create/update operations with expected blob SHA where applicable.
- GitHub Actions commit-run/job/log inspection.
- Generated commit patch inspection before accepting large-file writes.
- `go mod verify` / `go mod tidy` output was taken from the repository CI runner rather than reconstructed heuristically; the emitted manifest diff became the committed source of truth.
- Dictionary smoke failure was classified against Issue #72 acceptance before modification; no runtime guest behavior was reverted and no smoke bypass/skip was introduced.
- No direct write to `main` and no bypass of CI/review lifecycle.

Artifacts produced:

- Public content-only Words API projection and route boundary.
- Guest Dictionary and Word Detail parity with authenticated personalized behavior preserved.
- Stable Phrases guest catalog loading.
- Exact canonical auth-return handoff.
- Public OpenAPI paths/schemas plus full-YAML/leakage contract.
- Blocking browser acceptance `frontend/e2e/guest-catalog-parity.spec.ts`.
- Canonical unauthenticated Dictionary navigation smoke aligned with guest read-only/demo semantics.
- Focused source/backend contracts, tidy dependency manifests, and updated Agent Harness evidence.

Result:

Implementation is coherent on the feature branch. Intermediate CI demonstrated green frontend core and backend unit/race/security/integration after runtime fixes. CI #3286 isolated and resolved the YAML-parser dependency-manifest gate. CI #3290 then passed frontend core and full backend unit/security including dependency verification, and isolated one stale Dictionary smoke assertion. The smoke owner is now corrected without changing runtime behavior. A fresh immutable-head validation is required on the SHA produced by this final Agent Docs write.

Failures:

- Historical CI #3255 failed frontend unit/source contracts. One failure was caused by missing runtime rendering of shared `CatalogKindNavigation`; one contract was JSX-format fragile; Word Detail still asserted the pre-guest auth guard.
- Manual inspection found a Phrases referential-identity effect loop, missing auth-success `return_to` consumption, and absent public OpenAPI documentation.
- CI #3286 / run `31528279920` failed only `Backend unit and security -> Verify dependency files`: `go mod tidy` added `github.com/kr/text`, `github.com/rogpeppe/go-internal` and transitive checksums required by yaml.v3 test parsing. Commits `d6612f3c978f10be2a394d9acc564e5a7818f8d4` and `90a72b873086ab09895527fb67019cd95b325889` apply that exact diff.
- CI #3290 / run `31528597976` on `67a9124df6382a5813fc6655581daad9768a978f` failed `Frontend E2E (Dictionary smoke)` because its shell smoke still asserted `aria-label="Словарь доступен после входа"`. Issue #72 intentionally removed that route-level auth gate, so the smoke was stale. Commit `7252096289ef6917d9f14f74817c987d2c15a0c9` replaces only that assertion block with semantic guest-Dictionary checks and a negative historical-gate assertion.

Root cause:

The guest parity slice crossed backend public projection, route islands, compatibility auth handoff, source-contract ownership, OpenAPI and standalone navigation smoke ownership. Earlier partial implementation changed behavior without completing every downstream contract/consumer. Phrases used an unstable derived object as an effect dependency, the first YAML-parser dependency commit omitted the pinned-toolchain tidy graph, and the Dictionary smoke encoded the pre-Issue-72 authorization model rather than the canonical route contract.

Fallback:

If final validation finds a product regression that cannot be corrected within Issue #72 invariants, revert the Issue #72 branch/PR. No data migration or scheduler-state repair is required because authenticated `user_words` ownership and review algorithms were not changed.

Limitations:

- Final immutable-head CI is still pending on the head created by this write.
- Ready transition, merge, exact-SHA `main` CI and Stage/public acceptance have not yet been completed.
- `.agents/PROJECT_STATE.md` intentionally remains unchanged until delivered product evidence exists.

Reusable lesson:

When guest/auth parity introduces a public projection, lock the boundary at route middleware, repository/query ownership, closed OpenAPI schemas, browser acceptance and any standalone shell smoke that encodes authorization expectations. A safe auth-return producer is insufficient unless the successful auth owner consumes the validated canonical target. React effect dependencies derived from navigation need stable identity. If a new test parser changes Go module requirements, treat `go mod tidy` output from the pinned CI toolchain as an immutable dependency-file contract. When product access semantics intentionally change, update stale smoke assertions to prove the new behavior rather than preserving the old gate or skipping the route.

### gh-fix-ci

Purpose:

Classify and diagnose GitHub Actions failures before modifying code or re-running jobs.

Instruction source:

`skills://plugins/github/gh-fix-ci/skill.md`.

Version or verification date:

2026-08-11.

Inputs:

PR #476 CI #3255, CI #3286, CI #3290 and subsequent commit-associated workflow jobs/logs.

Files inspected:

Frontend source-contract tests and runtime owners; backend module manifests; `frontend/scripts/dictionary-navigation-smoke.sh`; GitHub Actions workflow jobs/logs; relevant changed files.

Actions performed:

- Confirmed backend jobs were green while initial frontend unit/source contracts failed.
- Mapped each frontend failure to the runtime owner instead of deleting/weakening tests.
- Fixed missing shared navigation rendering and stale/format-fragile assertions.
- For CI #3286, read the exact `Verify dependency files` job log and classified the failure as deterministic `go mod tidy` metadata drift rather than runtime/test failure.
- Applied the exact indirect `go.mod` additions and `go.sum` additions shown by the runner.
- For CI #3290, read the Dictionary smoke job log and compared the failing expected auth-gate marker with the Issue #72 guest-browse acceptance and current Dictionary runtime.
- Replaced the stale smoke expectation with positive canonical guest-island/catalog/demo assertions plus an explicit negative check for the retired auth gate; no skip, retry inflation or product rollback was added.
- Advanced to new heads rather than re-running stale failed heads.

Commands or procedures:

GitHub Actions run/job/log inspection and commit-associated workflow polling.

Artifacts produced:

Corrected runtime/source contracts, tidy-clean Go dependency manifests, and a guest-aware Dictionary navigation smoke.

Result:

The original frontend blocker, deterministic dependency-manifest blocker and stale Dictionary smoke blocker are all addressed without weakening product acceptance. Final head still requires a complete new CI run.

Failures:

No unresolved failure from CI #3255, #3286 or the classified #3290 smoke contract is known; final immutable-head validation remains the source of truth.

Root cause:

Mixed stale source assertions plus one genuine omitted runtime owner, incomplete module metadata for a new test-only YAML parser, and a standalone smoke that still encoded the historical authentication model.

Fallback:

Not required; corrective commits are branch-scoped and final CI will validate them together.

Limitations:

Final CI must be evaluated on the final Agent-Docs-inclusive head, not on intermediate runs #3280/#3283/#3286/#3290.

Reusable lesson:

Treat source-contract and smoke CI failures as ownership evidence. First compare the assertion to the current issue acceptance and canonical runtime; fix the semantic owner when runtime is wrong, or update the stale acceptance owner when product behavior intentionally changed. Never suppress the gate merely to make CI green.
