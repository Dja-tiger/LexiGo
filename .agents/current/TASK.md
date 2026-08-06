# Current Task

## Identity

- Issue: #74 — Increase small touch targets and mobile labels
- Branch: `test/issue-74-learn-browser-zoom`
- Base SHA: `4223ecacc7c2e6942cbd5449ecb9684915954b37`
- Head SHA: resolve from live branch ref
- PR: #421

## Objective

Add a fail-closed, route-bounded audit proving that canonical authenticated Lesson Composer (`/learn`) remains usable at true browser-owned 200% zoom. Reuse the established extension/CDP evidence boundary and verify both the collapsed recommendation and expanded manual-composer states. Do not change product presentation unless authoritative evidence identifies a production defect.

## Scope

- Reuse `frontend/e2e/support/browser-zoom-extension/**` without changing it.
- Add one dedicated Playwright specification for canonical `/learn` at browser-owned 200% zoom.
- Verify independent zoom evidence, contracted CSS viewport, progressive mobile breakpoint activation, collapsed recommendation, expanded manual composer, horizontal containment, non-overlap, focus visibility, route chrome and runtime errors.
- Keep current Agent Harness records factual throughout delivery.

## Non-goals

- No redesign, copy, lesson lifecycle, recommendation, API, navigation, session, History, storage, Service Worker, dependency or workflow change.
- No touch-target remediation in this slice.
- No visual baseline update.
- No Dependabot PR handling.
- No physical-device acceptance claim.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/e2e/learn-browser-zoom.spec.ts`

## Prohibited paths

- `frontend/app/**`
- `frontend/components/**`
- `frontend/lib/**`
- `frontend/e2e/support/browser-zoom-extension/**`
- `backend/**`
- `api/**`
- `.github/workflows/**`
- dependency manifests and lockfiles
- deployment configuration
- `main`

## Runtime owners

- `frontend/components/lexigo-learn-app.tsx` remains the canonical `/learn` route owner.
- The existing Lesson Composer state owners retain recommendation, disclosure, selection, preview and lesson-start behavior.
- `frontend/components/routed-lexigo-app.tsx` remains the persistent route shell and navigation owner.
- `frontend/components/lexigo-bootstrapped-app.tsx` remains the session bootstrap owner.
- `frontend/e2e/support/browser-zoom-extension/**` remains the test-only browser zoom controller.
- The new specification owns only browser evidence and assertions.

## Documentation owners

- `.agents/current/**` records this temporary atomic slice.
- `.agents/PROJECT_STATE.md` remains unchanged until product delivery is merged and stage evidence is available.

## Invariants

- Canonical Lesson Composer accessible names, recommendation logic, disclosure callbacks, selection payload, lesson lifecycle, navigation, History and storage remain unchanged.
- Root font size is not used to simulate browser zoom.
- Zoom is applied with browser-owned `chrome.tabs.setZoom` and independently confirmed through CDP `cssVisualViewport.zoom`.
- The exact target tab is selected by full URL; ambiguous ownership fails the test.
- Existing visual baselines remain byte-for-byte unchanged.

## Acceptance criteria

1. Browser zoom reports `2` through both the extension controller and CDP.
2. Root font size remains unchanged while the CSS layout viewport contracts from 1440px to approximately 720px.
3. Canonical authenticated `/learn` activates its progressive compact breakpoint: recommendation visible, manual composer initially hidden and route rail unobstructed.
4. The collapsed recommendation, metrics, selected-parameter summary and both recommendation actions remain horizontally contained, enabled and visibly focusable.
5. `Настроить урок` expands the manual composer without overflow or overlap; mode, source and lesson-size groups plus the canonical `Начать урок` action remain usable.
6. Responsive grid ownership matches the compact contract: setup card block layout, source options single-column and control groups contained within the route viewport.
7. No page, console or unhandled runtime errors are produced.
8. Full required CI passes on the immutable developer-authored PR head.

## Required checks

- Agent Harness source contract and allowed-path compare.
- Frontend lint.
- TypeScript.
- Frontend unit/source contracts.
- Production build.
- Targeted `/learn` browser-owned zoom scenario in pinned Chromium.
- Full Chromium/WebKit/Android/iOS UI matrix.
- Accessibility, visual, PWA, security, performance and container gates selected by authoritative CI.
- Review-thread audit and expected-head squash merge.
- Exact-SHA post-merge main CI and repository-required stage/public validation.

## Risks

- True 200% browser zoom may expose an existing disclosure, grid, overflow, sticky action or route-rail obstruction defect.
- Extension startup or target-tab ambiguity could invalidate evidence; the test must fail closed rather than fall back to CSS text enlargement.
- Lesson Composer async fixtures must stabilize preview and progress state before geometry assertions.

## Rollback

Revert the single test specification and current Agent Harness records. Product behavior is unchanged unless a separately reviewed remediation commit becomes necessary after evidence classifies a real defect.
