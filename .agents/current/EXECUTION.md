# Current Task Execution

## Task

- Issue: #72 `[Medium][UX] Унифицировать гостевой доступ к словам и фразам`
- Branch: `feat/issue-72-guest-catalog-parity`
- Base SHA: `e6b2d74891fb4e52f23152758812551361717857`
- Latest product/test SHA before final evidence write: `37d3ac6cd7c68d803324dce6ab6aa6f59420ce4c`
- Head SHA: resolve from live branch ref after this final Agent Docs write
- PR: #476 `feat(catalog): unify guest words and phrases access` (Draft until immutable-head gates/review audit are clean)

## Skills used

### github

Purpose:

Inspect live repository/PR/Issue state, read canonical owners and harness rules, make branch-scoped commits, verify generated diffs/read-back, diagnose CI from exact jobs/artifacts and preserve the expected-head merge lifecycle without writing directly to `main`.

Instruction source:

`skills://plugins/github/github/skill.md` plus repository `AGENTS.md`, `.agents/AGENTS.md`, `.agents/AGENTS.base.md`, `.agents/SKILLS.md`, `.agents/PROJECT_STATE.md`, specialized `.agents/AGENTS.*` rules, `.agents/current/TASK.md`, and `docs/agent-harness.md`.

Version or verification date:

2026-08-12.

Inputs:

Issue #72, Draft PR #476, live `main`, feature branch, CI workflow runs/jobs/artifacts, backend/frontend/OpenAPI/runtime/smoke/visual/documentation contracts.

Files inspected:

- Repository/agent owners listed above.
- `backend/internal/server/server.go`.
- `backend/internal/words/http.go`, `repository.go`, focused tests/integration contracts.
- `api/openapi.yaml`.
- `frontend/components/dictionary-catalog.tsx` and shared catalog navigation.
- `frontend/components/lexigo-dictionary-app.tsx`.
- `frontend/components/word-detail-*`.
- `frontend/components/lexigo-phrases-app.tsx`, `phrases-catalog.tsx`, phrase detail presentation.
- `frontend/components/lexigo-premium-app.tsx`.
- `frontend/lib/auth-return.ts`, navigation/phrase helpers.
- `frontend/e2e/guest-catalog-parity.spec.ts`.
- `frontend/e2e/visual-regression.spec.ts`, `phrases-visual.spec.ts`, `system-states-visual.spec.ts`.
- `frontend/scripts/dictionary-navigation-smoke.sh`.
- `frontend/package.json`, `backend/go.mod`, `backend/go.sum`.
- `docs/architecture.md`.

Actions performed before CI #3297:

- Verified `main` stayed at the expected base before every branch write.
- Classified CI #3255 failures into a real missing shared navigation owner vs stale/format-fragile source contracts.
- Restored shared Dictionary Words/Phrases navigation and preserved semantic ownership.
- Updated Word Detail contracts for guest content-only direct detail while retaining personalized auth-only state.
- Memoized Phrases filter derivation to prevent repeated catalog-loading effects.
- Added exact post-auth `return_to` consumption in `LexigoPremiumApp` using the existing safe internal target parser and canonical navigation serializer.
- Added browser acceptance for guest Word Detail -> login -> exact return and guest Phrases -> registration -> exact return on desktop Chromium and iOS WebKit.
- Documented public word list/detail endpoints and content-only response schemas in OpenAPI.
- Added complete YAML parsing plus negative public SRS/auth leakage assertions.
- Applied the exact pinned-toolchain `go mod tidy` dependency graph emitted by CI #3286.
- Diagnosed CI #3290 Dictionary smoke as a historical auth-gate assertion and replaced only that stale smoke owner with semantic guest Dictionary assertions.

Actions performed for CI #3297:

