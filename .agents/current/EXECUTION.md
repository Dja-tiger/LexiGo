# Current Task Execution

## Task

- Branch: `test/issue-601-route-browser-zoom-parity`
- Base SHA: `b1444d5e5153da9b8fe275b7f1f175e9bd25286b`
- Verified diagnostic SHA: `36da468b980892f4a68a5828a3d4a1f4dcf5067d`
- Fixture-isolation SHA: `133327e9290a758c5bbdd947ecd60dec908dd5ba`
- PR: #602 (Draft)

## Skills used

### GitHub repository workflow

Purpose:
Execute the next atomic #205 audit slice from current live repository state with immutable-head CI, fail-closed evidence review and expected-head merge policy.

Instruction source:
`AGENTS.md`, `.agents/**`, `docs/agent-harness.md`, GitHub skill, Issue #205 and Issue #601.

Version or verification date:
2026-08-18.

Inputs:
Live `main`, completed #583/#600 lifecycle, #205 remaining matrix, existing route-parity owner, existing browser-zoom owners, Draft PR #602, CI #3821 and its exact Visual diagnostics.

Files inspected or changed:
- `.agents/lessons/accessibility.md`
- `frontend/components/browser-zoom-collection-contract.test.ts`
- `frontend/playwright.visual.config.ts`
- `frontend/e2e/home-browser-zoom.spec.ts`
- `frontend/e2e/phrases-visual.spec.ts`
- `frontend/e2e/route-tablet-parity.spec.ts`
- `frontend/e2e/route-browser-zoom-parity.spec.ts`
- `frontend/e2e/support/active-lesson-fixture.ts` (read-only root-cause inspection)
- `frontend/e2e/support/word-detail-fixture.ts` (read-only fixture-lifetime comparison)
- `.agents/current/**`

## Actions performed

1. Verified live main after Issue #583 reconciliation and continued the active Issue #601 branch/PR rather than starting a competing slice.
2. Confirmed #602 implements one consolidated ten-route true-browser-zoom owner using persistent Chromium plus the existing extension/CDP mechanism.
3. Inspected CI #3821 / run `32166685629`: all groups except Visual regression were green.
4. Downloaded the exact failed Visual artifact and inspected screenshot, Playwright error context and trace rather than changing the missing heading locator blindly.
5. The failed Phrase Detail frame showed an application error surface with `Код запроса: not_mocked`; trace recorded `GET /api/v1/phrases/identify-root-cause` being fulfilled 404 by `installActiveLessonFixture()`.
6. Compared fixture ownership:
   - shared quality API is context-scoped;
   - Active Lesson installs a page-scoped catch-all `page.route("**/api/v1/**", ...)`;
   - canonical Word Detail installs narrow page routes that fall back for unrelated requests;
   - existing route-parity tests use fresh pages per route, so the Active Lesson catch-all never leaks there.
7. Corrected only the consolidated #601 test owner: every non-Active-Lesson iteration removes the page-level catch-all with `page.unroute("**/api/v1/**")`, restoring the context-level quality API before the next canonical route.
8. Read back the changed loop from GitHub to verify the correction landed on the explicit Issue #601 branch. No runtime CSS/React/backend/deploy source was changed.

Commands or procedures:
GitHub connector live reads/writes; GitHub Actions job/artifact inspection; exact artifact ZIP inspection; Playwright screenshot/error-context/trace analysis; branch-scoped Contents API writes.

Artifacts produced:
- Issue #601 and Draft PR #602.
- Initial fail-closed CI #3821 diagnostics.
- Exact failed Visual artifact proving fixture leakage.
- Fixture-isolation test commit `133327e9290a758c5bbdd947ecd60dec908dd5ba`.
- Updated active `.agents/current/**` execution state.

## Result

The first CI failure is resolved at the correct ownership boundary: it was a test-fixture lifetime defect created by reusing one page across the consolidated matrix, not a product Phrase Detail failure. The correction keeps the audit test-only and preserves the fail-closed visual acceptance gate.

## Failures

- CI #3821 failed Visual regression before `REVIEW_REQUIRED` because the Active Lesson page-level catch-all intercepted later Phrase Detail API traffic and returned `not_mocked`.
- No product overflow, clipping, focus containment or route-ownership failure has been established yet.

## Root cause

A page-scoped catch-all fixture has a longer lifetime than the Active Lesson route when ten canonical routes are exercised sequentially in the same page. The older one-route-per-test matrices implicitly disposed that fixture by disposing the page; the new persistent browser-zoom matrix must do so explicitly.

## Fallback

If the corrected immutable-head run exposes a genuine 200% reflow/runtime defect before the evidence gate, stop fingerprint approval, create a route-specific runtime Issue/PR, repair and Stage-validate that defect, then reconstruct #601 from corrected main. Do not weaken geometry/focus assertions.

## Limitations

The GitHub connector does not execute local Playwright. Authoritative browser-owned zoom validation and exact Linux evidence are obtained from repository CI. The downloaded CI artifact is therefore the source of truth for browser diagnostics.

## Reusable lesson

When a consolidated browser audit deliberately reuses one page, deterministic route fixtures need explicit lifetime boundaries. A page-level catch-all route must be removed when its owning route ends; otherwise later routes can fail in ways that look like product/API regressions while actually being harness leakage.
