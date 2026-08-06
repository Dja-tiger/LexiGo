# Current Task

## Identity

- Issue: #74 — Increase small touch targets and mobile labels
- Branch: `test/issue-74-home-browser-zoom`
- Base SHA: `ce7db6538174fe9fc805e163abeedbe40c015d37`
- Head SHA: resolve from live branch ref
- PR: pending

## Objective

Add a fail-closed, route-bounded audit proving that canonical authenticated Home (`/`) remains usable at true browser-owned 200% zoom. Use the browser extension and CDP evidence already established by the completed Word Detail slice. Do not change product presentation unless authoritative evidence identifies a production defect.

## Scope

- Reuse `frontend/e2e/support/browser-zoom-extension/**` without changing it.
- Add one dedicated Playwright specification for canonical Home at browser-owned 200% zoom.
- Verify independent zoom evidence, contracted CSS viewport, responsive Home layout, horizontal containment, non-overlap, focus visibility, primary actions and runtime errors.
- Keep current Agent Harness records factual throughout delivery.

## Non-goals

- No redesign, copy, navigation, session, API, History, storage, Service Worker, dependency or workflow change.
- No touch-target remediation in this slice.
- No visual baseline update.
- No Dependabot PR handling.
- No physical-device acceptance claim.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/e2e/home-browser-zoom.spec.ts`

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

- `frontend/components/lexigo-home-app.tsx` remains the canonical `/` route owner.
- `frontend/components/routed-lexigo-app.tsx` remains the persistent route shell and navigation owner.
- `frontend/components/lexigo-bootstrapped-app.tsx` remains the session bootstrap owner.
- `frontend/e2e/support/browser-zoom-extension/**` remains the test-only browser zoom controller.
- The new specification owns only browser evidence and assertions.

## Documentation owners

- `.agents/current/**` records this temporary atomic slice.
- `.agents/PROJECT_STATE.md` remains unchanged until product delivery is merged and stage evidence is available.

## Invariants

- Canonical Home route, accessible names, callbacks, session/bootstrap behavior, navigation, History and storage remain unchanged.
- Root font size is not used to simulate browser zoom.
- Zoom is applied with browser-owned `chrome.tabs.setZoom` and independently confirmed through CDP `cssVisualViewport.zoom`.
- The exact target tab is selected by full URL; ambiguous ownership fails the test.
- Existing visual baselines remain byte-for-byte unchanged.

## Acceptance criteria

1. Browser zoom reports `2` through both the extension controller and CDP.
2. The root font size remains unchanged while the CSS layout viewport contracts to approximately half width.
3. Canonical authenticated Home renders its next-best-action, progress surface, route navigation and profile controls.
4. Home responsive layout reflows without horizontal overflow, clipping or overlap.
5. Visible primary/secondary navigation and action controls remain enabled and keyboard-focusable with visible focus.
6. Route chrome does not obstruct Home content.
7. No page, console or unhandled runtime errors are produced.
8. Full required CI passes on the immutable developer-authored PR head.

## Required checks

- Agent Harness source contract and allowed-path compare.
- Frontend lint.
- TypeScript.
- Frontend unit/source contracts.
- Production build.
- Targeted Home browser-owned zoom scenario in pinned Chromium.
- Full Chromium/WebKit/Android/iOS UI matrix.
- Accessibility, visual, PWA, security, performance and container gates selected by authoritative CI.
- Review-thread audit and expected-head squash merge.
- Exact-SHA post-merge main CI and repository-required stage/public validation.

## Risks

- A true 200% browser zoom may expose an existing Home overflow, overlap, sticky obstruction or inaccessible focus defect.
- Extension startup or target-tab ambiguity could invalidate evidence; the test must fail closed rather than fall back to CSS text enlargement.
- Home async fixtures must reach a stable authenticated state before geometry assertions.

## Rollback

Revert the single test specification and current Agent Harness records. Product behavior is unchanged unless a separately reviewed remediation commit becomes necessary after evidence classifies a real defect.
