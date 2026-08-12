# Current Task Progress

## 2026-08-12 03:18 Europe/Moscow

### Verified

- Issue #72 is implemented on `feat/issue-72-guest-catalog-parity` through Draft PR #476 against immutable base `e6b2d74891fb4e52f23152758812551361717857`.
- Live `main` remained `e6b2d74891fb4e52f23152758812551361717857` through every write-safety check in this continuation.
- Public backend ownership is separate from authenticated learning ownership: `/api/v1/catalog/words` and `/api/v1/catalog/words/{wordID}` are public; authenticated `/api/v1/words`, `/api/v1/words/{wordID}`, progress and lessons remain protected.
- Public word repository reads content catalog data without joining `user_words`; list count/page run in the same read-only repeatable-read transaction.
- Public responses do not expose `status`, `easiness`, `intervalDays`, `repetitions`, `dueAt` or `lastReviewedAt`; public `status` filtering is rejected instead of fabricated.
- Dictionary guest list/detail uses the public content projection; authenticated list/detail continues to use personalized endpoints.
- Word Detail keeps scheduler/status presentation authenticated-only and shows explicit non-persistence guidance for guests.
- Phrases guest browsing remains read-only/demo, while persistent lesson/practice behavior requires authentication before lesson creation.
- `authenticationURL` serializes a validated internal canonical `return_to`; successful login/register consumes it in the canonical auth owner and uses `window.location.replace(navigationURL(returnTarget))`, preserving exact Dictionary/Phrases query/detail context without leaving the auth screen in Back history.
- `LexigoPhrasesApp` catalog filters are memoized so catalog loading does not loop on a fresh filter-object identity after state updates.
- Shared `CatalogKindNavigation` is the canonical Words/Phrases navigation owner for both guest and authenticated catalog surfaces.
- OpenAPI documents public content-only list/detail paths and closed `PublicCatalogPage` / `PublicCatalogWord` schemas.
- Backend OpenAPI contract parses the complete YAML document and fails closed if public paths gain auth/status semantics or public word schemas gain personalized SRS fields.
- Blocking Playwright acceptance covers guest Word Detail -> login -> exact return and guest Phrases -> registration -> exact return on desktop Chromium and iOS WebKit.
- `docs/architecture.md` now documents the durable guest catalog policy: guest Words/Phrases read-only browse, content-only public Words API, authenticated-only personalized/persistence state, pre-practice auth gate and validated exact `return_to` consumption.

### CI #3297 classification

- CI #3297 / run `31545380436` ran on exact head `b2e92778a75a7ce3efb91bc926f8e49b1c3bbf43` and failed only the primary `Visual regression` and `UI tests (shard 1/2)` jobs; `Frontend quality` failed downstream from those jobs.
- Backend unit/security/integration, frontend core, UI shard 2/2, accessibility, performance, content security, controlled Service Worker, lesson completion, Dictionary smoke and iOS PWA Dictionary were green.
- UI shard 1 produced two deterministic strict-mode failures in `guest-catalog-parity.spec.ts`: the global `Войти и сохранить прогресс` locator matched both the primary detail-card CTA and the separate demo/practice aside CTA on Word Detail and Phrase Detail.
- Runtime ownership is intentional: both controls are valid product actions. The acceptance test is corrected by scoping the exact accessible-name locator to the main semantic `article`; `.first()`, positional selectors, skips and timeout changes are not used.

### Visual evidence from CI #3297

- Phrases content-addressed actuals were stable across retry and retained their dimensions:
  - compact Light: `390x1628`, SHA-256 `63e0a1fd86e78eb75bb22cc3377727d75adace7baa4b39da9e04042714e0a73a`;
  - compact Dark: `390x1628`, SHA-256 `64cd10dc0eaec2e0543c3d2580456d0754e4950312b9ab89c70925546a124ae4`;
  - desktop Light: `1440x1185`, SHA-256 `f681cdbbd6b810d4f501ef4240ecef639d5572eb725976eb5a3f01bd0d59b67a`;
  - desktop Dark: `1440x1185`, SHA-256 `9546035ad41865ad77439356e7e8c825c43277298ebc1fffb82b8173888f20dc`.
- Dictionary content-addressed actuals were stable across retry and changed geometry exactly where the shared Words/Phrases navigation was restored to the common authenticated/guest owner:
  - compact Light: `390x1197`, SHA-256 `57c8aa5684cc56165392d55988e369da0bf0a5379fed75194bd6d38eb95a09f8`;
  - compact Dark: `390x1197`, SHA-256 `4424182e3a4c0356ba57687dd6bca1339c9a671d186083225061b2a7816b90c0`;
  - medium Light: `768x1760`, SHA-256 `9b19904153f2e5ad3d7ab076cbc6e812286445f088ec5a81030b74e4741d288a`;
  - desktop Light: `1440x1720`, SHA-256 `723359f44c06746bb95674edf0c74e651af48d2d21578dd9f64afa9a7e5f4dc8`.
