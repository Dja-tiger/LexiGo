# Current Task Execution

## Task

- Issue: #74
- Branch: `fix/issue-74-header-streak-target`
- Base SHA: `e46881b9fc9def630343e3ee69425492bc0aefe7`
- PR: #395 (Draft)

## Workflow

Used the connected GitHub CI-remediation workflow and repository Agent Harness. All writes target the task branch only; `main` remains unchanged.

## Evidence inspected

- CI #2795/run `30998706501` and CI #2811/run `31001271804`;
- all workflow jobs and exact-head conclusions;
- UI shard 1 and UI shard 2 diagnostic artifacts;
- desktop Chromium, Android Chromium and iOS WebKit error contexts, traces and screenshots;
- compiled CSS and rendered trace DOM;
- streak, reminder, profile, focus and responsive source owners.

## Confirmed CI state on superseded head `0fc9d55075b43711db508ef76b73acbc4633b575`

The following gates passed:

- classifier;
- backend unit/security/integration;
- frontend lint, TypeScript, 98 Vitest files, production build and dependency audit;
- accessibility, content security, performance, controlled service worker, iOS PWA, dictionary smoke and lesson completion;
- visual regression without baseline changes.

Only UI shard 1 and UI shard 2 failed. All three browser projects reported the same assertion: the left streak border-box point resolved outside the button.

## Root cause isolated from artifacts

The real streak border box and shifted summary pseudo target were correct. The fixed parent `<details class="lx-route-reminder-entry">` still retained pointer ownership across its original border box. Because the details element has a higher stacking level, its transparent right-edge strip intercepted the first streak pixel even after the summary target moved left.

## Minimal correction

- set `pointer-events: none` on `.lx-route-reminder-entry` at `min-width: 720px`;
- retain `pointer-events: none` on the summary's original box;
- retain `pointer-events: auto` on the shifted `summary::before` target;
- set `pointer-events: auto` on `.lx-route-reminder-preview` so disclosed content remains operable;
- extend the source contract to lock all three pointer-ownership rules;
- keep the focused browser test unchanged so it continues to prove the actual streak boundary rather than accepting the defect.

## Supporting local proof

A standalone Chromium reproduction with the same fixed details, summary and generated target geometry showed:

- the streak-left point resolves to the streak button once the details parent is disabled;
- the shifted generated surface remains clickable;
- clicking it opens and closes the native details element;
- the former right-side overlap strip no longer belongs to the reminder;
- the disclosed preview remains eligible for explicit pointer interaction.

This is supporting evidence only. Full repository CI remains authoritative for Chromium, Android Chromium and iOS WebKit.

## Files in scope

- `frontend/app/header-streak-touch-targets.css`;
- `frontend/app/calendar-reminder-entry.css`;
- `frontend/components/header-streak-touch-target-source.test.ts`;
- `frontend/e2e/header-streak-touch-targets.spec.ts`;
- existing import and test-command registration files in PR #395;
- `.agents/current/**` records.

## Next gate

Read back the current files, compare the branch with `main`, then run authoritative CI on one immutable head. Do not mark ready or merge until both UI shards and every required repository gate pass.