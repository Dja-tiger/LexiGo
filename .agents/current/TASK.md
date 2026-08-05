# Current Task

## Identity

- Issue: #74
- Branch: `fix/issue-74-header-streak-target`
- Base SHA: `e46881b9fc9def630343e3ee69425492bc0aefe7`
- Head SHA: resolve from live branch ref
- PR: Draft after the first coherent implementation commit

## Objective

Guarantee a minimum 44px fine-pointer and 48px coarse-pointer effective target for every confirmed live shared header streak button while preserving its painted geometry, navigation callback, focus behavior and intentional phone-width hiding.

## Scope

- add one interaction-only CSS owner for `button.lx-streak`;
- expand only the block-axis event surface because the painted control is already wider than the target minimum;
- preserve the adjacent profile target and prove the two effective regions do not overlap;
- add an exact source ownership contract;
- add focused desktop Chromium, Android Chromium and iOS WebKit geometry, hit-testing, focus and navigation proof;
- register the focused proof in blocking UI and accessibility commands.

## Non-goals

- no changes to streak data, progress loading or navigation ownership;
- no changes to painted padding, typography, icon, color or layout;
- no change to the intentional `max-width: 719px` phone-width hiding contract;
- no changes to profile, reminder, Lesson Composer, mobile navigation, enlarged-text or 200% zoom owners;
- no Issue #74 closure.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/app/header-streak-touch-targets.css`
- `frontend/app/layout.tsx`
- `frontend/components/header-streak-touch-target-source.test.ts`
- `frontend/e2e/header-streak-touch-targets.spec.ts`
- `frontend/package.json`

## Prohibited paths

- backend and database code;
- workflow and dependency manifests other than the focused `frontend/package.json` command registration;
- existing painted presentation owners;
- visual baselines;
- `.agents/PROJECT_STATE.md` before post-merge reconciliation.

## Runtime owners

- live streak buttons: Home, Learn, Dictionary, Active Lesson and compatibility route runtimes;
- streak presentation: `frontend/app/premium-ui.css` and `frontend/app/adaptive-knowledge-coach-home.css`;
- adjacent profile hit surface: `frontend/app/header-profile-touch-targets.css`;
- navigation callback: each route runtime's existing Progress navigation handler.

## Documentation owners

- active task evidence: `.agents/current/**`;
- durable completion evidence: `.agents/PROJECT_STATE.md` in a separate post-deployment reconciliation slice.

## Invariants

- visual geometry and spacing remain unchanged;
- inline hit expansion remains zero;
- the streak and profile effective target rectangles never overlap;
- the phone-width hidden state remains hidden;
- role, accessible name, focus-visible and Progress navigation remain unchanged;
- no horizontal overflow is introduced.

## Acceptance criteria

- fine-pointer effective height is at least 44px;
- coarse-pointer effective height is at least 48px;
- effective width remains the painted width and is at least the required minimum;
- all four target perimeter points resolve to the streak button;
- the transparent pseudo-element has no border, background or shadow;
- the adjacent profile target remains separated by at least 1 CSS pixel;
- keyboard focus-visible remains owned by the global focus layer;
- activating the expanded target still navigates to `/progress`;
- Chromium, Android Chromium and iOS WebKit focused proof passes;
- full authoritative CI passes on an immutable PR head.

## Required checks

- frontend lint;
- TypeScript;
- Vitest source contract and full unit suite;
- production build and dependency audit;
- blocking UI and accessibility browser matrices;
- visual regression without baseline changes;
- remaining repository product gates required by authoritative CI.

## Risks

- pseudo-element hit slop can overlap the adjacent profile target if inline expansion is introduced;
- a phone-width test can target an intentionally hidden control and create false ownership;
- broad `.lx-streak` selectors can capture non-button consumers if exact element ownership is lost;
- CSS import ordering can allow later layers to override interaction geometry.

## Rollback

Revert the atomic product merge. The prior painted streak geometry and navigation behavior remain unchanged because this slice adds only a dedicated interaction layer, source contract and focused tests.