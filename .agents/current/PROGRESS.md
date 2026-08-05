# Current Task Progress

## 2026-08-05 14:40 Europe/Moscow

### Verified

- live `main` and branch base remain `e46881b9fc9def630343e3ee69425492bc0aefe7`;
- Draft PR #395 remains the active Issue #74 product slice;
- Home, Learn, Active Lesson and compatibility runtimes render interactive `button.lx-streak` controls that navigate to Progress;
- Dictionary renders a decorative `span.lx-streak` and remains excluded;
- the streak remains intentionally hidden below 720px on applicable route islands;
- CI #2811/run `31001271804` executed on exact head `0fc9d55075b43711db508ef76b73acbc4633b575`;
- classifier, backend unit/security/integration, frontend lint, TypeScript, all 98 Vitest files, production build, dependency audit, accessibility, performance, content security, service worker, PWA, dictionary smoke, lesson completion and visual regression all passed;
- visual regression passed without any baseline update;
- UI shard 1 and UI shard 2 failed only the focused streak test: the left streak border-box point was still intercepted in desktop Chromium, Android Chromium and iOS WebKit.

### Latest diagnosis

The summary generated surface was shifted correctly, but the fixed parent `<details class="lx-route-reminder-entry">` retained its original pointer box through the old right edge. On fractional/coarse layouts that transparent parent strip remained above the first pixel inside the streak button.

A standalone Chromium reproduction confirmed the minimal correction:

- `pointer-events: none` on the fixed `<details>` removes the stale parent interception strip;
- `pointer-events: auto` on `summary::before` preserves the shifted reminder target and native details toggling;
- `pointer-events: auto` on `.lx-route-reminder-preview` preserves interaction after disclosure;
- the streak left point then resolves to the streak button;
- the excluded former reminder-right strip resolves through to the underlying control.

### Implementation now present

- `button.lx-streak` uses a real 44px fine / 48px coarse minimum border box;
- the streak has no generated hit-slop pseudo-element;
- the reminder summary target remains a full border-aware 48×48 surface shifted exactly 16px left;
- the fixed reminder parent no longer participates in pointer hit-testing at widths where the streak is visible;
- the generated summary surface and disclosed preview explicitly remain interactive;
- painted reminder/streak pixels, keyboard focus, disclosure semantics, phone hiding and Progress navigation are unchanged;
- source-contract coverage now locks parent, generated target and preview pointer ownership.

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

### Superseded CI evidence

- CI #2795/run `30998706501` rejected the original streak pseudo-element because it still overlapped the reminder and changed two desktop visual states;
- CI #2811/run `31001271804` confirmed the real streak border box and visual stability, then isolated the final stale parent pointer-box defect in both UI shards;
- no unrelated product or infrastructure failure remains on the superseded exact head.

### Current branch head

Resolve the immutable head from the live branch after this Agent record commit.

### Next action

Read back the corrected CSS and source contract, compare the complete branch against current `main`, and run authoritative CI on one immutable head. Do not mark ready or merge until both UI shards, visual regression and every required repository gate are green.