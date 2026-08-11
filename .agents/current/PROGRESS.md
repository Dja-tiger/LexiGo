# Current Task Progress

## 2026-08-11 22:42 Europe/Moscow

### Verified

- Issue #72 is implemented on `feat/issue-72-guest-catalog-parity` through Draft PR #476 against immutable base `e6b2d74891fb4e52f23152758812551361717857`.
- Live `main` remained `e6b2d74891fb4e52f23152758812551361717857` through the latest smoke-contract write-safety check.
- Public backend ownership is separate from authenticated learning ownership: `/api/v1/catalog/words` and `/api/v1/catalog/words/{wordID}` are public; authenticated `/api/v1/words`, `/api/v1/words/{wordID}`, phrases, progress and lessons remain protected.
- Public word repository reads content catalog data without joining `user_words`; list count/page run in the same read-only repeatable-read transaction.
- Public responses do not expose `status`, `easiness`, `intervalDays`, `repetitions`, `dueAt` or `lastReviewedAt`; public `status` filtering is rejected instead of fabricated.
- Dictionary guest list/detail uses the public content projection; authenticated list/detail continues to use personalized endpoints.
- Word Detail keeps scheduler/status presentation authenticated-only and shows explicit non-persistence guidance for guests.
- Phrases guest browsing remains read-only/demo, while lesson configuration requires authentication before lesson creation.
- `authenticationURL` serializes a validated internal canonical `return_to`; successful login/register consumes it in the canonical auth owner and uses `window.location.replace(navigationURL(returnTarget))`, preserving exact Dictionary/Phrases query/detail context without leaving the auth screen in Back history.
- `LexigoPhrasesApp` catalog filters are memoized so catalog loading does not loop on a fresh filter-object identity after state updates.
- Shared `CatalogKindNavigation` is restored as the canonical Words/Phrases navigation owner.
- OpenAPI documents public content-only list/detail paths and closed `PublicCatalogPage` / `PublicCatalogWord` schemas.
- OpenAPI contract test parses the complete YAML document with `gopkg.in/yaml.v3` and fails closed if public paths gain auth/status semantics or public word schema gains personalized SRS fields.
- New Playwright acceptance covers guest Word Detail -> login -> exact return and guest Phrases -> registration -> exact return on desktop Chromium and iOS WebKit; the spec is registered in blocking `test:e2e:ui`.
- PR #476 is mergeable; prior review-thread and submitted-review audit returned no review threads/reviews. PR body is reconciled with completed implementation and delivery gates.
- CI #3290 on head `67a9124df6382a5813fc6655581daad9768a978f` proved frontend core success and backend unit/security success, including `Verify dependency files`, formatting, static analysis, unit race, coverage and vulnerability scan.
- The only observed CI #3290 failure was `Frontend E2E (Dictionary smoke)`, and its log showed the smoke itself still required the historical unauthenticated Dictionary auth gate.
- `frontend/scripts/dictionary-navigation-smoke.sh` now asserts the Issue #72 guest contract instead: canonical Dictionary route island, `Словарь` heading, explicit demo/non-persistence guidance, and absence of the historical auth gate.

### Finding

- CI #3255 initially failed frontend source-contract tests after guest/auth ownership changed.
- One source contract was whitespace-fragile and another still asserted the old authenticated-only Word Detail guard.
- Dictionary imported `CatalogKindNavigation` but no longer rendered it, so one failure represented a real runtime owner regression rather than stale test text.
- `LexigoPhrasesApp` constructed `phraseCatalogFilters(navigation)` on every render while using that object in the catalog-loading effect dependency list, permitting repeated reloads after state changes.
- Exact `return_to` was generated and validated but was not consumed after login/register; compatibility auth fallback therefore lost exact catalog/detail state.
- Public word endpoints existed in backend runtime but were absent from `api/openapi.yaml`.
- The previous OpenAPI contract test validated only string fragments and could not prove the full YAML document parsed.
- CI #3286 failed only at backend `Verify dependency files`; the exact pinned-toolchain `go mod tidy` diff was subsequently committed.
- CI #3290 then exposed a second stale downstream acceptance owner: `dictionary-navigation-smoke.sh` still documented the Dictionary as intentionally protected and failed when the new guest catalog correctly rendered.

### Root cause

