# Current Task Progress

## 2026-08-05 01:18 Europe/Moscow

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

### CI diagnosis

Authoritative CI #2761 / run `30953705424` ran on developer head `50aadc37e1c4dc57d3cd466fe836560b6b7819e1`.

Passed before the single failure:

- classifier and full product-pipeline selection;
- frontend lint, TypeScript, unit/source contracts, production build and dependency audit;
- backend unit, security and integration;
- accessibility audit, iOS PWA, controlled Service Worker and Dictionary smoke;
- visual regression with no baseline changes;
- performance budgets, content security, lesson completion and UI shard 1.

Failed:

- Linux UI shard 2, job `92142111376`.

Evidence:

- downloaded artifact `frontend-playwright-report-ui-2`, artifact id `8910344928`;
- Android Chromium and iOS WebKit failed at the same assertion: expected effective target width 312px, measured 310px;
- the production target itself remained correct; the test helper measured only the pseudo-element padding box and incorrectly excluded the native button's 1px border on each side.

Correction:

- changed the test helper to measure the geometric union of the native clickable button border box and the transparent pseudo-element hit-slop box;
- production CSS, runtime component, state and visual presentation remain unchanged;
- correction commit: `4fbbe995aee1a3a0f8295cce970f975fe6e62553`.

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
- Full source read-back for all product changes.
- Branch compare limited to the eight allowed paths.
- All completed gates listed above from CI run `30953705424`.

### Checks failed

- Initial UI shard 2 browser proof on head `50aadc37…`, due to the test-only border-box measurement defect described above.

### Current branch head

Resolve from the live branch after the remaining execution-record write. No final CI claim is made yet.

### Next action

Complete the execution record, verify the final branch diff, then require a fresh full authoritative CI run on the resulting immutable developer head before Ready or merge.
