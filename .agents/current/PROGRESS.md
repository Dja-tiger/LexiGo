# Current Task Progress

## 2026-08-12 Europe/Moscow

### Identity

- Issue: #72 `[Medium][UX] Унифицировать гостевой доступ к словам и фразам`.
- PR: #476 `feat(catalog): unify guest words and phrases access`.
- Branch: `feat/issue-72-guest-catalog-parity`.
- Immutable base/main used for the product slice: `e6b2d74891fb4e52f23152758812551361717857`.
- Last product/test head before this Agent-Docs reconciliation: `e49097dd4ceacfd4c1ec44737a6718565511f472`.

### Delivered product contract

- Added public content-only Words list/detail projection at `/api/v1/catalog/words` and `/api/v1/catalog/words/{wordID}` without joining or exposing personalized `user_words` scheduler state.
- Public word payloads do not expose `status`, `easiness`, `intervalDays`, `repetitions`, `dueAt` or `lastReviewedAt`; public status filtering is rejected rather than fabricated.
- Guest Dictionary supports canonical list/search/filter/sort/pagination and Word Detail browsing; authenticated Dictionary continues to use personalized `/api/v1/words*` ownership.
- Guest Phrases remains read-only/demo with the same explicit non-persistence boundary.
- Practice, lesson/review mutations, due state and durable learning progress remain authenticated-only and are gated before lesson creation.
- Word/Phrase guest detail presents content without fake scheduler state and offers authentication only for persistent practice.
- Authentication handoff preserves a validated internal canonical `return_to`, including Dictionary/Phrases search/filter/page/detail context; external or malformed targets are rejected.
- Successful login/registration consumes the validated target and returns to the exact originating product context without retaining the auth screen as an extra Back-history entry.
- OpenAPI documents closed public list/detail schemas; backend contract tests parse the complete YAML document and reject public auth/SRS leakage.
- `docs/architecture.md` now documents the durable guest/public/authenticated capability boundary and exact auth-return semantics.

### Reliability and acceptance fixes completed during validation

- CI #3297 / run `31545380436` exposed a strict-mode browser locator ambiguity after two valid same-name guest auth CTAs existed. Acceptance now scopes the exact accessible-name control to the canonical semantic `article`; runtime controls were not removed and no `.first()`, positional selector, skip or timeout weakening was introduced.
- The same visual run showed intentional loaded Dictionary/Phrases catalog composition drift plus byte-instability in a Figma-backed Dictionary empty state. Baselines were not promoted from that failed run.
- Dictionary shared catalog-kind navigation was restricted so approved Figma-owned empty/error composition remains unchanged while the loaded catalog retains the common Words/Phrases owner.
- CI #3303 / run `31549532156` on `5932c6b4e21e4d8c1999af861d0737c5a1419c35` confirmed old Figma-owned system-state baselines and stable loaded-catalog actuals. Only the eight deterministic content-addressed loaded Dictionary/Phrases baselines were promoted with exact run/head provenance.
- CI #3303 also exposed Dictionary CLS `0.13230558877253204` above the permanent `0.1` budget because loaded catalog navigation entered flow after data arrived. The runtime now keeps that owner present during loading and hides it only for terminal empty/error states; the performance budget was not raised.
- CI #3306 / run `31550211401` on `fff05cd611b6905a94f050b635f9cc4f74459d94` confirmed visual and performance gates green, then exposed two independent UI-shard defects:
  - shared guest quality fixtures still modeled only authenticated `/api/v1/words*` and did not serve the new public Words projection;
  - WebKit could submit a search immediately after input while React state lagged behind the live control value.
- Shared quality fixtures now expose content-only public Words list/detail responses without personalized status fields.
- Dictionary search submit now reads the live named form control through `FormData`, synchronizes local presentation state and writes that exact query to canonical URL state. This removes the WebKit/concurrent-render race instead of adding waits to tests.

### Visual provenance

The following loaded catalog baselines are content-addressed and intentionally owned by CI #3303 / run `31549532156`, source head `5932c6b4e21e4d8c1999af861d0737c5a1419c35`:

- Phrases compact Light: `390x1628`, `63e0a1fd86e78eb75bb22cc3377727d75adace7baa4b39da9e04042714e0a73a`.
- Phrases compact Dark: `390x1628`, `64cd10dc0eaec2e0543c3d2580456d0754e4950312b9ab89c70925546a124ae4`.
- Phrases desktop Light: `1440x1185`, `f681cdbbd6b810d4f501ef4240ecef639d5572eb725976eb5a3f01bd0d59b67a`.
- Phrases desktop Dark: `1440x1185`, `9546035ad41865ad77439356e7e8c825c43277298ebc1fffb82b8173888f20dc`.
- Dictionary compact Light: `390x1197`, `57c8aa5684cc56165392d55988e369da0bf0a5379fed75194bd6d38eb95a09f8`.
- Dictionary compact Dark: `390x1197`, `4424182e3a4c0356ba57687dd6bca1339c9a671d186083225061b2a7816b90c0`.
- Dictionary medium Light: `768x1760`, `9b19904153f2e5ad3d7ab076cbc6e812286445f088ec5a81030b74e4741d288a`.
- Dictionary desktop Light: `1440x1720`, `723359f44c06746bb95674edf0c74e651af48d2d21578dd9f64afa9a7e5f4dc8`.

Figma-owned shared loading/empty/error/offline baseline hashes were not changed. They pass unchanged after the lifecycle/ownership correction.

### Product-head validation

CI #3308 / run `31551224446` on exact product/test head `e49097dd4ceacfd4c1ec44737a6718565511f472` completed successfully across the full required product matrix:

- scope routing and Agent Docs routing contract;
- backend formatting, static analysis, race-enabled unit tests, coverage and vulnerability scan;
- backend integration with race detector;
- frontend lint, typecheck, unit/source contracts, production build and dependency audit;
- UI tests shard 1/2 and shard 2/2;
- Lesson completion;
- iOS PWA Dictionary;
- visual regression;
- performance budgets;
- accessibility audit;
- controlled Service Worker;
- content security;
- Dictionary navigation smoke;
- frontend quality aggregator;
- API and Web container builds.

The two exact failures discovered in CI #3306 are therefore closed by blocking browser evidence on #3308, not by local-only assumptions.

### Review and delivery state

- PR #476 remained open, Draft and mergeable on exact product/test head `e49097dd4ceacfd4c1ec44737a6718565511f472` before this Agent-Docs reconciliation.
- The pre-reconciliation review audit had no reviews, inline review threads or PR conversation comments.
- `.agents/PROJECT_STATE.md` remains intentionally unchanged because Issue #72 is not delivered until expected-head merge, exact-SHA `main` CI and exact-image Stage/public validation all succeed.
- PR body uses `Refs #72` rather than an automatic close keyword so Issue #72 remains open through deployment/public acceptance.

### Next gate

1. Advance the feature branch once with the atomic final Agent-Docs reconciliation containing this file and `EXECUTION.md`.
2. Require a full immutable-head CI on that exact final branch SHA.
3. Repeat review/thread/comment audit and verify base/head/mergeability immediately before merge.
4. Mark PR #476 Ready and perform expected-head squash merge only if `main` is still the verified base or has been safely reconciled.
5. Require exact-SHA `main` CI success and immutable API/Web image publication.
6. Deploy that exact image SHA to Stage and require Stage/public HTTP smoke plus blocking public desktop Chromium/iOS WebKit validation.
7. Only after those gates succeed, close Issue #72 and reconcile `.agents/PROJECT_STATE.md` in the normal Agent-Docs delivery flow.
