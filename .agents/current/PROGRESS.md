# Current Task Progress

## 2026-08-11 22:35 Europe/Moscow

### Verified

- Issue #72 is implemented on `feat/issue-72-guest-catalog-parity` through Draft PR #476 against immutable base `e6b2d74891fb4e52f23152758812551361717857`.
- Live `main` remained `e6b2d74891fb4e52f23152758812551361717857` throughout the implementation/write-safety checks recorded in this pass.
- Public backend ownership is separate from authenticated learning ownership: `/api/v1/catalog/words` and `/api/v1/catalog/words/{wordID}` are mounted outside auth middleware; authenticated `/api/v1/words`, `/api/v1/words/{wordID}`, phrases, progress and lessons remain protected.
- Public word repository reads content catalog data without joining `user_words`; list count/page run in the same read-only repeatable-read transaction.
- Public responses do not expose `status`, `easiness`, `intervalDays`, `repetitions`, `dueAt` or `lastReviewedAt`; public `status` filtering is rejected instead of fabricated.
- Dictionary guest list/detail uses the public content projection; authenticated list/detail continues to use personalized endpoints.
- Word Detail keeps scheduler/status presentation authenticated-only and shows explicit non-persistence guidance for guests.
- Phrases guest browsing remains read-only/demo, while lesson configuration requires authentication before lesson creation.
- `authenticationURL` serializes a validated internal canonical `return_to`; successful login/register now consumes it in the canonical auth owner and uses `window.location.replace(navigationURL(returnTarget))`, preserving exact Dictionary/Phrases query/detail context without leaving the auth screen in Back history.
- `LexigoPhrasesApp` catalog filters are memoized so catalog loading does not loop on a fresh filter-object identity after state updates.
- Shared `CatalogKindNavigation` is restored as the canonical Words/Phrases navigation owner.
- OpenAPI documents public content-only list/detail paths and closed `PublicCatalogPage` / `PublicCatalogWord` schemas.
- OpenAPI contract test parses the complete YAML document with `gopkg.in/yaml.v3` and fails closed if public paths gain auth/status semantics or public word schema gains personalized SRS fields.
- New Playwright acceptance covers guest Word Detail -> login -> exact return and guest Phrases -> registration -> exact return on desktop Chromium and iOS WebKit; the spec is registered in blocking `test:e2e:ui`.
- PR #476 is mergeable; review-thread and submitted-review audit returned no review threads/reviews. PR body is reconciled with the completed implementation and delivery gates.

### Finding

- CI #3255 initially failed frontend source-contract tests after guest/auth ownership changed.
- One source contract was whitespace-fragile and another still asserted the old authenticated-only Word Detail guard.
- Dictionary imported `CatalogKindNavigation` but no longer rendered it, so one failure represented a real runtime owner regression rather than stale test text.
- `LexigoPhrasesApp` constructed `phraseCatalogFilters(navigation)` on every render while using that object in the catalog-loading effect dependency list, permitting repeated reloads after state changes.
- Exact `return_to` was generated and validated but was not consumed after login/register; compatibility auth fallback therefore lost exact catalog/detail state.
- Public word endpoints existed in backend runtime but were absent from `api/openapi.yaml`.
- The previous OpenAPI contract test validated only string fragments and could not prove the full YAML document parsed.
- Final-head attempt CI #3286 failed only at backend `Verify dependency files`: `go mod tidy` added transitive yaml.v3 test dependencies/checksums that were not yet committed.

### Root cause

- Guest parity was implemented across several canonical owners at different times, leaving stale source contracts and one omitted shared-navigation render.
- Phrases filter state lacked stable referential identity at the effect boundary.
- Auth return target generation and auth-success consumption lived in separate owners; only the producer had been implemented.
- Runtime API implementation advanced ahead of its OpenAPI documentation/structural validation.
- Adding yaml.v3 as a direct test dependency required committing the exact transitive module graph emitted by repository-standard `go mod tidy`; the first manifest commit included the direct dependency but not the newly materialized indirect graph/checksums.

### Changed files

- Backend/public boundary: `backend/internal/server/**`, `backend/internal/words/**`, focused backend integration coverage.
- OpenAPI: `api/openapi.yaml`, `backend/internal/words/openapi_contract_test.go`, `backend/go.mod`, `backend/go.sum` for the focused full-document YAML parser contract.
- Dictionary/Word Detail: `frontend/components/dictionary-catalog.tsx`, `frontend/components/lexigo-dictionary-app.tsx`, Word Detail route/presentation and focused source-contract tests.
- Phrases: `frontend/components/lexigo-phrases-app.tsx`, focused Phrases source-contract tests.
- Auth return: `frontend/components/lexigo-premium-app.tsx`, `frontend/lib/auth-return.ts` and focused tests.
- Browser acceptance: `frontend/e2e/guest-catalog-parity.spec.ts`, `frontend/package.json` blocking UI registration.
- Agent Harness: `.agents/current/TASK.md`, `.agents/current/PROGRESS.md`, `.agents/current/EXECUTION.md`.

### Checks passed

- Write-safety read-back for changed runtime/test paths and repeated verification that `main` did not move during writes.
- GitHub-generated diff for the large `LexigoPremiumApp` replacement was exactly the intended six added lines, with no unrelated rewrite.
- GitHub-generated diff for `api/openapi.yaml` was exactly two additive regions: 124 additions, 0 deletions.
- CI #3280 on intermediate head `47834b0faaeb06f8b11b91bb78f73dbe222a75a0`: frontend lint/typecheck/unit/build/audit succeeded; backend unit/race/security and integration/race succeeded before later acceptance/OpenAPI commits advanced the head.
- CI #3286 scope classification succeeded and confirmed full product CI routing on the Agent-Harness-inclusive head.
- Exact `go mod tidy` diff from CI #3286 was captured and committed verbatim to `backend/go.mod`/`backend/go.sum`; this fix is dependency-metadata-only and does not change runtime behavior.

### Checks failed

- Historical CI #3255 frontend unit/source contracts failed on stale/fragile Dictionary and Word Detail assertions; corrected with runtime ownership preserved.
- CI #3286 / run `31528279920` on head `2a8a5be95209ff9b2c86eae7fdf5bdebb8a505ca` failed `Backend unit and security -> Verify dependency files` because `go mod tidy` produced additional indirect dependency/checksum lines. The emitted diff was committed in `d6612f3c978f10be2a394d9acc564e5a7818f8d4` and `90a72b873086ab09895527fb67019cd95b325889`.
- No unresolved functional failure is currently known. Final immutable-head CI is pending after this final Agent Harness reconciliation.

### Current branch head

- Latest code/dependency head before this final Progress write: `90a72b873086ab09895527fb67019cd95b325889`.
- This Progress write advances the branch once more; `.agents/current/EXECUTION.md` is the final planned branch write before immutable-head CI.
- Resolve the resulting live branch SHA after that write and use only that SHA for Ready/merge evidence.

### Next action

- Reconcile `.agents/current/EXECUTION.md` with the dependency-file CI finding/fix.
- Resolve final branch head and poll immutable-head CI until every required backend/frontend/UI/a11y/PWA/visual/performance/container gate is terminal.
- Classify/fix any failing gate without weakening acceptance contracts.
- Re-audit PR #476 head/review state and live `main` after CI.
- When immutable-head CI and review audit are clean, mark PR Ready and perform the repository-required expected-head squash merge.
- Then verify exact-SHA `main` CI and exact-image Stage/public smoke/browser acceptance before closing Issue #72 and reconciling `.agents/PROJECT_STATE.md`.