- Guest parity crossed backend public projection, route islands, compatibility auth handoff, source contracts, OpenAPI and standalone CI smoke ownership. Earlier partial implementation changed behavior without completing every downstream consumer/acceptance owner.
- Phrases filter state lacked stable referential identity at the effect boundary.
- Auth return target generation and auth-success consumption lived in separate owners; only the producer had initially been implemented.
- Runtime API implementation advanced ahead of its OpenAPI documentation/structural validation.
- Adding yaml.v3 required the exact transitive module graph emitted by repository-standard `go mod tidy`.
- Dictionary navigation smoke encoded the pre-Issue-72 authorization model rather than the canonical route contract and therefore became stale when guest browsing became intentional product behavior.

### Changed files

- Backend/public boundary: `backend/internal/server/**`, `backend/internal/words/**`, focused backend integration coverage.
- OpenAPI: `api/openapi.yaml`, `backend/internal/words/openapi_contract_test.go`, `backend/go.mod`, `backend/go.sum`.
- Dictionary/Word Detail: `frontend/components/dictionary-catalog.tsx`, `frontend/components/lexigo-dictionary-app.tsx`, Word Detail route/presentation and focused source-contract tests.
- Phrases: `frontend/components/lexigo-phrases-app.tsx`, focused Phrases source-contract tests.
- Auth return: `frontend/components/lexigo-premium-app.tsx`, `frontend/lib/auth-return.ts` and focused tests.
- Browser acceptance: `frontend/e2e/guest-catalog-parity.spec.ts`, `frontend/package.json` blocking UI registration.
- Canonical route smoke: `frontend/scripts/dictionary-navigation-smoke.sh`.
- Agent Harness: `.agents/current/TASK.md`, `.agents/current/PROGRESS.md`, `.agents/current/EXECUTION.md`.

### Checks passed

- Write-safety read-back for changed runtime/test/smoke paths and repeated verification that `main` did not move during writes.
- GitHub-generated diff for the large `LexigoPremiumApp` replacement was exactly the intended six added lines, with no unrelated rewrite.
- GitHub-generated diff for `api/openapi.yaml` was exactly two additive regions: 124 additions, 0 deletions.
- CI #3280 on intermediate head `47834b0faaeb06f8b11b91bb78f73dbe222a75a0`: frontend lint/typecheck/unit/build/audit succeeded; backend unit/race/security and integration/race succeeded before later commits advanced the head.
- Exact `go mod tidy` diff from CI #3286 was committed verbatim; CI #3290 subsequently passed `Verify dependency files` and the full backend unit/security job on the pinned toolchain.
- CI #3290 frontend core completed successfully on the Agent-Harness-inclusive product head.
- Smoke fix commit `7252096289ef6917d9f14f74817c987d2c15a0c9` has a narrowly scoped generated diff replacing only the old Dictionary auth-gate assertion with semantic guest-Dictionary assertions.

### Checks failed

- Historical CI #3255 frontend unit/source contracts failed on stale/fragile Dictionary and Word Detail assertions; corrected with runtime ownership preserved.
- CI #3286 / run `31528279920` on head `2a8a5be95209ff9b2c86eae7fdf5bdebb8a505ca` failed `Backend unit and security -> Verify dependency files`; exact tidy metadata was committed in `d6612f3c978f10be2a394d9acc564e5a7818f8d4` and `90a72b873086ab09895527fb67019cd95b325889`.
- CI #3290 / run `31528597976` on head `67a9124df6382a5813fc6655581daad9768a978f` failed `Frontend E2E (Dictionary smoke)` because the smoke expected `aria-label="Словарь доступен после входа"` on `/dictionary`. This expectation contradicts Issue #72 and was corrected in `7252096289ef6917d9f14f74817c987d2c15a0c9` without changing product runtime.
- No unresolved functional failure is currently known. A fresh immutable-head CI is required after the final Agent Harness evidence write.

### Current branch head

- Smoke implementation head before this Progress write: `7252096289ef6917d9f14f74817c987d2c15a0c9`.
- This Progress write advances the branch once more; `.agents/current/EXECUTION.md` is the final planned branch write before immutable-head CI.
- Resolve the resulting live branch SHA after the Execution write and use only that SHA for Ready/merge evidence.

### Next action

- Reconcile `.agents/current/EXECUTION.md` with CI #3290 stale smoke classification/fix.
- Resolve final branch head and poll immutable-head CI until every required backend/frontend/UI/a11y/PWA/visual/performance/container gate is terminal.
- Do not modify branch files after final CI success; re-audit PR #476 head/review state and live `main` using metadata-only operations.
- When immutable-head CI and review audit are clean, mark PR Ready and perform the repository-required expected-head squash merge.
- Then verify exact-SHA `main` CI and exact-image Stage/public smoke/browser acceptance before closing Issue #72 and reconciling `.agents/PROJECT_STATE.md`.
