# Current Task Progress

## 2026-08-05 14:12 Europe/Moscow

### Verified

- live `main` and branch base remain `e46881b9fc9def630343e3ee69425492bc0aefe7`;
- Draft PR #395 remains the only active product slice; unrelated Dependabot PRs are outside scope;
- Home, Learn, Active Lesson and compatibility runtimes render interactive `button.lx-streak` controls that navigate to Progress;
- Dictionary renders a decorative `span.lx-streak` and remains excluded by the exact selector;
- the streak remains intentionally hidden below 720px on applicable route islands;
- the fixed reminder summary ends at `right: 150px`, while the live streak begins about 14px earlier in the tested desktop and 820px header layouts;
- CI artifacts and traces prove the reminder receives the left streak perimeter point in desktop Chromium, Android Chromium and iOS WebKit;
- an isolated Chromium proof confirmed that `pointer-events: none` on `<summary>` plus an explicitly interactive shifted `summary::before` retains native `<details>` toggling inside the generated target and excludes the old right-side overlap strip.

### Finding

The original block-axis streak pseudo-element was not sufficient. The visible controls already had a physical 14px overlap between the fixed reminder target and the streak's left edge. The pseudo-element also introduced deterministic desktop visual failures in states that include the shared header. The correct boundary is a real streak border box plus a pixel-stable shifted reminder pointer surface.

### Root cause

Two independently evolved header owners used incompatible geometry:

- `button.lx-streak` relied on text metrics plus `10px 11px` padding and had no guaranteed minimum border-box height;
- `.lx-route-reminder-entry` used a fixed `right: 150px` target that occupied the first approximately 14px of the streak button at widths where both controls are visible.

The initial test calculated a 44/48px streak pseudo target but CI correctly demonstrated that its left perimeter remained owned by the higher-z-index reminder.

### Changed files

- `.agents/current/TASK.md`;
- `.agents/current/PROGRESS.md`;
- `.agents/current/EXECUTION.md`;
- `frontend/app/calendar-reminder-entry.css`;
- `frontend/app/header-streak-touch-targets.css`;
- `frontend/app/layout.tsx`;
- `frontend/components/header-streak-touch-target-source.test.ts`;
- `frontend/e2e/header-streak-touch-targets.spec.ts`;
- `frontend/package.json`.

### Implementation now present

- streak owner uses `min-block-size` and `min-inline-size` from a 44px fine / 48px coarse token;
- the streak no longer creates `::before`, `position: relative` or stacking-sensitive hit slop;
- at `min-width: 720px`, the reminder summary keeps painted pixels stationary while its generated pointer surface moves 16px left using `inset-inline-start: -16px` and `inset-inline-end: 16px`;
- the summary remains keyboard-focusable and the generated surface preserves native disclosure clicks;
- the focused browser proof measures real streak/profile boxes and the shifted reminder surface, verifies both gaps, clicks the extended reminder edge, checks focus and navigates through the streak to `/progress`.

### Checks passed

- CI #2795/run `30998706501` passed classifier, backend unit/security/integration, frontend lint, TypeScript, all 98 Vitest files, production build, dependency audit, accessibility, performance, content security, service worker, PWA, dictionary smoke and lesson completion;
- the corrected source inventory and route-specific Progress navigation assertions passed in CI #2795;
- downloaded UI artifacts identified one deterministic focused-test failure per browser project rather than an unrelated suite failure;
- downloaded visual artifacts identified exactly two deterministic desktop screenshot failures on the pseudo-element implementation;
- standalone Chromium interaction proof passed for the shifted summary surface: extended left and center points toggle details, while the excluded right strip does not;
- every new write was made only on `fix/issue-74-header-streak-target`; `main` remains unchanged.

### Checks failed on superseded head `e070d3d0d4edbab3d3877a94329fa281ab5dbb5b`

- UI shard 1: desktop Chromium left streak perimeter point resolved outside the button;
- UI shard 2: Android Chromium and iOS WebKit failed the identical left-perimeter assertion;
- visual regression: lesson composer desktop and offline dark desktop hashes changed under the generated streak pseudo-element;
- all failures are addressed by replacing the streak pseudo-element and shifting the reminder interaction surface; no baseline update is planned.

### Current branch head

- product/test implementation before Agent record updates: `b5304f8b6adcaf2d6d653776c9cff3657b66ef2a`;
- resolve the current immutable head from the live branch after this record commit.

### Next action

Read back all changed owners, compare the complete branch against current `main`, and run a new authoritative CI on the resulting immutable head. Continue only after frontend core, focused cross-browser proof, existing reminder tests, visual regression and the remaining product matrix are green.