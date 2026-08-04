# Current Task

## Identity

- Issue: #74 — увеличить мелкие touch targets и mobile labels
- Branch: `fix/issue-74-learn-composer-disclosure-targets`
- Base SHA: `6a8c885a6a7950c25cada8374b2d71dcf253b34e`
- Head SHA: resolve from live branch ref
- PR: #391

## Objective

Guarantee a minimum 44px fine-pointer and 48px coarse-pointer hit surface for the two mutually exclusive mobile Lesson Composer disclosure controls without changing their approved painted geometry or disclosure behavior.

## Scope

- live `/learn` mobile collapsed action `Настроить урок`;
- live `/learn` mobile expanded summary `Ручная настройка`;
- one route-scoped touch-target CSS owner loaded after existing Lesson Composer presentation owners;
- source contract and Playwright geometry/hit-testing/focus proof in desktop Chromium, Android Chromium and iOS WebKit;
- blocking UI and accessibility command registration.

## Non-goals

- no redesign or visual-baseline update;
- no changes to lesson preview/create/resume/discard behavior;
- no state, API, URL, History, storage or session changes;
- no remediation of mode/source/size controls, header actions, bottom navigation labels or other Issue #74 routes;
- no compatibility cleanup or dependency updates.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/app/lesson-composer-disclosure-touch-targets.css`
- `frontend/app/layout.tsx`
- `frontend/components/lesson-composer-disclosure-touch-target-source.test.ts`
- `frontend/e2e/lesson-composer-disclosure-touch-targets.spec.ts`
- `frontend/package.json`

## Prohibited paths

All repository paths not listed above, including `frontend/components/lesson-composer-progressive-shell.tsx`, `frontend/components/lexigo-learn-app.tsx`, `frontend/app/adaptive-lesson-composer.css`, visual snapshots, API/backend, deployment and workflow files.

## Runtime owners

- `LessonComposerProgressiveShell` owns disclosure state and accessible button semantics.
- `adaptive-lesson-composer.css` owns approved painted presentation.
- `lesson-composer-disclosure-touch-targets.css` owns only invisible hit-surface expansion and touch-action semantics.
- global `accessibility-focus.css` remains the keyboard focus-ring owner.

## Documentation owners

- `.agents/current/**` records this atomic slice.
- Final verified outcome belongs in `.agents/PROJECT_STATE.md` through a post-merge reconciliation PR.

## Invariants

- collapsed and expanded disclosure controls remain mutually exclusive;
- accessible names, `aria-expanded`, `aria-controls` and toggle behavior remain unchanged;
- painted dimensions, border, background, radius, spacing and typography remain unchanged;
- pseudo-element hit slop is transparent, borderless and shadowless;
- expanded hit areas do not overlap adjacent interactive controls or create horizontal overflow;
- desktop Lesson Composer presentation remains unchanged.

## Acceptance criteria

- both live disclosure states are located through the accessibility tree;
- effective target height is at least 44px for fine pointer and 48px for coarse pointer;
- all four perimeter hit-test points resolve to the owning button;
- collapsed painted geometry remains the current runtime geometry and expanded summary remains at least its approved 58px height;
- focus-visible remains provided by the existing global owner;
- no horizontal overflow or target overlap at compact viewport;
- source contract, targeted browser matrix and full required CI pass on the final developer-authored head.

## Required checks

- Agent Harness source/secret/relative-link checks;
- frontend lint, typecheck, unit/source contracts and production build;
- focused Playwright proof in desktop Chromium, Android Chromium and iOS WebKit;
- full required UI, accessibility, axe, responsive, PWA, visual, performance, CSP/security, container and dependency gates selected by authoritative CI;
- immutable-head PR CI, expected-head squash merge, main CI and exact-image stage/public validation.

## Risks

- pseudo-element stacking could make hit testing resolve to a neighbor;
- vertical expansion could overlap the next card or manual controls;
- an import-order mistake could let another stylesheet replace the narrow owner;
- browser projects may emulate viewport without coarse pointer, so expected size must use runtime `matchMedia` rather than project-name assumptions.

## Rollback

Remove the dedicated stylesheet, its import, source/browser contracts and package-script registrations. No data migration, API rollback or state cleanup is required.
