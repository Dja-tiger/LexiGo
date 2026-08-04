# Current Task Execution

## Task

- Branch: `fix/issue-74-learn-option-targets`
- Base SHA: `b42f540f240883cfd4b23ce6e248512ac1f21316`
- Head SHA: resolve from the live branch after this write
- PR: #393

## Skills used

### GitHub repository operations

Purpose:

Reconstruct live state after PR #391 reconciliation, isolate the next Issue #74 owner and enforce branch, read-back, CI and merge safety.

Instruction source:

`AGENTS.md`, `.agents/AGENTS.md`, all mandatory specialist documents, `.agents/SKILLS.md`, `.agents/PROJECT_STATE.md`, `.agents/current/**`, `docs/agent-harness.md` and the GitHub connector skill.

Version or verification date:

Live `main` `b42f540f240883cfd4b23ce6e248512ac1f21316`, verified 2026-08-05.

Inputs:

Issue #74, completed PRs #387/#389/#391, open PR inventory, current Learn source, adaptive CSS and stage evidence.

Files inspected:

- Agent Harness entrypoint, index, state and idle current records;
- `frontend/components/lexigo-learn-app.tsx`;
- `frontend/components/lesson-composer-progressive-shell.tsx`;
- `frontend/app/adaptive-lesson-composer.css`;
- `frontend/app/premium-ui.css`;
- `frontend/app/accessibility-focus.css`;
- `frontend/app/layout.tsx`;
- previous connectivity, profile and disclosure touch-target contracts.

Actions performed:

- verified no active product slice or intersecting PR;
- confirmed three live expanded mobile radiogroups and all direct radio owners;
- confirmed current 44px floor, 6px visual gaps and absence of a 48px coarse owner;
- created the task branch from exact live main;
- recorded allowed/prohibited paths, invariants, acceptance criteria and rollback;
- created Draft PR #393;
- read back every changed path;
- confirmed branch compares contain only the eight allowed paths and remain based on the exact main SHA.

Commands or procedures:

Connector-native file, Issue, PR, workflow, branch, compare and exact-ref operations with write read-back.

Artifacts produced:

Task branch, Draft PR #393 and current TASK/PROGRESS/EXECUTION records.

Result:

Atomic product branch and Draft PR established without direct `main` writes.

Failures:

None.

Root cause:

Not applicable.

Fallback:

If live target overlap cannot be prevented inside the current 6px spacing contract, stop and reduce or redesign the slice rather than silently modifying approved presentation.

Limitations:

Local clone execution is unavailable; authoritative CI remains the validation source of truth.

Reusable lesson:

No new repository-operation failure category established.

### Figma inspection

Purpose:

Separate approved painted geometry from effective touch-target ownership.

Instruction source:

`.agents/SKILLS.md`, Figma use/design-to-code skills and the adaptive Lesson Composer source annotation.

Version or verification date:

Live Figma file inspected 2026-08-05.

Inputs:

File `3xXmBWnf38jbvLjtziwber`, expanded mobile Learn frame `203:5`.

Files inspected:

- mode options node `203:66`;
- material options node `203:77`;
- size options node `203:92`.

Actions performed:

Read frame metadata and exact design context for all three control groups.

Commands or procedures:

Figma metadata followed by required exact-node design-context calls.

Artifacts produced:

Verified painted heights and gaps: mode 32px, material 45px, size 32px, gap 6px.

Result:

Implementation does not resize or re-baseline controls; only an invisible block-axis interaction surface is added.

Failures:

None.

Root cause:

Not applicable.

Fallback:

Not applicable.

Limitations:

Figma does not prove browser event targeting; Playwright must verify effective rectangles and `elementFromPoint` ownership.

Reusable lesson:

Retain visual-owner versus interaction-owner separation.

### Frontend implementation and source validation

Purpose:

Provide fine/coarse target ownership for every live Lesson Composer option radio without changing visual or behavioral owners.

Instruction source:

Existing Issue #74 source/browser contracts, `.agents/AGENTS.progress-pr214.md` and the live runtime/accessibility source.

Version or verification date:

Current repository frontend toolchain at base `b42f540f240883cfd4b23ce6e248512ac1f21316`.

Inputs:

Three radiogroup names, direct option selectors, current 44px mobile floor, 6px gaps, pointer media query and roving-tabindex semantics.

Files inspected:

