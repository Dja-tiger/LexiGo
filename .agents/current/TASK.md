# Current Task

## Identity

- Issue: #74 — увеличить мелкие touch targets и mobile labels
- Branch: `fix/issue-74-learn-option-targets`
- Base SHA: `b42f540f240883cfd4b23ce6e248512ac1f21316`
- Head SHA: resolve from live branch ref
- PR: #393

## Objective

Guarantee a minimum 44px fine-pointer and 48px coarse-pointer effective target for every live mobile Lesson Composer mode, source and size radio option without changing approved painted geometry, roving-tabindex semantics or lesson composition behavior.

## Scope

- expanded `/learn` mobile `Режим обучения` radiogroup;
- expanded `/learn` mobile `Раздел обучения` radiogroup, including collection-card radio buttons;
- expanded `/learn` mobile `Размер урока` radiogroup;
- one route-scoped interaction-only CSS owner loaded after existing Lesson Composer presentation and disclosure target owners;
- source contract and Playwright geometry, perimeter hit-testing, spacing, focus, interaction and reflow proof in desktop Chromium, Android Chromium and iOS WebKit;
- blocking UI and accessibility command registration.

## Non-goals

- no redesign or visual-baseline update;
- no changes to disclosure controls, recommended/manual lesson start actions, preview content or sticky action layout;
- no state, API, URL, History, storage, session or lesson lifecycle changes;
- no mobile navigation label, zoom, enlarged-text or physical-device acceptance work;
- no dependency, compatibility or workflow changes.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/app/lesson-composer-option-touch-targets.css`
- `frontend/app/layout.tsx`
- `frontend/components/lesson-composer-option-touch-target-source.test.ts`
- `frontend/e2e/lesson-composer-option-touch-targets.spec.ts`
- `frontend/package.json`

## Prohibited paths

All repository paths not listed above, including `frontend/components/lexigo-learn-app.tsx`, `frontend/components/lesson-composer-progressive-shell.tsx`, `frontend/app/adaptive-lesson-composer.css`, visual snapshots, API/backend, deployment and workflow files.

## Runtime owners

- `LexigoLearnApp` owns radio state, roving tabindex, callbacks and preview/session behavior.
- `adaptive-lesson-composer.css` owns approved painted geometry and 6px option spacing.
- `lesson-composer-option-touch-targets.css` owns only invisible block-axis hit-surface expansion and touch-action semantics.
- global `accessibility-focus.css` remains the keyboard focus-ring owner.

## Documentation owners

- `.agents/current/**` records this atomic slice.
- Final verified outcome belongs in `.agents/PROJECT_STATE.md` through a post-merge reconciliation PR.

## Invariants

- all three radiogroups retain role/name, `aria-checked`, roving tabindex, keyboard direction and callbacks;
- painted height, width, border, background, radius, padding, typography, grid and 6px visual gaps remain unchanged;
- pseudo-element hit slop is transparent, borderless and shadowless;
- hit slop expands only on the block axis, so adjacent horizontal options never overlap;
- 44px painted controls expanded to 48px retain at least 2px effective separation across the existing 6px block gap;
- desktop presentation and mobile sticky lesson action remain unchanged.

## Acceptance criteria

- every visible radio in all three live mobile radiogroups is located through the accessibility tree;
- effective target height is at least 44px for fine pointer and 48px for coarse pointer;
- all four perimeter hit-test points resolve to the owning radio button after deterministic viewport centering;
- target rectangles within each radiogroup do not overlap;
- selected radio focus-visible remains owned by the existing global focus layer;
- clicking one alternate option in each group updates `aria-checked` without changing ownership semantics;
- compact viewport has no horizontal overflow;
- source contract, focused browser matrix and full required CI pass on the final developer-authored head.

## Required checks

- Agent Harness source/secret/relative-link checks;
- frontend lint, typecheck, unit/source contracts and production build;
- focused Playwright proof in desktop Chromium, Android Chromium and iOS WebKit;
- full required UI, accessibility, axe, responsive, PWA, visual, performance, CSP/security, container and dependency gates selected by authoritative CI;
- immutable-head PR CI, expected-head squash merge, main CI and exact-image stage/public validation.

## Risks

- block-axis hit slop could overlap a vertically adjacent source option if computed spacing differs from the 6px owner;
- fixed mobile navigation or sticky submit chrome could intercept viewport-edge perimeter probes;
- collection cards may have natural heights above 48px and must be measured as native-plus-pseudo unions rather than forced to 48px;
- roving-tabindex focus proof must target the currently selected radio rather than assume every radio is tabbable.

## Rollback

Remove the dedicated stylesheet, its import, source/browser contracts and package-script registrations. No data migration, API rollback or state cleanup is required.