- Resolved exact failed run `31545380436` on head `b2e92778a75a7ce3efb91bc926f8e49b1c3bbf43`.
- Verified primary failures were `Frontend E2E (Visual regression)` and `Frontend E2E (UI tests (shard 1/2))`; `Frontend quality` failed only as their aggregator.
- Verified backend unit/security/integration, frontend core, UI shard 2/2, accessibility, performance, content security, controlled Service Worker, lesson completion, Dictionary smoke and iOS PWA Dictionary were green.
- Downloaded the UI shard 1 and visual Playwright artifacts and inspected the embedded reports/error contexts instead of blindly re-running the failed workflow.
- Diagnosed two UI shard strict-mode failures: a global exact-name locator for `Войти и сохранить прогресс` matched both a valid primary detail-card CTA and a valid aside CTA on Word Detail/Phrase Detail.
- Preserved both runtime controls and changed only the acceptance owner: each interaction now scopes the exact accessible-name button to the main semantic `article`. No `.first()`, positional selector, skip, retry inflation or timeout change was introduced.
- Audited visual actuals and recomputed their SHA-256/dimensions directly from artifact bytes.
- Confirmed all Phrases catalog actuals and all Dictionary catalog actuals were deterministic across retry. Source diff explains the intentional composition drift through restored shared `CatalogKindNavigation` plus semantic navigation colors/elevation.
- Confirmed Figma-backed correlated-error actual was deterministic; the system-state CSS owner itself did not change, while surrounding Dictionary composition gained the shared navigation owner.
- Confirmed Figma-backed compact-empty actual was not byte-stable across retry: only three one-level RGB pixels differed in top chrome. Classified this as rasterization instability and did not promote either hash.
- Attempted exact Figma composition retrieval. Node `79:93` metadata/dimensions were returned, but its signed image could not be rendered in the sandbox; the next Figma MCP request hit the Starter-plan call limit. No unsupported claim of exact Figma review was made.
- Found a separate Issue #72 completion gap: `docs/architecture.md` still asserted the historical guest Dictionary auth gate although runtime/acceptance now intentionally allow content-only guest browsing.
- Expanded `.agents/current/TASK.md` narrowly before the documentation write, adding `docs/architecture.md` as the durable Issue #72 guest-policy owner.
- Reconciled `docs/architecture.md` with public/authenticated Words API boundaries, guest Phrases demo semantics, non-persistence, authenticated-only scheduler/practice state, validated internal `return_to` and exact post-auth context restoration.
- Read back every changed path and rechecked that `main` remained unchanged after each write.

Artifacts produced in this continuation:

- `docs/architecture.md` durable guest catalog access policy.
- `frontend/e2e/guest-catalog-parity.spec.ts` semantic-owner-scoped auth CTA acceptance.
- `.agents/current/TASK.md` documentation-owner scope expansion.
- `.agents/current/PROGRESS.md` exact CI #3297/visual evidence record.
- This `.agents/current/EXECUTION.md` final pre-validation record.

CI #3297 visual evidence retained for comparison with next run:

- Phrases:
  - compact Light `390x1628` / `63e0a1fd86e78eb75bb22cc3377727d75adace7baa4b39da9e04042714e0a73a`;
  - compact Dark `390x1628` / `64cd10dc0eaec2e0543c3d2580456d0754e4950312b9ab89c70925546a124ae4`;
  - desktop Light `1440x1185` / `f681cdbbd6b810d4f501ef4240ecef639d5572eb725976eb5a3f01bd0d59b67a`;
  - desktop Dark `1440x1185` / `9546035ad41865ad77439356e7e8c825c43277298ebc1fffb82b8173888f20dc`.
- Dictionary:
  - compact Light `390x1197` / `57c8aa5684cc56165392d55988e369da0bf0a5379fed75194bd6d38eb95a09f8`;
  - compact Dark `390x1197` / `4424182e3a4c0356ba57687dd6bca1339c9a671d186083225061b2a7816b90c0`;
  - medium Light `768x1760` / `9b19904153f2e5ad3d7ab076cbc6e812286445f088ec5a81030b74e4741d288a`;
  - desktop Light `1440x1720` / `723359f44c06746bb95674edf0c74e651af48d2d21578dd9f64afa9a7e5f4dc8`.