- `frontend/components/lexigo-learn-app.tsx`;
- `frontend/app/adaptive-lesson-composer.css`;
- existing Issue #74 interaction-owner styles, source tests and Playwright geometry helpers;
- package-level blocking test commands.

Actions performed:

- added `lesson-composer-option-touch-targets.css` with a 44px default and 48px coarse-pointer token;
- scoped it to direct mode, source and size option buttons inside the live Learn main;
- expanded only the block-axis event surface through a transparent absolute pseudo-element;
- kept inline expansion zero so horizontal mode/size controls cannot overlap;
- loaded the owner after adaptive presentation/accessibility and the prior disclosure interaction owner;
- added a source contract for exact runtime names, role templates, import order, visual-owner boundaries and blocking registration;
- added Playwright proof for every rendered radio, target union geometry, four perimeter hits, pairwise non-overlap, focus-visible, alternate selection and compact reflow;
- registered the proof exactly once in `test:e2e:ui` and `test:e2e:a11y`.

Commands or procedures:

GitHub contents writes, exact file read-back, source search, branch compare and authoritative CI inspection.

Artifacts produced:

- `frontend/app/lesson-composer-option-touch-targets.css`;
- `frontend/components/lesson-composer-option-touch-target-source.test.ts`;
- `frontend/e2e/lesson-composer-option-touch-targets.spec.ts`;
- layout import and package command registrations.

Result:

Production and validation ownership implemented; final full-CI validation remains pending on the post-diagnosis immutable head.

#### Pre-CI correction 1 — Playwright callback serialization

Failure found during mandatory read-back:

The first E2E version referenced a top-level geometry helper from inside Playwright `evaluate` and `evaluateAll` callbacks.

Root cause:

Playwright serializes page callbacks but not arbitrary outer helper functions.

Correction:

Moved the geometry measurement function inside each browser callback. No production CSS or runtime change.

Reusable lesson:

Playwright page callbacks must be self-contained.

#### Pre-CI correction 2 — accessibility naming and radio templates

Failure found during mandatory read-back:

The first source contract expected `aria-label="Размер урока"` and only three `role="radio"` templates.

Root cause:

The live size group is correctly named by `<legend id="lesson-size-label">` plus `aria-labelledby`, and reusable `CollectionCard` contributes the fourth radio template.

Correction:

Aligned the contract with the exact naming relation and four source templates. No runtime change.

Reusable lesson:

Source contracts must model actual `aria-label` versus `aria-labelledby` ownership and reusable component templates.

#### CI diagnosis — exact source assertions

Run:

CI #2775 / run `30958010741`, developer head `02be8af2e74cd0e18932dace0c74a47dd7cc0835`.

Failed job:

Frontend core quality `92155520449`, unit/source-contract step. Lint and TypeScript passed. The same run reported 96 passing unit files and 595 passing tests outside the two new assertions.

Evidence:

Exact job logs showed:

1. `runtime.match(/role="radiogroup"/g)` returned four because `lexigo-learn-app.tsx` contains another unrelated radiogroup outside this slice.
2. `not.toContain("width:")` matched the allowed media condition `max-width: 767px`, not a CSS `width` declaration.

Root cause:

The source contract used global file-level counts and raw substring checks where exact owner strings and declaration-level checks were required.

Correction:

- removed the ambiguous global radiogroup count while retaining exact assertions for each of the three target owner strings;
- replaced raw forbidden declaration substrings with line-anchored regular expressions for actual CSS declarations, allowing `max-width` while still rejecting `width`;
- committed as `4826f8225f87634ab6d22aefc59f87430e4d1ae8`;
- production CSS, runtime source and Playwright proof were unchanged.

Limitations:

Physical-device acceptance, enlarged-text behavior and 200% zoom remain outside this slice. Browser emulation cannot be represented as physical-device evidence.

Reusable lesson:

A source contract for a large owner file must assert exact target fragments instead of total counts unless the whole-file count is itself the invariant. CSS declaration prohibitions must distinguish declarations from media-feature names such as `max-width`.

## Required next evidence

- fresh full authoritative PR CI on the immutable head produced by this execution-record write;
- focused target proof green in desktop Chromium, Android Chromium and iOS WebKit;
- all standard frontend/backend/browser/visual/security/performance/container gates green;
- no comments, reviews or unresolved threads;
- Ready transition followed by expected-head squash merge;
- exact-SHA main CI and immutable image publication;
- exact-image stage deploy, public endpoint smoke and public browser validation;
- separate Agent Docs reconciliation PR and Issue #74 progress comment.