- Source diff explains both deterministic catalog drifts: `DictionaryCatalog` now renders the shared `CatalogKindNavigation` for the common authenticated/guest catalog path, and `information-architecture.css` moves that owner to semantic application colors/elevation. No unrelated system-state CSS owner changed.
- Figma-backed `compact-error-dark` was deterministic across retry at `390x844`, SHA-256 `bd528972f73d9baf80c35c90cdb0e67f490bb5294a44bfc4ee3e858d25c64b15`; its surrounding Dictionary composition gained the same shared catalog navigation while the system-state presentation owner remained unchanged.
- Figma-backed `compact-empty-light` stayed `390x844`, but first/retry hashes differed: `6ee475aa54781c55f6219d4d286d768613eb1dfecb7baed42a757f524e85c587` vs `084c80276767f02fb13d1ad51fd1eee1d5cfc1cdc280268eb2a215cffcc4e4cb`.
- Pixel comparison of those two empty-state retry actuals found only three one-level RGB differences in the top chrome/calendar shadow area; state content and geometry were identical. This is classified as rasterization instability, not approval evidence.
- No visual baseline was promoted from CI #3297. Repository policy requires a new stable Linux run and, for Figma-backed system states, exact design review before promotion.
- Figma MCP returned node `79:93` metadata/dimensions but its signed image could not be rendered in the current sandbox; the next node request hit the Starter-plan MCP call limit. No claim of exact Figma visual review is made from that attempt.

### Documentation completion finding

- Issue #72 acceptance requires guest capabilities to be documented.
- `docs/architecture.md` still described the historical unauthenticated Dictionary authentication gate even though PR #476 intentionally replaced that model with guest content-only browsing.
- `.agents/current/TASK.md` was first expanded narrowly to allow `docs/architecture.md` as the Issue #72 durable guest-policy owner.
- `docs/architecture.md` now states the public/authenticated API split, guest non-persistence boundary, hidden personalized scheduler state, pre-practice auth gate and safe exact return semantics.

### Checks/fixes completed in this continuation

- Agent Harness mandatory source and specialized rules reviewed before writes.
- CI #3297 jobs, annotations and Playwright artifacts inspected; failures were classified from exact evidence rather than re-running blindly.
- Both guest auth CTA locators are now scoped to the canonical main `article` semantic owner.
- Architecture guest policy is reconciled with current runtime and Issue #72 acceptance.
- Write-safety read-back completed after `.agents/current/TASK.md`, `docs/architecture.md` and `frontend/e2e/guest-catalog-parity.spec.ts`; `main` remained unchanged after each write.
- Visual actual dimensions and SHA-256 values were independently recomputed from the downloaded CI artifact bytes.

### Historical blockers already resolved

- CI #3255 frontend source-contract failures: restored real shared navigation ownership and corrected stale/format-fragile assertions.
- Phrases effect dependency loop: memoized derived filters.
- Missing auth-success `return_to` consumption: added validated exact target handoff.
- Missing public OpenAPI contract: added public paths/closed schemas/full-document YAML validation.
- CI #3286 dependency-file failure: committed exact pinned-toolchain `go mod tidy` graph.
- CI #3290 Dictionary smoke failure: replaced historical auth-gate assertion with semantic guest Dictionary smoke without weakening runtime acceptance.

### Current branch state

- Last product/test write before this Progress reconciliation: `37d3ac6cd7c68d803324dce6ab6aa6f59420ce4c`.
- This Progress write advances the branch; `.agents/current/EXECUTION.md` is the final planned evidence write before the next immutable-head CI observation.
- `.agents/PROJECT_STATE.md` remains intentionally unchanged until product merge plus exact-SHA Stage/public evidence is complete.

### Next action

- Reconcile `.agents/current/EXECUTION.md` with CI #3297, architecture completion and the semantic locator fix.
- Resolve the resulting immutable branch head and observe a fresh full CI run.
- If visual regression is the only remaining failure, inspect the new exact Linux artifacts and retry stability before any baseline write.
- Promote content-addressed Dictionary/Phrases baselines only from a reviewed stable final-head run with exact source run/head provenance.
- Do not promote Figma-backed system-state hashes unless the new run is stable and the exact Figma composition can be reviewed under repository policy.
- Once the final developer-authored head has a fully green required matrix, re-audit reviews/threads, mark PR Ready, perform expected-head squash merge, verify exact-SHA `main` CI, then deploy the exact image to Stage and require public smoke/browser success before closing Issue #72.