- Figma-backed system states:
  - correlated error `390x844` / stable `bd528972f73d9baf80c35c90cdb0e67f490bb5294a44bfc4ee3e858d25c64b15`;
  - Dictionary empty `390x844` / first `6ee475aa54781c55f6219d4d286d768613eb1dfecb7baed42a757f524e85c587`, retry `084c80276767f02fb13d1ad51fd1eee1d5cfc1cdc280268eb2a215cffcc4e4cb`; three antialias/raster pixels differ.

Result:

The deterministic UI acceptance failure from CI #3297 is corrected without changing product runtime. Issue #72 architecture documentation now matches the implemented guest/public/auth boundaries. Catalog visual changes have evidence but remain intentionally unpromoted until a fresh immutable-head Linux run confirms stability. The Figma-backed empty-state hash remains a release blocker if instability or unavailable exact design review persists; it is not being bypassed.

Failures and root cause history:

- CI #3255: mixed real shared-navigation omission and stale source contracts.
- CI #3286: deterministic dependency-manifest drift from the new YAML parser; exact `go mod tidy` output committed.
- CI #3290: stale Dictionary auth-gate smoke after intentional guest access change.
- CI #3297 UI shard 1: acceptance locator failed to identify the semantic owner after two valid same-name CTAs existed.
- CI #3297 visual: intentional catalog composition drift plus one Figma-backed empty-state byte-instability in unrelated top-chrome rasterization.

Fallback:

If fresh validation exposes a product regression that cannot be corrected within Issue #72 invariants, revert the Issue #72 PR. Authenticated `/api/v1/words` and `user_words` scheduler ownership remain unchanged, so no data migration or scheduler repair is required.

Limitations:

- Final immutable-head CI has not yet completed on the head produced by this evidence write.
- Content-addressed visual baselines are not yet promoted from a final-head run.
- Figma-backed system-state hashes are not promoted because exact design review plus stable retry evidence is still required.
- Ready transition, merge, exact-SHA `main` CI and Stage/public acceptance remain pending.
- `.agents/PROJECT_STATE.md` intentionally remains unchanged until delivered product evidence exists.

Reusable lesson:

When two valid controls share the same accessible name, preserve product semantics and scope Playwright to the canonical semantic owner rather than selecting by position. When guest/auth policy changes, update every downstream authorization consumer, including public architecture documentation and standalone smoke tests. Treat visual hash drift as evidence: distinguish deterministic intentional composition changes from byte-level raster instability, and never promote a Figma-backed baseline without stable Linux evidence and the required exact design review.

### gh-fix-ci

Purpose:

Classify GitHub Actions failures from exact job logs/artifacts before modifying code or re-running jobs.

Instruction source:

`skills://plugins/github/gh-fix-ci/skill.md`.

Version or verification date:

2026-08-12.

Inputs:

PR #476 CI #3255, #3286, #3290, #3297 and their commit-associated jobs/artifacts.

Actions performed:

- Mapped source-contract failures to semantic runtime owners before correction.
- Used pinned CI `go mod tidy` output as immutable dependency evidence for CI #3286.
- Compared the CI #3290 smoke expectation against Issue #72 acceptance before changing the smoke owner.
- Downloaded CI #3297 Playwright artifacts, located exact strict-mode errors and inspected/recomputed visual actuals.
- Corrected only the semantic acceptance locator for the UI failure.
- Declined to blind-rerun or promote unstable/unreviewed visual hashes.

Result:

Known deterministic non-visual blockers are corrected. A fresh immutable-head CI is now the source of truth; any remaining visual failure must be handled from that run's exact artifacts and provenance.
