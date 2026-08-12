# Current Task Execution

## Task

- Issue: #72 `[Medium][UX] Унифицировать гостевой доступ к словам и фразам`.
- PR: #476 `feat(catalog): unify guest words and phrases access`.
- Branch: `feat/issue-72-guest-catalog-parity`.
- Base SHA: `e6b2d74891fb4e52f23152758812551361717857`.
- Last product/test SHA: `e49097dd4ceacfd4c1ec44737a6718565511f472`.
- Final Agent-Docs head: resolve from the atomic commit created from this file and `PROGRESS.md`.

## Objective delivered

Unify guest access to Words and Phrases without creating a second learning-state model: guests can inspect content through read-only/catalog projections, while scheduler state, progress and persistent practice remain authenticated. Preserve exact canonical catalog/detail context through authentication and keep the public API structurally incapable of leaking personalized SRS state.

## Runtime and contract changes

### Backend / API

- Added public content-only Words list/detail endpoints under `/api/v1/catalog/words`.
- Public repository reads catalog content without `user_words` ownership.
- Personalized SRS/status fields remain absent from public schemas and responses.
- Public `status` filter is invalid instead of being interpreted as a fake guest learning state.
- Authenticated `/api/v1/words*`, due, progress, lessons and review persistence semantics remain unchanged.
- OpenAPI has closed public schemas and focused route contracts.
- Backend tests parse the complete OpenAPI YAML and assert public endpoints cannot silently acquire auth/SRS semantics.

### Frontend / navigation

- Dictionary guest route uses the public projection; authenticated route remains personalized.
- Guest Word Detail exposes content but not scheduler/status presentation.
- Phrases keeps the existing content-only guest/demo path with matching non-persistence guidance.
- Persistent practice is authentication-gated before lesson creation.
- Canonical internal `return_to` preserves search/filter/sort/page/detail context and rejects malformed/external destinations.
- Login/registration returns with `replace` semantics to the exact originating product target.
- Shared Words/Phrases catalog-kind navigation remains a semantic owner on loaded/pending catalog presentation but does not redesign Figma-owned terminal empty/error states.
- Dictionary search form has a named `query` control; submit reads `FormData` from the live form rather than relying solely on potentially stale React state, eliminating the observed WebKit immediate-submit race.

### Acceptance / fixtures

- Guest auth CTA acceptance scopes the exact accessible name to the semantic main `article`; no positional selector or `.first()` workaround.
- Shared quality-gate API fixtures now implement the public content-only Words list/detail endpoints and deliberately omit personalized `status`.
- Browser acceptance covers guest Word Detail -> login -> exact return and guest Phrases -> registration -> exact return in desktop Chromium and iOS WebKit.
- Existing Dictionary touch-target/system-state suites now exercise the same public guest boundary as production runtime.

### Architecture documentation

- `docs/architecture.md` documents guest Words/Phrases read-only access, public/authenticated data ownership, non-persistence, authenticated-only scheduler state, safe `return_to` validation and exact post-auth return behavior.

## CI diagnosis and corrections

### CI #3297 / run `31545380436`

- Primary failures: visual regression and UI shard 1.
- UI cause: two valid same-name guest authentication CTAs made a global exact-name Playwright locator ambiguous.
- Correction: scope the locator to the canonical semantic `article`; preserve both runtime actions.
- Visual evidence: loaded Dictionary/Phrases changes were deterministic, but a Figma-backed Dictionary empty-state screenshot had a three-pixel raster variation between retry images; no failed-run baseline was promoted.

### CI #3303 / run `31549532156`

- Figma-owned empty/error system-state composition was restored without changing the shared system-state CSS owner.
- Eight loaded Dictionary/Phrases actuals were byte-stable across repeated Linux runs and were promoted as content-addressed baselines with exact run/head provenance.
- Performance then exposed Dictionary CLS `0.13230558877253204` against permanent budget `0.1`.
- Correction: keep catalog-kind navigation present while the successful catalog is pending and hide it only after a terminal empty/error result; do not increase the budget.

### CI #3306 / run `31550211401`

- Performance and visual regression passed together on head `fff05cd611b6905a94f050b635f9cc4f74459d94`.
- UI shard 1 then exposed two new root causes:
  1. shared guest quality fixture had not been updated for the new public Words API;
  2. WebKit could submit search before React state had caught up with the live text control.
