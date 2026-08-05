# Current Task

## Identity

- Issue: #74
- Branch: `agent/issue-74-word-detail-back-target`
- Base SHA: `ecbb16dd42cd0567f3a9c760f2ea938aede8bb6b`
- Head SHA: current branch ref; final immutable-head CI pending after the evidence commit
- PR: #411 (Draft)

## Objective

Guarantee a minimum 44 CSS px fine-pointer and 48 CSS px coarse-pointer effective target for the canonical Word Detail Back action on `/words/[id]` without changing its painted 42px geometry, accessible name, callback, History behavior or approved visual presentation.

## Scope

- Add one route-scoped interaction-only CSS owner for `.lx-word-detail-back`.
- Expand only the block-axis event surface; retain the existing inline size and visible geometry.
- Add fail-closed source ownership and cross-browser geometry/interaction regression contracts.
- Register the browser proof in the blocking UI and accessibility commands.
- Maintain factual task execution records in `.agents/current/**`.

## Non-goals

- No remediation of related-phrase chips, retry actions, speech controls or other Issue #74 targets.
- No Word Detail redesign, typography, spacing, focus-ring, color, route, API, History or storage changes.
- No visual baseline update.
- No 200% whole-application or physical-device Issue #74 closure claim.
- No dependency or Dependabot work.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/app/layout.tsx`
- `frontend/app/word-detail-back-touch-targets.css`
- `frontend/components/word-detail-back-touch-target-source.test.ts`
- `frontend/e2e/word-detail-back-touch-targets.spec.ts`
- `frontend/package.json`

## Prohibited paths

- Backend, API, migrations and deployment configuration.
- Existing Word Detail runtime/presentation owners, including `frontend/components/word-detail-presentation.tsx`, `frontend/components/lexigo-dictionary-app.tsx` and `frontend/app/word-detail.css`.
- Existing visual snapshots and content-addressed baseline metadata.
- Dependabot branches and PRs #304, #305 and #403.

## Runtime owners

- Route/state/API/History owner: `frontend/components/lexigo-dictionary-app.tsx`.
- Semantic action and callback owner: `frontend/components/word-detail-presentation.tsx`.
- Painted geometry, focus and responsive presentation owner: `frontend/app/word-detail.css`.
- Interaction-only owner: `frontend/app/word-detail-back-touch-targets.css`.
- Blocking browser proof: `frontend/e2e/word-detail-back-touch-targets.spec.ts`.

## Documentation owners

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Invariants

- The Back action remains a native button and invokes the existing `onBack` callback.
- Desktop accessible name remains `Словарь`; compact accessible name remains `Слово`.
- Painted border box remains 42px high and keeps existing color, padding, typography and focus styling.
- Expanded event surface is transparent, has no border or shadow, and does not expand inline toward the status chip.
- The target remains inside the Word Detail route section, clears the following layout, does not overlap the status chip and creates no horizontal overflow.
- Direct entry, loading/error/ready states, Back/Forward and Dictionary scroll restoration remain unchanged.

## Acceptance criteria

- Fine-pointer effective target height is at least 44px.
- Coarse-pointer effective target height is at least 48px.
- Effective target width remains at least the applicable minimum through the existing painted width.
- Top, right, bottom and left perimeter points resolve to the Back button.
- The target remains inside the Word Detail section, clears route content and has no overlap with the status chip.
- Keyboard focus remains visibly owned by the existing Word Detail presentation.
- Clicking the action returns to the URL-backed Dictionary results state.
- Desktop Chromium, Android Chromium and iOS WebKit pass at desktop, 390px and 320px widths without horizontal overflow.
- Existing Word Detail visual baselines pass without updates.

## Required checks

- New source contract through `npm test` / Vitest.
- Frontend lint and TypeScript.
- Production build and dependency audit.
- Targeted Playwright in desktop Chromium, Android Chromium and iOS WebKit.
- Blocking `test:e2e:ui` and `test:e2e:a11y` registration.
- Accessibility, visual, performance, CSP/PWA, backend and container gates.
- Full authoritative CI on the final developer-authored head.
- Expected-head squash merge, exact-SHA main CI and exact-image stage/public validation.

## Risks

- A symmetric pseudo-element could intercept neighboring controls; prevention is block-axis-only expansion with zero inline expansion.
- Pseudo-element geometry can serialize differently across Chromium/WebKit; tests derive the effective rectangle from computed styles with bounded tolerance.
- The compact accessible name differs from desktop; tests select the exact live name for each viewport.

## Rollback

Remove the new stylesheet import, interaction stylesheet, source contract, browser spec and command registrations. No runtime data, API or migration rollback is required.
