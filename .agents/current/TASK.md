# Current Task

## Identity

- Issue: #74
- Branch: `fix/issue-74-header-streak-target`
- Base SHA: `e46881b9fc9def630343e3ee69425492bc0aefe7`
- Head SHA: resolve from live branch ref
- PR: #395 (Draft)

## Objective

Guarantee a minimum 44px fine-pointer and 48px coarse-pointer target for every confirmed live shared-header streak button. Preserve navigation, focus, responsive hiding and painted output while keeping reminder, streak and profile targets independently operable.

## Scope

- exact interaction owner for `button.lx-streak`;
- real 44/48px streak border box, without a streak pseudo-element;
- reminder pointer surface shifted 16px left on 720–1099px layouts where its label is hidden;
- reminder pointer surface shifted 28px left from 1100px where the visible label makes the fixed control wider;
- border-aware offsets that retain the reminder target’s outer dimensions;
- disable stale pointer ownership on the fixed `<details>` and original summary box;
- keep the generated summary target and disclosed preview interactive;
- prove non-overlap with reminder and profile in desktop Chromium, Android Chromium and iOS WebKit;
- retain exact interactive-versus-decorative streak ownership.

## Non-goals

- no changes to streak data or Progress navigation callbacks;
- no changes to decorative Dictionary `span.lx-streak`;
- no changes to streak typography, icons, color or horizontal padding;
- no movement or repainting of the visible reminder card;
- no change to phone-width streak hiding;
- no visual baseline updates;
- no Issue #74 closure.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/app/calendar-reminder-entry.css`
- `frontend/app/header-streak-touch-targets.css`
- `frontend/app/layout.tsx`
- `frontend/components/header-streak-touch-target-source.test.ts`
- `frontend/e2e/header-streak-touch-targets.spec.ts`
- `frontend/package.json`

## Prohibited paths

- backend and database code;
- workflows and dependency manifests outside focused command registration;
- painted streak presentation owners;
- visible reminder-position changes;
- visual baselines;
- `.agents/PROJECT_STATE.md` before post-merge reconciliation.

## Runtime owners

- streak presentation: `frontend/app/premium-ui.css` and `frontend/app/adaptive-knowledge-coach-home.css`;
- streak target: `frontend/app/header-streak-touch-targets.css`;
- reminder presentation and pointer surface: `frontend/app/calendar-reminder-entry.css`;
- profile target: `frontend/app/header-profile-touch-targets.css`;
- route navigation: existing Home, Learn, Active Lesson and compatibility callbacks.

## Invariants

- painted header pixels remain stable;
- reminder, streak and profile target rectangles do not overlap;
- reminder target remains at least 44/48px and native disclosure remains operable;
- streak uses its real border box and no generated target;
- Dictionary streak remains decorative;
- phone hidden state, accessible names, focus-visible and `/progress` navigation remain unchanged;
- no horizontal overflow is introduced.

## Acceptance criteria

- streak border box is at least 44×44 fine and 48×48 coarse;
- all four streak perimeter points hit the button;
- reminder target remains fully hit-testable and opens/closes `<details>`;
- reminder-to-streak and streak-to-profile gaps are at least 1 CSS px;
- desktop, Android and iOS focused proof passes;
- visual regression passes without baseline changes;
- full authoritative CI passes on one immutable PR head.

## Required checks

- lint, TypeScript, Vitest, production build and dependency audit;
- full UI and accessibility matrices;
- visual regression;
- existing reminder disclosure coverage;
- all remaining repository product gates.

## Risks

- desktop and tablet reminder widths require different target translations;
- disabling ancestor pointer ownership must not disable the generated target or preview;
- broad streak selectors can capture the Dictionary span;
- later CSS owners can override minimum geometry.

## Rollback

Revert the atomic product merge. The previous presentation remains available because the slice changes only interaction geometry, source contracts and focused tests.