# Current Task Execution

## Task

- Branch: `fix/issue-74-learn-composer-disclosure-targets`
- Base SHA: `6a8c885a6a7950c25cada8374b2d71dcf253b34e`
- Head SHA: resolve from the live branch after this write
- PR: #391

## Skills used

### GitHub repository operations

Purpose:

Reconstruct live repository state, isolate one atomic Issue #74 slice and enforce branch/read-back/main-safety rules.

Instruction source:

`AGENTS.md`, `.agents/AGENTS.md`, all indexed specialist rules, `.agents/SKILLS.md`, `docs/agent-harness.md`, GitHub connector skill.

Version or verification date:

Repository rules read from `main` at `6a8c885a6a7950c25cada8374b2d71dcf253b34e` on 2026-08-05.

Inputs:

Issue #74, open PR inventory, main/stage runs, current source and prior touch-target PR #387/#389 patterns.

Files inspected:

- root and `.agents/**` normative documents;
- `.agents/PROJECT_STATE.md` and `.agents/current/**`;
- `frontend/components/lesson-composer-progressive-shell.tsx`;
- `frontend/components/lexigo-learn-app.tsx`;
- `frontend/app/adaptive-lesson-composer.css`;
- prior connectivity/profile touch-target CSS, source contracts and Playwright proof;
- `frontend/app/layout.tsx` and `frontend/package.json`.

Actions performed:

- verified live main, open PRs, Issue #74 and stage deployment;
- rejected stale `Все режимы` wording after exact source search;
- selected the mutually exclusive mobile Lesson Composer disclosure owner;
- created the branch from the exact main SHA;
- recorded allowed/prohibited paths and rollback;
- created Draft PR #391;
- read back every changed product file and confirmed branch compares are limited to the eight allowed paths.

Commands or procedures:

GitHub connector reads, issue/PR/workflow inspection, exact branch creation, contents API writes, branch compare and per-write read-back.

Artifacts produced:

Task branch, Draft PR #391 and current TASK/PROGRESS/EXECUTION records.

Result:

Atomic branch and PR established without any direct `main` write.

Failures:

Two read-only GitHub REST fetch attempts using percent-encoded slash paths were rejected with HTTP 400 by the connector path validator.

Root cause:

The generic fetch action does not accept encoded slash-bearing branch paths for those endpoint forms.

Fallback:

Use connector-native branch, explicit-ref file, compare and commit actions instead of generic encoded branch URLs.

Limitations:

Local clone/test execution is unavailable in the current environment; authoritative CI and connector evidence remain required.

Reusable lesson:

No new production failure category established; keep the connector fallback task-local.

### Figma inspection

Purpose:

Confirm exact approved presentation geometry before adding invisible accessibility ownership.

Instruction source:

`.agents/SKILLS.md`, `figma-use` and `figma-design-to-code` skills, `frontend/docs/adaptive-knowledge-coach.md`.

Version or verification date:

Live Figma file inspected on 2026-08-05.

Inputs:

File key `3xXmBWnf38jbvLjtziwber`; production Learn nodes `202:6` and `203:5`.

Files inspected:

Figma nodes `202:81` (`Customize Lesson Trigger`) and `203:57` (`Manual Settings Summary`).

Actions performed:

Read metadata and design context for both live disclosure states.

Commands or procedures:

Figma metadata plus exact-node design-context inspection.

Artifacts produced:

Verified dimensions: collapsed 318×42 in Figma; expanded summary 358×58.

Result:

Implementation preserves painted geometry and adds only an invisible 44/48px hit-surface contract.

Failures:

None.

Root cause:

Not applicable.

Fallback:

Not applicable.

Limitations:

Figma frames describe approved visuals, not browser event-target resolution; Playwright provides the runtime proof.

Reusable lesson:

No new category; retain the established visual-owner versus interaction-owner separation.

### Frontend implementation and source validation

Purpose:

Add input-modality target ownership without changing component semantics, painted geometry or lesson lifecycle.

Instruction source:

`.agents/SKILLS.md`, `.agents/AGENTS.base.md`, `.agents/AGENTS.progress-pr214.md`, prior PR #387/#389 contracts.

Version or verification date:

Current repository toolchain at base `6a8c885a6a7950c25cada8374b2d71dcf253b34e`.

Inputs:

Live accessibility names, adaptive presentation owner, global focus owner and package-level blocking commands.

Files inspected:

