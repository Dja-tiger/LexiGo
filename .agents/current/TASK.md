# Current Task

## Identity

- Issue: #460 — [Medium][Accessibility] Увеличить touch targets на странице Профиля
- Branch: `feat/issue-460-profile-touch-targets`
- Base SHA: `61059b3322791dcf813a313bbbec6c65011eca80`
- Head SHA: resolve from live branch ref
- PR: not opened yet

## Objective

Close the residual Profile accessibility gap from Issue #74 without redesigning Profile: preserve the approved painted geometry while guaranteeing independent 44 x 44 CSS px effective targets for fine pointers and 48 x 48 CSS px effective targets for coarse pointers, with real `elementFromPoint` evidence across desktop Chromium, Android Chromium and iOS WebKit.

## Scope

- Add one Profile-specific interaction-only CSS owner loaded after `profile.css`.
- Expand effective hit areas for `.lx-profile-secondary-button`, `.lx-profile-goal-option` and `.lx-profile-appearance-option` without changing their painted dimensions.
- Protect non-overlap, transparent pseudo-element ownership and import order with a source contract.
- Add cross-browser real-hit E2E coverage for desktop Chromium, Android Chromium and iOS WebKit.
- Reuse existing Profile reflow/forced-colors contracts and explicitly verify no horizontal overflow at compact width / 200% text size where relevant.
- Add the new browser proof to blocking UI and accessibility commands.

## Non-goals

- Redesign Profile or change Figma-owned typography, spacing, colors, borders or layout.
- Change Profile business logic, API calls, account/security semantics, navigation or radio-group keyboard semantics.
- Modify shared touch-target owners outside `/profile`.
- Expand Issue #74 or perform physical-device manual QA from #461.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/app/layout.tsx`
- `frontend/app/profile-touch-targets.css` (new)
- `frontend/components/profile-touch-target-source.test.ts` (new)
- `frontend/e2e/profile-touch-targets.spec.ts` (new)
- `frontend/package.json`

## Prohibited paths

- `backend/**`
- `deploy/**`
- `.github/workflows/**`
- `frontend/components/lexigo-profile-app.tsx`
- `frontend/app/profile.css`
- existing Figma/presentation CSS owners except the layout import list
- dependency lockfiles unless a required tool unexpectedly changes them (not expected)

## Runtime owners

- Painted Profile presentation: `frontend/app/profile.css` — read-only for this slice.
- Authenticated Profile semantics/business logic: `frontend/components/lexigo-profile-app.tsx` — read-only for this slice.
- Effective Profile hit-area ownership: `frontend/app/profile-touch-targets.css` — new interaction-only owner.
- Global CSS import ordering: `frontend/app/layout.tsx`.

## Documentation owners

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- durable delivery state is reconciled only after successful merge/Stage.

## Invariants

- The visual `getBoundingClientRect()` dimensions of Profile controls remain owned by `profile.css`; the new layer must not set painted height, width, padding, border, background, color, typography, transform or box-shadow on the live control.
- Expansion uses a transparent, borderless, shadowless pseudo-element with `pointer-events: auto` and no visual/focus styling.
- Fine-pointer effective dimensions are at least 44 x 44 CSS px; coarse-pointer effective dimensions are at least 48 x 48 CSS px.
- Neighboring effective targets do not intersect.
- Existing keyboard roving focus, disabled behavior and focus-visible semantics remain unchanged.
- Forced-colors mode remains operable and no horizontal overflow is introduced.
- The new E2E proof must be collected by both blocking `test:e2e:ui` and `test:e2e:a11y` commands.

## Acceptance criteria

- [ ] Every live `.lx-profile-secondary-button`, `.lx-profile-goal-option` and `.lx-profile-appearance-option` meets 44 x 44 fine-pointer effective target minimum.
- [ ] The same controls meet 48 x 48 coarse-pointer effective target minimum.
- [ ] Painted geometry, typography, spacing, colors and border geometry remain unchanged.
- [ ] Neighboring effective targets do not intersect.
- [ ] Keyboard/focus-visible semantics are preserved.
- [ ] Real-hit proof uses `document.elementFromPoint` on all four target sides.
- [ ] Desktop Chromium, Android Chromium and iOS WebKit coverage passes.
- [ ] 320px / 200% reflow, forced colors and horizontal overflow remain covered and pass.
- [ ] Source ownership contract protects import order and paint-inert expansion.
- [ ] Immutable-head CI, squash merge, exact-SHA `main` CI and Stage/public smoke pass before Issue #460 is closed.

## Required checks

- frontend lint and typecheck
- frontend unit/source-contract tests
- production build
- `test:e2e:ui`
- `test:e2e:a11y`
- cross-browser Profile touch-target proof in desktop Chromium / Android Chromium / iOS WebKit
- existing Profile reflow / forced-colors coverage
- full immutable-head CI matrix selected by repository scope classifier
- review/thread gate
- exact-SHA `main` CI
- exact-image Stage deploy, public HTTP smoke and public browser smoke

## Risks

- Horizontal pseudo expansion can overlap neighboring radio options when the visual gap is smaller than the missing target width.
- A blanket block-axis expansion is insufficient for narrow goal/appearance pills; the contract must expand both axes only when needed and prove non-overlap.
- Pseudo-element geometry calculations must account for control borders consistently with the existing Issue #74 E2E helper.
- Global import order can accidentally allow later CSS to replace the interaction owner.

## Rollback

Revert the Issue #460 product commit/PR. Because the implementation is an isolated Profile interaction-only CSS owner plus tests/import wiring, rollback removes that owner and returns to the previous painted Profile without data/schema changes.
