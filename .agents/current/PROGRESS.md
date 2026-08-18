# Current Task Progress

## 2026-08-18 23:10 +03:00

### Verified

- Live `main` is `b1444d5e5153da9b8fe275b7f1f175e9bd25286b` after Issue #583 reconciliation PR #600.
- Umbrella #205 remains open.
- Issue #601 is the active evidence/test-only child and Draft PR #602 is its delivery vehicle.
- Branch `test/issue-601-route-browser-zoom-parity` was created from exact `main@b1444d5e5153da9b8fe275b7f1f175e9bd25286b`.
- Consolidated 320×700 (#587/#588), 768×1024 (#568/#570) and 1440×1024 (#581) route-parity dimensions are already delivered.
- `browser-zoom-collection-contract.test.ts` recognizes the new consolidated owner and keeps the existing Home/Learn/Active Lesson/Phrases browser-owned zoom owners collected.
- `route-browser-zoom-parity.spec.ts` exercises all ten canonical routes in one persistent Chromium context at real browser zoom 2.0, verifies CDP `cssVisualViewport.zoom`, route ownership, no horizontal overflow, fixed/global chrome containment, keyboard-visible focus and fail-closed content-addressed evidence.
- Initial immutable-head CI #3821 / run `32166685629` on head `36da468b980892f4a68a5828a3d4a1f4dcf5067d` completed with only Visual regression failing; frontend core, backend suites and all other E2E groups were green.
- The Visual failure occurred before the intended `REVIEW_REQUIRED` gate, so it was treated as a real test-harness defect rather than approving fingerprints.
- Exact failed screenshot/trace proved Phrase Detail rendered `Код запроса: not_mocked` for `GET /api/v1/phrases/identify-root-cause`.
- Trace ownership identifies `installActiveLessonFixture()` as the handler returning that 404: it installs a page-level `**/api/v1/**` catch-all, while the new consolidated matrix intentionally reuses one page. Existing route-parity suites do not expose this because every route runs in a fresh Playwright test/page.
- The correction is test-only: before opening each non-Active-Lesson route, remove the page-level catch-all with `page.unroute("**/api/v1/**")`, allowing the context-level quality API to own subsequent canonical routes. Runtime source remains untouched.

### Finding

The first CI failure is deterministic fixture leakage inside the newly consolidated test, not a product reflow defect. The Active Lesson page-scoped catch-all survives navigation and shadows the shared context-level fixture for later routes; Phrase Detail is the first later route that requires an endpoint absent from the Active Lesson fixture.

### Root cause

Historical route parity runs one route per Playwright test, so page-scoped deterministic API fixtures are naturally discarded with the page. Issue #601 deliberately consolidates ten routes into one persistent Chromium page to preserve browser-owned zoom state, exposing fixture lifetime as a new test-harness boundary.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/e2e/route-browser-zoom-parity.spec.ts`
- `frontend/playwright.visual.config.ts`
- `frontend/components/browser-zoom-collection-contract.test.ts`

### Checks passed

- Live repo/main/PR preflight.
- New consolidated browser-owned zoom collection/source contract in Frontend core.
- Initial CI #3821: Backend unit/security, Backend integration, Frontend core, iOS PWA dictionary, both UI shards, Dictionary smoke, Content security, Accessibility audit, Performance budgets, Controlled service worker and Lesson completion.
- Failed Visual artifact and trace were manually inspected; `not_mocked` was traced to `active-lesson-fixture.ts` rather than guessed from the missing heading assertion.
- Existing Phrases visual owner independently proves the same Phrase Detail slug/heading works with the shared quality fixture, excluding a phrase-content/runtime regression.
- Fixture-isolation correction committed as `133327e9290a758c5bbdd947ecd60dec908dd5ba` without runtime changes.

### Checks failed

- CI #3821 Visual regression failed before evidence review because Active Lesson's page-level API fixture leaked into later routes.
- No product geometry/reflow failure has been observed yet.

### Current branch head

`133327e9290a758c5bbdd947ecd60dec908dd5ba` before this documentation synchronization commit.

### Next action

Run the new immutable-head CI through the corrected fixture lifecycle. If all structural/runtime assertions pass and Visual reaches only the deliberate `REVIEW_REQUIRED` gate, download the exact Linux artifact, inspect all 20 Light/Dark route captures and metrics, then approve fingerprints only from that reviewed immutable head.
