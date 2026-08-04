# Current Task Progress

## 2026-08-05 01:20 Europe/Moscow

### Verified

- Live task base is `main` SHA `6a8c885a6a7950c25cada8374b2d71dcf253b34e`.
- No open product PR conflicted with this slice at branch creation; open PRs #304–#306 were unrelated Dependabot work.
- Last product stage run `30937320392` succeeded, including public endpoints and public browser validation, for product SHA `29151758bae0b4220ee48213d0fc49a2290ba20a`.
- Issue #74 remains open and explicitly retains remaining live-control touch-target coverage.
- Current `/learn` source contains no live `Все режимы` control; that wording is stale.
- The live mobile disclosure owner exposes `Настроить урок` when collapsed and `Ручная настройка` when expanded.
- Figma source is file `3xXmBWnf38jbvLjtziwber`: collapsed node `202:81` is 318×42 and expanded summary node `203:57` is 358×58.
- Draft PR #391 exists for this atomic slice.

### Finding

The existing adaptive presentation guaranteed only a 44px minimum for the disclosure controls and had no explicit 48px coarse-pointer contract. The approved painted geometry therefore required an interaction-only owner rather than a visible resize or visual-baseline update.

### Root cause

The progressive Lesson Composer predates the Issue #74 fine/coarse target ownership pattern later established for connectivity and profile controls. Its presentation stylesheet owned visible geometry but no dedicated input-modality target variable or browser hit-test proof.

### Implementation

- Added `lesson-composer-disclosure-touch-targets.css` after the existing Lesson Composer presentation owners.
- Added a 44px default and 48px coarse-pointer target variable.
- Expanded only the event surface through a transparent pseudo-element; no painted declarations or component behavior changed.
- Added source ownership protection and a focused Chromium, Android Chromium and iOS WebKit geometry/hit-test/focus proof.
- Registered the browser proof in blocking UI and accessibility commands.

### First CI diagnosis

Authoritative CI #2761 / run `30953705424` ran on developer head `50aadc37e1c4dc57d3cd466fe836560b6b7819e1`.

Passed before the single task-related failure:

- classifier and full product-pipeline selection;
- frontend lint, TypeScript, unit/source contracts, production build and dependency audit;
- backend unit, security and integration;
- accessibility audit, iOS PWA, controlled Service Worker and Dictionary smoke;
- visual regression with no baseline changes;
- performance budgets, content security, lesson completion and UI shard 1.

Failed:

- Linux UI shard 2, job `92142111376`.

Evidence and correction:

- downloaded artifact `frontend-playwright-report-ui-2`, artifact id `8910344928`;
- Android Chromium and iOS WebKit failed because the helper measured only the pseudo-element padding box and incorrectly excluded the native button's 1px border on each side;
- corrected the helper to measure the union of the native clickable button border box and pseudo-element hit-slop box in commit `4fbbe995aee1a3a0f8295cce970f975fe6e62553`;
- production CSS remained unchanged.

### Second CI diagnosis

Full CI #2764 / run `30954584839` ran on head `66c8dabebee0b7c882c9ab3122d3982ece63104c`.

Passed before UI shard 2 failure:

- classifier;
- frontend core;
- backend unit/security and integration;
- content security, performance, accessibility audit, controlled Service Worker, visual regression, iOS PWA, Dictionary smoke and lesson completion.

Failed:

- Linux UI shard 2, job `92144962020`.

Evidence:

- downloaded artifact `frontend-playwright-report-ui-2`, artifact id `8910704697`;
- Android Chromium and iOS WebKit both resolved the lower perimeter probe to the fixed mobile navigation while the collapsed disclosure sat at the viewport edge;
- screenshot evidence showed the lower portion of the control underneath the fixed bottom navigation;
- the target itself remained 48px and did not overlap a neighboring Lesson Composer control;
- the same shard also contained an independent existing iOS WebKit flake in `lesson-result.spec.ts`: the recall answer input was cleared after `fill("backlog")`. No unrelated production or test file was changed in this slice.

Correction:

- added deterministic `scrollIntoView({ block: "center" })` setup before each target geometry/hit-test measurement so fixed viewport chrome cannot intercept the perimeter probes;
- correction commit: `2aa6db33115ef09d3f5b0f32e39a8c3adeeaddc7`;
- production CSS, runtime component, state and visual presentation remain unchanged.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/app/layout.tsx`
- `frontend/app/lesson-composer-disclosure-touch-targets.css`
- `frontend/components/lesson-composer-disclosure-touch-target-source.test.ts`
- `frontend/e2e/lesson-composer-disclosure-touch-targets.spec.ts`
- `frontend/package.json`

### Checks passed

- Agent Harness mandatory-document read and live GitHub reconciliation.
- Exact Figma metadata and design-context inspection for both disclosure states.
- Allowed-path and non-goal pre-flight.
- Full source read-back for all product changes and both test corrections.
- Branch compares limited to the eight allowed paths.
- All completed green gates listed above from runs `30953705424` and `30954584839`.

### Checks failed

- First browser helper version excluded native border pixels from target union.
- Second browser helper version ran a perimeter probe under fixed bottom navigation.
- Independent pre-existing `lesson-result.spec.ts` iOS input flake occurred in the second run.

### Current branch head

Resolve from the live branch after the remaining execution-record write. No final CI claim is made yet.

### Next action

Complete the execution record, verify the final branch diff and require a fresh full authoritative CI run on the resulting immutable developer head. A green run must include the corrected target proof; any recurrence of the unrelated lesson-result flake will be diagnosed from exact artifacts rather than hidden by a blind retry.
