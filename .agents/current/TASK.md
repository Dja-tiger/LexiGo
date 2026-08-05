# Current Task

## Identity

- Issue: #74
- Branch: `fix/issue-74-learn-resume-action-targets`
- Base SHA: `78e3c18af88d86fbdfb6ee1f9d1a7dad0f006372`
- Head SHA: resolve from the live branch ref after the final evidence commit
- PR: #402

## Objective

Guarantee minimum fine-pointer and coarse-pointer event surfaces for the live `/learn` unfinished-lesson actions `Сбросить` and `Продолжить урок` without changing their painted presentation or lesson lifecycle.

## Scope

- Confirm the conditional resume strip is a live authenticated `/learn` runtime owner.
- Add one narrow interaction-only CSS owner for both resume actions.
- Preserve the existing 44px painted minimum while guaranteeing a 48px coarse-pointer effective target.
- Prove exact accessible-name ownership, target geometry, perimeter hits, separation, keyboard focus and compact overflow in desktop Chromium, Android Chromium and iOS WebKit.
- Record source-level ownership and keep the browser proof in existing blocking UI/accessibility commands.

## Non-goals

- No change to recommended/manual start buttons, which already expose a 54px painted height.
- No change to Lesson Composer disclosure or radio-option controls completed by PRs #391 and #393.
- No redesign, visible size change, spacing change, copy change or visual-baseline update.
- No API, active-session, discard, navigation, History, storage, session or PWA change.
- No whole-application 200% browser zoom or physical-device acceptance in this slice.
- No Dependabot maintenance.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/app/layout.tsx`
- `frontend/app/lesson-composer-resume-touch-targets.css`
- `frontend/components/lesson-composer-resume-touch-target-source.test.ts`
- `frontend/e2e/lesson-composer-option-touch-targets.spec.ts`

## Prohibited paths

- Backend, API, migrations and deployment workflows.
- Lesson runtime handlers and navigation code.
- Existing visual snapshots.
- Existing completed touch-target owners except the shared browser geometry harness named above.
- Dependabot branches and dependency manifests.

## Runtime owners

- Conditional resume-strip runtime: `frontend/components/lexigo-learn-app.tsx`.
- Painted button geometry and resume layout: `frontend/app/premium-ui.css` and `frontend/app/adaptive-lesson-composer.css`.
- Event-surface owner: `frontend/app/lesson-composer-resume-touch-targets.css`.
- Global focus-visible owner: `frontend/app/accessibility-focus.css`.

## Documentation owners

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Invariants

- Exact accessible names remain `Сбросить` and `Продолжить урок`.
- Existing callbacks continue to call `discardActiveLesson` and `openLesson("lesson_start")`.
- Painted dimensions, 10px action gap, colors, borders, typography and responsive placement remain unchanged.
- Transparent hit expansion is block-axis-only and cannot overlap the adjacent action.
- Disabled and busy semantics remain unchanged.
- No CSS owner changes route, session, API, storage or History behavior.

## Acceptance criteria

- Both live resume actions have an effective height of at least 44 CSS px for fine pointer and 48 CSS px for coarse pointer.
- All four effective-target perimeter points resolve to the owning button.
- Effective target rectangles do not overlap.
- Visual border boxes and horizontal dimensions remain unchanged.
- Keyboard focus-visible remains present.
- Compact 320px and canonical 390px layouts have no horizontal overflow.
- Source contract and blocking browser proof pass without snapshot changes.

## Required checks

- Agent Harness routing validation.
- Focused Vitest source contract.
- Frontend lint and TypeScript.
- Targeted Playwright in desktop Chromium, Android Chromium and iOS WebKit.
- Full frontend unit, production build, UI/accessibility/browser matrix, axe, visual and performance gates.
- Full authoritative CI on the final developer-authored head.
- Exact-SHA main CI and exact-image stage/public validation after merge.

## Risks

- Broad selectors could affect unrelated `.lx-resume-actions` consumers.
- Pseudo-element hit slop could overlap an adjacent target if inline expansion is introduced.
- A fixture that does not render an active lesson would test a hidden or absent control.
- CSS import order could let another owner override positioning or event-surface declarations.

## Rollback

Remove the dedicated stylesheet import, stylesheet, source contract and focused browser assertions. No data or API rollback is required.
