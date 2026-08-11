# Current Task Execution

## Task

- Issue: #72 `[Medium][UX] Унифицировать гостевой доступ к словам и фразам`
- Branch: `feat/issue-72-guest-catalog-parity`
- Base SHA: `e6b2d74891fb4e52f23152758812551361717857`
- Latest product/test SHA before Agent Docs: `f0bacc3a564afb418c25a877a503d6b7131d87c6`
- Head SHA: resolve from live branch ref after this Agent Docs write
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

Issue #72, Draft PR #476, live `main`, feature branch, CI workflow runs, changed files, backend/frontend/OpenAPI/runtime contracts.

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
- Performed read-back and generated-diff checks after writes, including large-file replacements.

Commands or procedures:

- GitHub connector file/commit/PR/Issue reads.
- GitHub branch-scoped file create/update operations with expected blob SHA where applicable.
- GitHub Actions commit-run/job inspection.
- Generated commit patch inspection before accepting large-file writes.
- No direct write to `main` and no bypass of CI/review lifecycle.

Artifacts produced:

- Public content-only Words API projection and route boundary.
- Guest Dictionary and Word Detail parity with authenticated personalized behavior preserved.
- Stable Phrases guest catalog loading.
- Exact canonical auth-return handoff.
- Public OpenAPI paths/schemas plus full-YAML/leakage contract.
- Blocking browser acceptance `frontend/e2e/guest-catalog-parity.spec.ts`.
- Focused source/backend contracts and updated Agent Harness evidence.

Result:

Implementation is coherent on the feature branch. Intermediate CI demonstrated green frontend core and backend unit/race/security/integration after the runtime fixes. Final immutable-head validation remains required because subsequent browser/OpenAPI/Agent Docs commits advanced the head.

Failures:

Historical CI #3255 failed frontend unit/source contracts. One failure was caused by missing runtime rendering of shared `CatalogKindNavigation`; one contract was JSX-format fragile; Word Detail still asserted the pre-guest auth guard. Additional manual inspection found a Phrases referential-identity effect loop, missing auth-success `return_to` consumption, and absent public OpenAPI documentation.

Root cause:

The guest parity slice crossed backend public projection, route islands, compatibility auth handoff and source-contract ownership. Earlier partial implementation changed behavior without completing every downstream contract/consumer, and Phrases used an unstable derived object as an effect dependency.

Fallback:

If final validation finds a product regression that cannot be corrected within Issue #72 invariants, revert the Issue #72 branch/PR. No data migration or scheduler-state repair is required because authenticated `user_words` ownership and review algorithms were not changed.

Limitations:

- Final immutable-head CI is still pending after the Agent Docs commits.
- PR review/thread audit, Ready transition, merge, exact-SHA `main` CI and Stage/public acceptance have not yet been completed.
- `.agents/PROJECT_STATE.md` intentionally remains unchanged until delivered product evidence exists.

Reusable lesson:

When guest/auth parity introduces a public projection, lock the boundary at three levels simultaneously: route middleware ownership, repository/query ownership, and closed OpenAPI response schemas. For auth return, implementing a safe producer is insufficient; the successful auth owner must explicitly consume the validated canonical target. React effect dependencies derived from navigation should be memoized when object identity participates in load effects.

### gh-fix-ci

Purpose:

Classify and diagnose GitHub Actions failures before modifying code or re-running jobs.

Instruction source:

`skills://plugins/github/gh-fix-ci/skill.md`.

Version or verification date:

2026-08-11.

Inputs:

PR #476 CI #3255 and subsequent CI runs/jobs.

Files inspected:

Frontend source-contract tests, their runtime owners, workflow jobs/artifacts and the relevant changed files.

Actions performed:

- Confirmed backend jobs were green while frontend unit/source contracts failed.
- Mapped each failing assertion to the runtime owner instead of deleting/weakening the test.
- Fixed the missing shared navigation runtime owner and updated stale/format-fragile assertions.
- Re-ran validation through new immutable-head commits rather than re-running a stale head.

Commands or procedures:

GitHub Actions run/job/artifact inspection and commit-associated workflow polling.

Artifacts produced:

Corrected runtime/source contracts and subsequent green frontend core on intermediate CI #3280.

Result:

The original frontend unit blocker was removed without weakening the intended ownership contract.

Failures:

No unresolved failure from CI #3255 remains.

Root cause:

Mixed stale source assertions plus one genuine omitted runtime owner.

Fallback:

Not required; corrective commits were branch-scoped and validated by later CI.

Limitations:

Final CI must be evaluated on the final Agent-Docs-inclusive head, not on intermediate run #3280/#3283.

Reusable lesson:

Treat source-contract CI failures as ownership evidence: first determine whether the implementation or the assertion is stale, then preserve the semantic owner and make the assertion formatting-independent where possible.
