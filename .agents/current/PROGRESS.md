# Current Task Progress

## 2026-08-05 21:40 Europe/Moscow

### Verified

- PR #406 was Ready, mergeable, free of comments/reviews/unresolved threads and green on immutable head `08f0fe0d051172dcc96dcc36d8ff305e338078f0`.
- PR #406 was expected-head squash-merged as `6d55091e55d2ac1340a15c4179b02f206605d4dd`.
- Docs-only main CI #2874 / run `31035227819` completed successfully; classifier and Agent Harness validation passed while product jobs correctly skipped.
- Live Issue #74 state, current `main`, open PRs and all mandatory Agent Harness sources were re-read before product writes.
- `/phrases` conditionally exposes a native button named `Очистить поиск` only when `searchInput` is non-empty.
- `phrases.css` paints that control at 36×36 inside a 48px search field and preserves separate compact positioning.
- `main` remains `6d55091e55d2ac1340a15c4179b02f206605d4dd` after branch writes.

### Finding

The live Phrases search-clear icon is an uncovered Issue #74 control. Its 36×36 painted box is below the 44px fine-pointer and 48px coarse-pointer minimum, while the surrounding 48px search field provides bounded space for transparent expansion.

### Root cause

Phrases presentation defines the icon button's visual dimensions and focus state but has no interaction-only hit-slop owner. The native search cancel affordance is intentionally suppressed, so this button is the sole exposed clear action.

### Changed files

- Added `frontend/app/phrases-search-clear-touch-targets.css`.
- Added `frontend/components/phrases-search-clear-touch-target-source.test.ts`.
- Added `frontend/e2e/phrases-search-clear-touch-targets.spec.ts`.
- Updated `frontend/app/layout.tsx` with one ordered CSS import.
- Updated `frontend/package.json` to include the browser proof in blocking UI and accessibility suites.
- Updated `.agents/current/TASK.md`, `.agents/current/PROGRESS.md` and `.agents/current/EXECUTION.md`.

### Checks passed

- Exact branch creation from base `6d55091e55d2ac1340a15c4179b02f206605d4dd`.
- Source/runtime inspection confirms exact role/name/callback and painted geometry ownership.
- Exact initial base-to-head compare contained only the eight allowed paths.
- Draft PR #407 was opened on initial head `962c05c217abf4afc8120e1638372b714a4aecf2`.
- Initial CI #2875 / run `31035970966` passed classifier, backend gates, frontend lint, TypeScript, unit/source contracts, production build, dependency audit, CSP, accessibility audit, visual regression, performance budgets, controlled service worker, dictionary smoke, iOS PWA, lesson completion and UI shard 1.
- The new desktop Chromium proof passed in UI shard 1.
- Branch and unchanged `main` refs were read back after implementation writes.

### Checks failed

- Initial CI #2875 failed in `Frontend E2E (UI tests (shard 2/2))`, job `92408580507`.
- Android Chromium and iOS WebKit rejected the compact target because symmetric 48px expansion overlapped the visible `Найти` action by approximately 12 CSS px.
- Playwright diagnostics were downloaded from artifact `frontend-playwright-report-ui-2` / artifact ID `8942780688`; the assertion failed at `submitBox.x - target.targetRight >= 1`.
- Local execution remains unavailable because the execution environment cannot resolve GitHub for a repository clone; no local result is counted as evidence.

## 2026-08-05 21:53 Europe/Moscow

### Failure analysis

The first implementation used one symmetric `inset` value. That correctly produced a 48×48 coarse-pointer square and passed perimeter hit-testing, but expanded six pixels toward the adjacent submit control. On the compact layout, the pre-existing separation between the painted clear button and `Найти` is insufficient for symmetric expansion.

### Corrective change

- Replaced symmetric `inset` with logical directional hit slop:
  - block expansion remains centered vertically;
  - inline expansion uses the full delta toward the search input;
  - the submit-facing edge remains aligned with the existing 36px painted box.
- Updated the source contract to require the directional logical insets and reject reintroduction of symmetric `inset`.
- Kept runtime markup, callback, painted dimensions, positioning, input padding, focus styling and visual baselines unchanged.

### Current branch head

Resolve from the live branch ref after the execution record is updated. Corrective implementation head before Agent Docs updates was `ccc8352998b1c5d359f3f6605524fb3dbf565339`.

### Next action

Read back the corrected files and exact diff, then validate the new final branch head with a fresh full authoritative CI. Do not mark PR #407 Ready until Android Chromium and iOS WebKit both prove 48×48 containment and submit separation on the immutable head.

## 2026-08-05 22:12 Europe/Moscow

### Second authoritative result

- Final-head candidate `a8574f02b9bcdf569244be3c4e449cb451df4ebc` ran in CI #2880 / run `31037006551`.
- Classifier, backend/security gates, frontend lint, TypeScript, unit/source contracts, production build, dependency audit and the majority of the browser matrix passed before the terminal UI shard result.
- `Frontend E2E (UI tests (shard 2/2))`, job `92412275989`, failed the target contract on Android Chromium and iOS WebKit, including retries.
- Artifact `frontend-playwright-report-ui-2` / ID `8943266089` was downloaded and unpacked.
- The exact failed value was `submitBox.x - target.targetRight = -6.046875` with expected minimum `1`.
- Perimeter hit-testing and target dimensions had already passed; the remaining overlap equalled the legacy painted-box overlap rather than pseudo-element expansion.
- The same artifact contained one unrelated Lesson Result retry diagnostic where an iOS answer input remained empty. It is outside this slice and is not used to explain the deterministic Phrases failure.

### Refined root cause

Directional hit slop correctly kept the pseudo-element's submit-facing edge aligned with the 36px button. However, compact `phrases.css` places the submit action at `right: 6px` and the clear action at `right: 70px`. With the rendered `Найти` width, the two painted boxes already overlap by approximately 6.05 CSS px. Therefore no transparent expansion strategy can satisfy independent targets while preserving that compact offset.

### Second corrective change

- Kept the clear button at 36×36 and preserved all desktop values.
- Added a route-scoped compact correction at `max-width: 767px`:
  - clear action `right: 80px`;
  - search input `padding-right: 120px`.
- The 10px inward shift creates approximately 3.95 CSS px painted and effective-target separation with the current submit geometry.
- The 12px input-clearance increase leaves approximately 4 CSS px between the text content edge and shifted clear button.
- Extended the source contract to allow exactly these two compact declarations and reject every other visual declaration.
- Extended browser proof to assert input `paddingRight`, painted action separation and effective-target separation separately at 390px and 320px.

### Current branch head

Resolve from the live branch ref after this evidence and execution record are committed.

### Next action

Read back all eight changed paths, verify the exact allow-list diff and unchanged `main`, then run a fresh full authoritative CI on the new immutable head. PR #407 remains Draft.
