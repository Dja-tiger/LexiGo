# Current Task

## Identity

- Issue: #74
- Branch: `fix/issue-74-header-streak-target`
- Base SHA: `e46881b9fc9def630343e3ee69425492bc0aefe7`
- Head SHA: resolve from live branch ref
- PR: #395 (Draft)

## Objective

Guarantee a minimum 44px fine-pointer and 48px coarse-pointer target for every confirmed live shared header streak button, while preserving painted pixels, navigation, focus behavior and intentional phone-width hiding. Keep the adjacent fixed reminder and profile targets independently operable without overlap.

## Scope

- keep one exact interaction owner for `button.lx-streak`;
- use a real minimum border box instead of a generated streak pseudo-element;
- shift only the reminder summary's invisible pointer surface 16px left at widths where the streak is visible;
- preserve the reminder's painted card position and native `<details>/<summary>` disclosure behavior;
- account for the reminder's 1px border so the shifted surface retains its full outer target dimensions;
- prove separation from both adjacent reminder and profile targets;
- retain exact source ownership that distinguishes interactive buttons from the decorative Dictionary streak span;
- run desktop Chromium, Android Chromium and iOS WebKit geometry, hit-testing, focus, disclosure and navigation proof;
- keep the focused proof registered in blocking UI and accessibility commands.

## Non-goals

- no changes to streak data, progress loading or navigation ownership;
- no changes to the decorative Dictionary `span.lx-streak`;
- no changes to streak typography, icons, color or horizontal padding;
- no movement or repainting of the visible reminder card;
- no change to the intentional `max-width: 719px` phone-width hiding contract;
- no changes to profile, Lesson Composer, mobile navigation, enlarged-text or 200% zoom owners;
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
- workflow and dependency manifests other than the focused `frontend/package.json` command registration;
- painted streak presentation owners;
- reminder component behavior or visible-position owners outside its interaction surface;
- visual baselines;
- `.agents/PROJECT_STATE.md` before post-merge reconciliation.

## Runtime owners

- live streak buttons: Home, Learn, Active Lesson and compatibility route runtimes;
- decorative non-interactive streak: Dictionary route runtime, explicitly excluded;
- streak presentation: `frontend/app/premium-ui.css` and `frontend/app/adaptive-knowledge-coach-home.css`;
- streak minimum target: `frontend/app/header-streak-touch-targets.css`;
- adjacent reminder presentation and shifted pointer surface: `frontend/app/calendar-reminder-entry.css`;
- adjacent profile hit surface: `frontend/app/header-profile-touch-targets.css`;
- navigation callback: each interactive route runtime's existing Progress navigation handler.

## Documentation owners

- active task evidence: `.agents/current/**`;
- durable completion evidence: `.agents/PROJECT_STATE.md` in a separate post-deployment reconciliation slice.

## Invariants

- visible streak content, reminder card and header spacing remain pixel-stable;
- the streak uses its real border box and no generated hit-slop pseudo-element;
- the reminder's invisible target remains at least 44/48px and shifts left without moving painted content;
- reminder, streak and profile effective targets do not overlap;
- the Dictionary streak remains a non-interactive span;
- the phone-width hidden state remains hidden;
- role, accessible name, focus-visible and Progress navigation remain unchanged;
- native reminder disclosure remains operable from its shifted target;
- no horizontal overflow is introduced.

## Acceptance criteria

- fine-pointer streak border-box height and width are at least 44px;
- coarse-pointer streak border-box height and width are at least 48px;
- all four streak border-box perimeter points resolve to the button;
- the streak has no generated `::before` hit surface;
- the shifted reminder target remains at least 44/48px, fully hit-testable and opens/closes the native details element;
- reminder-to-streak and streak-to-profile target gaps are at least 1 CSS pixel;
- keyboard focus-visible remains owned by the global focus layer;
- activating the streak target still navigates to `/progress`;
- the decorative Dictionary `span.lx-streak` is not captured;
- Chromium, Android Chromium and iOS WebKit focused proof passes;
- visual regression passes without baseline changes;
- full authoritative CI passes on an immutable PR head.

## Required checks

- frontend lint;
- TypeScript;
- Vitest source contract and full unit suite;
- production build and dependency audit;
- blocking UI and accessibility browser matrices;
- visual regression without baseline changes;
- existing reminder disclosure tests;
- remaining repository product gates required by authoritative CI.

## Risks

- disabling the summary's native pointer box must be offset by the generated surface in every supported browser;
- a shifted reminder surface can overlap another left-side action if its offset expands beyond the measured 16px;
- a phone-width test can target an intentionally hidden streak and create false ownership;
- broad `.lx-streak` selectors can capture the decorative Dictionary span;
- CSS import ordering can allow later layers to override minimum geometry.

## Rollback

Revert the atomic product merge. The previous streak and reminder presentation remains available because this slice changes only minimum interaction geometry, a transparent shifted reminder surface, source contracts and focused tests.