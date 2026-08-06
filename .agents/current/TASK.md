# Current Task

## Identity

- Issue: #74 — Increase small touch targets and mobile labels
- Branch: `test/issue-74-active-lesson-browser-zoom`
- Base SHA: `9085cc1f886c1d4d8119ef6d9b98291d1bf76309`
- Head SHA: resolve from live branch ref
- PR:

## Objective

Add a fail-closed, route-bounded audit proving that canonical authenticated Active Lesson (`/lesson/active`) remains usable at true browser-owned 200% zoom through its Recall prompt, answer-reveal and saved-feedback states. Reuse the established extension/CDP evidence boundary and the canonical Active Lesson fixture. Do not change product presentation unless authoritative evidence identifies a production defect.

## Scope

- Reuse `frontend/e2e/support/browser-zoom-extension/**` without changing it.
- Reuse `frontend/e2e/support/active-lesson-fixture.ts` without changing it.
- Add one dedicated Playwright specification for canonical Recall `/lesson/active` at browser-owned 200% zoom.
- Verify independent zoom evidence, contracted CSS viewport, mobile Active Lesson breakpoint activation, prompt and feedback geometry, horizontal containment, non-overlap, focus visibility, route chrome and runtime errors.
- Preserve the exact server review contract while proving the zoomed interaction remains functional.
- Keep current Agent Harness records factual throughout delivery.

## Non-goals

- No redesign, copy, lesson lifecycle, answer judgement, API, navigation, session, History, storage, Service Worker, dependency or workflow change.
- No touch-target remediation in this slice.
- No visual baseline update.
- No changes to the existing CSS-zoom compatibility test.
- No Dependabot PR handling.
- No physical-device acceptance claim.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/e2e/active-lesson-browser-zoom.spec.ts`

## Prohibited paths

- `frontend/app/**`
- `frontend/components/**`
- `frontend/lib/**`
- `frontend/e2e/support/browser-zoom-extension/**`
- `frontend/e2e/support/active-lesson-fixture.ts`
- `backend/**`
- `api/**`
- `.github/workflows/**`
- dependency manifests and lockfiles
- deployment configuration
- `main`

## Runtime owners

- `frontend/components/active-lesson-presentation.tsx` remains the canonical Active Lesson presentation owner.
- The existing Active Lesson controller retains session, review, answer judgement, progression, safe-exit and navigation behavior.
- `frontend/app/active-lesson.css` remains the responsive presentation owner.
- `frontend/e2e/support/active-lesson-fixture.ts` remains the deterministic Active Lesson API/session fixture.
- `frontend/e2e/support/browser-zoom-extension/**` remains the test-only browser zoom controller.
- The new specification owns only browser evidence and assertions.

## Documentation owners

- `.agents/current/**` records this temporary atomic slice.
- `.agents/PROJECT_STATE.md` remains unchanged until product delivery is merged and stage evidence is available.

## Invariants

- Canonical Active Lesson accessible names, Recall interaction, review payload, answer judgement, progression, safe exit, navigation, History and storage remain unchanged.
- Root font size or CSS `zoom` is not used to simulate browser zoom.
- Zoom is applied with browser-owned `chrome.tabs.setZoom` and independently confirmed through CDP `cssVisualViewport.zoom`.
- The exact target tab is selected by full URL; ambiguous ownership fails the test.
- Existing visual baselines remain byte-for-byte unchanged.

## Acceptance criteria

1. Browser zoom reports `2` through both the extension controller and CDP.
2. Root font size remains unchanged while the CSS layout viewport contracts from 1440px to approximately 720px.
3. Canonical authenticated Recall `/lesson/active` activates its mobile presentation: mobile Back/Close visible, desktop brand/saved/close hidden and workspace unobstructed.
4. Progress, card, prompt, answer field, reveal/check actions and confidence controls remain horizontally contained and non-overlapping.
5. Responsive ownership matches the compact contract: progress row becomes block layout and answer actions become one column.
6. Answer entry and reveal remain keyboard-operable with visible focus; the feedback state remains contained and focused.
7. Saving `Знал` preserves the canonical review payload and produces the enabled `Дальше` state without overflow.
8. No page, console or unhandled runtime errors are produced.
9. Full required CI passes on the immutable developer-authored PR head.

## Required checks

- Agent Harness source contract and allowed-path compare.
- Frontend lint.
- TypeScript.
- Frontend unit/source contracts.
- Production build.
- Targeted Active Lesson browser-owned zoom scenario in pinned Chromium.
- Full Chromium/WebKit/Android/iOS UI matrix.
- Accessibility, visual, PWA, security, performance and container gates selected by authoritative CI.
- Review-thread audit and expected-head squash merge.
- Exact-SHA post-merge main CI and repository-required stage/public validation.

## Risks

- True 200% browser zoom may expose an existing topbar, prompt, action-grid, feedback, confidence or focus defect.
- Extension startup or target-tab ambiguity could invalidate evidence; the test must fail closed rather than fall back to CSS enlargement.
- Active Lesson bootstrapping and review submission must stabilize before geometry assertions.
- Focus assertions must distinguish native input box-shadow from the shared outline contract without weakening evidence.

## Rollback

Revert the single test specification and current Agent Harness records. Product behavior is unchanged unless a separately reviewed remediation commit becomes necessary after evidence classifies a real defect.
