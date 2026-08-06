# Current Task

## Identity

- Issue: #74
- Branch: `test/issue-74-word-detail-browser-zoom`
- Base SHA: `5e2b3e59ac0b34c3e4572bca8a97c656f7e234fb`
- Head SHA: resolve from live branch ref
- PR: pending

## Objective

Add a permanent, fail-closed Chromium audit for the canonical authenticated `/words/[id]` route at true 200% browser-owned zoom. The audit must distinguish browser zoom from root-font enlargement, pinch/page scaling and `deviceScaleFactor`, then prove the Word Detail reading and action path remains usable without clipping, overlap, sticky obstruction or horizontal overflow.

## Scope

- Launch a dedicated Chromium persistent context with a minimal Manifest V3 test extension.
- Apply zoom through `chrome.tabs.setZoom(tabId, 2)` after canonical Word Detail is ready.
- Independently verify the extension-reported zoom factor and Chromium `Page.getLayoutMetrics().cssVisualViewport.zoom`.
- Prove the root font size is unchanged and the CSS layout viewport contracts as expected at browser zoom.
- Audit the canonical ready state at a deterministic desktop host viewport, including route header, term, pronunciation, meaning, related phrases, primary practice action and knowledge panel.
- Prove responsive single-column reflow, de-sticky knowledge presentation, visible keyboard focus, target separation and zero horizontal overflow.
- Add the audit to an existing required frontend browser gate.
- Change `frontend/app/word-detail.css` only if the real zoom audit proves a production layout defect.

## Non-goals

- Replacing or weakening the existing 200% root-text reflow contract.
- Treating `deviceScaleFactor`, CSS `zoom`, transforms or `Emulation.setPageScaleFactor` as browser zoom.
- Auditing every LexiGo route in one PR.
- Final physical-device acceptance or Issue #74 closure.
- Word Detail redesign, copy changes, API/session/history/storage changes, dependency updates or visual baseline regeneration.
- WebKit browser zoom automation, which does not expose the Chromium extension/CDP proof used by this bounded slice.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/e2e/word-detail-browser-zoom.spec.ts`
- `frontend/e2e/support/browser-zoom-extension/manifest.json`
- `frontend/e2e/support/browser-zoom-extension/background.js`
- `frontend/package.json`
- `frontend/app/word-detail.css` only after a reproduced production defect

## Prohibited paths

- Backend, API and migration paths.
- Session, account, route-history, storage, Service Worker and PWA runtime owners.
- GitHub Actions workflows and CI runner scripts.
- Dependency manifests other than the existing `frontend/package.json` script inventory; no dependency version changes.
- Existing Linux visual PNG baselines.
- Unrelated route CSS, global design tokens and compatibility cleanup.

## Runtime owners

- Route/bootstrap owner: `frontend/components/lexigo-dictionary-app.tsx` and the existing Dictionary route island; unchanged.
- Word Detail state/API/navigation owner: `frontend/components/word-detail-route.tsx`; unchanged.
- Word Detail semantic presentation owner: `frontend/components/word-detail-presentation.tsx`; unchanged unless a semantic defect is independently proven.
- Word Detail responsive presentation owner: `frontend/app/word-detail.css`.
- Browser zoom control owner: test-only Manifest V3 extension under `frontend/e2e/support/browser-zoom-extension/`.
- Deterministic API owners: existing `installQualityGateAPI` and `installCanonicalWordDetailFixture` fixtures.

## Documentation owners

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- Final verified outcome belongs in `.agents/PROJECT_STATE.md` through the post-merge reconciliation slice.

## Invariants

- Browser zoom is applied by Chromium itself through `chrome.tabs.setZoom`; no CSS or device emulation substitute is accepted.
- The test must fail when browser zoom cannot be applied or independently observed.
- Root `font-size` remains at its pre-zoom value.
- Existing API requests, navigation callbacks, accessible names and route ownership remain unchanged.
- The canonical Word Detail route retains one unambiguous visible primary practice action after responsive reflow.
- No existing visual baseline is updated unless a separately reviewed visual change becomes unavoidable.
- The extension is local test infrastructure only and is never bundled into the production application.

## Acceptance criteria

- A Chromium persistent context loads the exact local extension and exposes its service worker.
- The target application tab is selected by exact canonical URL semantics, not active-tab ordering alone.
- `chrome.tabs.getZoom(tabId)` reports `2` after `setZoom`.
- CDP `cssVisualViewport.zoom` reports `2` within a narrow browser-serialization tolerance.
- The CSS layout viewport is approximately half the unzoomed width while root font size remains unchanged.
- Word Detail switches to its single-column responsive contract and `.lx-word-detail-knowledge` is no longer sticky.
- Route header controls do not overlap; the term, pronunciation control, meaning, all related phrases, primary practice action and knowledge content are visible and horizontally contained.
- Back, pronunciation, each related phrase and the primary practice control expose visible keyboard focus and remain enabled where applicable.
- Document and body widths do not exceed the zoomed CSS viewport.
- No runtime page errors occur.
- The new audit is executed by required CI and the final developer-authored head passes the full product matrix.

## Required checks

- Source inspection proving no CSS/device-scale substitute.
- `npm run lint`
- `npm run typecheck`
- Relevant Vitest/source contracts.
- Targeted Chromium browser-zoom spec with one worker.
- Existing Word Detail visual/reflow and touch-target suites.
- Full required CI, review-thread audit and expected-head squash merge.
- Exact-SHA main CI and exact-image stage/public validation when product files change; test-only delivery follows the repository's validated full-CI and post-merge policy.

## Risks

- New headless Chromium extension behavior may differ from the ordinary temporary-context matrix.
- Browser zoom can reset on navigation; the audit must apply it only after the canonical route is loaded.
- Extension tab discovery can become ambiguous without exact URL matching.
- A real zoom breakpoint may reveal production clipping or duplicate visible actions that root-text tests did not exercise.

## Rollback

Revert the focused audit commit and its package script entry. If production CSS is changed, revert only the route-scoped declaration together with the regression assertion that required it; no data or API rollback is needed.
