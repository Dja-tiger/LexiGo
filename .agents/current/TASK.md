# Current Task

## Identity

- Issue: #518 — `[High][Figma][CI] Сделать Dictionary Empty baseline 79:93 детерминированным`
- Branch: `test/issue-518-dictionary-empty-visual-determinism`
- Base SHA: `22c84c630a76384a02e1a785c44bc24b064895ff`
- Head SHA: resolve from live branch ref
- PR: #520 — `test(figma): stabilize Dictionary Empty baseline 79:93`

## Objective

Eliminate nondeterministic raw-PNG capture for approved Figma `79:93` while preserving approved SHA `e140551792a87445af08658ed78439638918b174b4b1a0e3d36448ef1ce7dbdf`, product UI and every other approved visual baseline.

## Verified failure boundary

- focus-only capture normalization was rejected by CI #3491;
- `--disable-skia-runtime-opts` was rejected by CI #3496 because it changed approved Phrases compact hashes and `79:93` still flaked;
- `--num-raster-threads=1` was rejected by CI #3501 because both Dictionary captures remained `dd2d...` and an unrelated approved `scenario-lessons-compact-light` baseline regressed;
- double-rAF/layout stabilization was rejected by CI #3503: first Dictionary attempt produced stable `dd2d...`, retry produced approved `e140...`, final summary reported `1 flaky`;
- removing only screenshot-time `animations: "disabled"` was rejected after the mandatory immutable-head rerun of CI #3504: the first Visual run was clean, but rerun job `94886550359` produced first-attempt `dd2d...`, retry `e140...`, and `1 flaky`;
- pairwise raw-capture equality did not fail in these attempts, so the raw PNG is deterministic inside one browser/test lifecycle and the `dd2d...` / `e140...` switch happens between lifecycles;
- same-run pixel evidence localizes the variance to a few 1-LSB raster pixels around the fixed route reminder shadow, outside Dictionary content/data/layout;
- `calendar-reminder-entry.css` owns that fixed summary and uses an unchanged translucent background plus `box-shadow`; no production CSS defect has been proven.

## Current hypothesis

`installDeterministicRuntime()` already injects a transparent caret before page load (`caret-color: transparent !important`), but the raw screenshot helper additionally passes `caret: "hide"`, causing another screenshot-time state mutation. The current candidate removes only this redundant caret mutation while preserving deterministic runtime CSS, font/scroll/layout paint barriers, pairwise SHA proof and all approved hashes.

## Scope

- keep `visual-compact` Chromium launch configuration exactly equal to `main`;
- keep explicit font/scroll/layout/paint readiness and consecutive double-rAF geometry proof;
- keep two consecutive raw PNG captures and require them to be byte-identical before approved-SHA comparison;
- keep screenshot-time animation handling at its default after the previous candidate proved explicit animation mutation insufficient;
- remove only `caret: "hide"` from the raw content-addressed `page.screenshot()` call, leaving deterministic pre-load caret CSS authoritative;
- keep every approved hash and every snapshot file unchanged;
- accept only a clean first Playwright test attempt with no flaky classification, followed by a clean rerun on the same immutable head.

## Non-goals

- no alternate hash/baseline promotion;
- no tolerance or Playwright retry weakening;
- no arbitrary sleeps or timeout inflation;
- no production React/CSS/Figma changes;
- no global Chromium raster/Skia switches;
- no snapshot updates.

## Allowed paths

- `frontend/playwright.visual.config.ts`
- `frontend/e2e/system-states-visual.spec.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- product CSS/components
- workflows
- hashes/snapshots
- backend/deploy/dependencies
- unrelated visual tests

## Runtime / test owners

- content-addressed visual owner: `frontend/e2e/system-states-visual.spec.ts`
- deterministic motion/caret owner: `installDeterministicRuntime()` in `frontend/e2e/support/quality-gates.ts` (inspected, unchanged)
- compact Chromium project owner: `visual-compact` in `frontend/playwright.visual.config.ts` (equal to `main`)
- fixed reminder presentation owner inspected only for diagnosis: `frontend/app/calendar-reminder-entry.css`

## Documentation owners

- Figma node `79:93`; historical approval PR #239; Issue #518.
- Live Figma MCP is currently Starter-plan quota blocked, so no new design approval or canvas mutation is claimed.

## Invariants

- approved `79:93` SHA remains `e1405517...`;
- all other content-addressed hashes/snapshots remain unchanged;
- production UI/CSS remains byte-for-byte unchanged;
- consecutive-capture proof fails closed when the two raw PNG buffers differ; it never selects a capture by matching the approved hash;
- no flaky success is accepted.

## Acceptance criteria

- every existing System State/Figma content-addressed baseline keeps its approved hash;
- `79:93` produces two consecutive identical `e1405517...` captures on the first Playwright test attempt;
- Visual regression has no flaky classification;
- the critical Visual job passes again on the same immutable developer-authored head;
- full immutable-head CI passes;
- exact-main CI passes without controlled rerun;
- Stage/public validation passes.

## Required checks

- exact diff/source audit;
- authoritative Linux visual suite, repeated on one immutable developer-authored head if the first run is clean;
- full CI and review/thread audit;
- exact-main CI and Stage/public validation after merge.

## Risks

- removing screenshot-time caret mutation may still leave the cross-lifecycle shadow raster selection unchanged;
- a consecutive-capture assertion can expose additional unstable System State captures; any such failure is evidence to classify, not a reason to weaken the gate.

## Rollback

Restore `system-states-visual.spec.ts` to `main` and keep `playwright.visual.config.ts` at its canonical main configuration; never change approved design evidence.