Existing Lesson Composer component/CSS plus prior touch-target source and browser tests.

Actions performed:

- added a dedicated stylesheet with a 44px default and 48px coarse-pointer variable;
- scoped the owner to the live mobile Learn main and the two mutually exclusive disclosure classes;
- used a transparent absolute pseudo-element for event-surface expansion;
- imported the owner after adaptive Lesson Composer presentation and accessibility styles;
- added a source contract prohibiting visual declarations and protecting import/runtime/test ownership;
- added Playwright proof for geometry, perimeter hit testing, adjacency, keyboard focus and horizontal reflow;
- registered the proof in `test:e2e:ui` and `test:e2e:a11y`.

Commands or procedures:

GitHub contents writes and read-back; authoritative CI for lint, typecheck, unit/source contracts, build, browser, visual, security, performance and dependency validation.

Artifacts produced:

- `frontend/app/lesson-composer-disclosure-touch-targets.css`;
- `frontend/components/lesson-composer-disclosure-touch-target-source.test.ts`;
- `frontend/e2e/lesson-composer-disclosure-touch-targets.spec.ts`;
- import and package-script registrations.

Result:

Production ownership is implemented; final validation remains pending on the post-diagnosis immutable head.

#### CI diagnosis 1 — target union

Run:

CI #2761 / `30953705424`, head `50aadc37e1c4dc57d3cd466fe836560b6b7819e1`, failed UI shard 2 job `92142111376`.

Evidence:

Downloaded artifact `frontend-playwright-report-ui-2`, artifact id `8910344928`. Android Chromium and iOS WebKit expected 312px target width but the helper reported 310px.

Root cause:

The helper measured only the pseudo-element padding box and dropped the native button's 1px left/right border even though the native border box remains clickable.

Correction:

Measure the union of the native button border box and pseudo-element rectangle. Commit `4fbbe995aee1a3a0f8295cce970f975fe6e62553`. No production CSS change.

Reusable lesson:

When a pseudo-element expands a native control, geometry assertions must measure the union of both clickable surfaces.

#### CI diagnosis 2 — viewport chrome interception

Run:

CI #2764 / `30954584839`, head `66c8dabebee0b7c882c9ab3122d3982ece63104c`, failed UI shard 2 job `92144962020`.

Evidence:

Downloaded artifact `frontend-playwright-report-ui-2`, artifact id `8910704697`. Android Chromium and iOS WebKit both returned `[true, true, false, true]` for top/right/bottom/left perimeter probes. Failure screenshots showed the collapsed disclosure at the bottom of the viewport with its lower edge behind the fixed mobile navigation.

Root cause:

The test evaluated the control at its initial document position. Fixed viewport chrome intercepted the lower perimeter point even though the Lesson Composer target itself was correctly sized and separated from adjacent composer controls.

Correction:

Center each disclosure control in the viewport with `scrollIntoView({ block: "center" })` before geometry and `elementFromPoint` assertions. Commit `2aa6db33115ef09d3f5b0f32e39a8c3adeeaddc7`. No production CSS change.

Independent failure in the same shard:

Existing `lesson-result.spec.ts` flaked under iOS WebKit because the recall textbox became empty after `fill("backlog")`. This file and its runtime owner are outside the current slice and were not changed. Any recurrence must be handled through evidence-driven CI diagnosis, not by silently expanding scope.

Reusable lesson:

Perimeter hit-testing for fixed-shell mobile layouts must first place the target away from fixed viewport chrome; otherwise `elementFromPoint` validates occlusion by shell navigation rather than the component's own event surface.

Passed gates across the two diagnosed runs:

- classifier;
- frontend lint, TypeScript, unit/source contracts, production build and dependency audit;
- backend unit, security and integration;
- accessibility audit, content security, iOS PWA, controlled Service Worker and Dictionary smoke;
- visual regression without baseline changes;
- performance budgets, lesson completion and UI shard 1.

Limitations:

Physical-device evidence remains outside automated browser emulation and is not claimed by this slice. A fresh full CI run is required because the second test correction and this execution record changed the developer head.

## Required next evidence

- fresh full authoritative PR CI on the final head produced by this execution-record write;
- corrected target proof green in Android Chromium and iOS WebKit;
- PR review-thread and mergeability inspection;
- Ready transition only after immutable-head green;
- expected-head squash merge;
- `main` CI and exact-image stage/public validation;
- separate documentation reconciliation PR and Issue #74 progress comment.