- Corrections:
  - add content-only public Words list/detail handling to the shared fixture;
  - submit the live named form control through `FormData`, synchronize local state, then update canonical navigation.

### CI #3308 / run `31551224446`

Exact product/test head: `e49097dd4ceacfd4c1ec44737a6718565511f472`.

Result: full required product matrix `success`.

Successful gates include:

- change-scope classification;
- backend unit/race/static/security/coverage;
- backend integration with race detector;
- frontend lint/typecheck/unit/build/dependency audit;
- UI shard 1/2;
- UI shard 2/2;
- Lesson completion;
- iOS PWA Dictionary;
- visual regression;
- performance budgets;
- accessibility audit;
- controlled Service Worker;
- content security;
- Dictionary browser smoke;
- frontend aggregate gate;
- API container build;
- Web container build.

UI shard 1 completed successfully after the fixture and live-form-submit fixes, so both CI #3306 failures are closed by blocking browser evidence.

## Visual provenance

Only loaded catalog content-addressed baselines were advanced, from CI #3303 / run `31549532156`, source head `5932c6b4e21e4d8c1999af861d0737c5a1419c35`:

- Phrases compact Light `63e0a1fd86e78eb75bb22cc3377727d75adace7baa4b39da9e04042714e0a73a`.
- Phrases compact Dark `64cd10dc0eaec2e0543c3d2580456d0754e4950312b9ab89c70925546a124ae4`.
- Phrases desktop Light `f681cdbbd6b810d4f501ef4240ecef639d5572eb725976eb5a3f01bd0d59b67a`.
- Phrases desktop Dark `9546035ad41865ad77439356e7e8c825c43277298ebc1fffb82b8173888f20dc`.
- Dictionary compact Light `57c8aa5684cc56165392d55988e369da0bf0a5379fed75194bd6d38eb95a09f8`.
- Dictionary compact Dark `4424182e3a4c0356ba57687dd6bca1339c9a671d186083225061b2a7816b90c0`.
- Dictionary medium Light `9b19904153f2e5ad3d7ab076cbc6e812286445f088ec5a81030b74e4741d288a`.
- Dictionary desktop Light `723359f44c06746bb95674edf0c74e651af48d2d21578dd9f64afa9a7e5f4dc8`.

Figma-owned shared system-state hashes were not promoted and pass unchanged after the ownership correction.

## Write-safety evidence

- Every ordinary branch write was followed by changed-path read-back and a live `main` SHA check.
- `main` remained `e6b2d74891fb4e52f23152758812551361717857` through the product/test head validation.
- Immediately before this final Agent-Docs atomic commit, PR #476 was still open, Draft, mergeable, based on `e6b2d74891fb4e52f23152758812551361717857`, with head `e49097dd4ceacfd4c1ec44737a6718565511f472`.
- This Agent-Docs reconciliation is intentionally created as one Git Data commit containing only `.agents/current/PROGRESS.md` and `.agents/current/EXECUTION.md`, so there is one final immutable-head validation rather than multiple transient docs heads.

## Review state

- Pre-reconciliation PR audit showed zero reviews, zero inline review threads and zero PR conversation comments.
- PR remains Draft until the final Agent-Docs head receives the full required immutable-head CI and the review audit is repeated on that exact head.
- PR body deliberately uses `Refs #72`; Issue #72 must not close before Stage/public acceptance.

## Remaining delivery sequence

1. Resolve and push the atomic final Agent-Docs commit as the sole new branch head.
2. Run the full required CI on that exact SHA; do not modify the branch while it runs.
3. Re-check PR base/head/mergeability and repeat reviews/threads/comments audit.
4. Mark PR Ready only if the exact head is green and `main` remains safely reconcilable.
5. Squash merge using expected-head protection.
6. Require exact-squash-SHA `main` CI success and immutable image publication.
7. Deploy that exact image to Stage and require Stage/public frontend/API smoke plus blocking desktop Chromium/iOS WebKit public browser validation.
8. Only then close Issue #72 and reconcile `.agents/PROJECT_STATE.md` using the repository's post-delivery Agent-Docs flow.

## Result before final docs-head validation

The Issue #72 product implementation has a fully green product-head matrix on `e49097dd4ceacfd4c1ec44737a6718565511f472`. No known product, browser, visual, performance, accessibility, security or container-build blocker remains. The only remaining pre-merge gate is full CI on the atomic Agent-Docs final head plus the exact-head review/merge audit.
