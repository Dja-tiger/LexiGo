# Current Task Progress

## 2026-08-07 11:39 Europe/Moscow

### Verified

- PR #425 was made Ready and expected-head squash-merged as `0a120092d89f7fffcb63b010acb2cb71ea615740`.
- Exact-SHA post-merge CI #2966 / run `31162312821` completed successfully.
- `main` remained `0a120092d89f7fffcb63b010acb2cb71ea615740` through branch creation and all product-branch writes classified below.
- New branch `feat/issue-74-phrases-browser-zoom` was created from that exact SHA.
- The original `frontend/playwright.visual.config.ts` explicit allow-list omitted Home/Learn/Active standalone browser-zoom specs.
- Existing Home, Learn and Active standalone specs each implement true per-tab Chromium zoom factor 2 via the MV3 browser-zoom controller and independent CDP/DOM telemetry.
- Existing Word Detail true-browser-zoom case was already authoritative because it lives inside collected `word-detail-visual.spec.ts`.
- Existing Phrases visual owner is `phrases-visual.spec.ts` with eight content-addressed Linux baselines; those hashes/dimensions remain unchanged in this branch.
- Canonical Phrases Figma file/nodes are recorded by Issue #199; no redesign is needed.

### Initial finding

The repository had three browser-zoom specs whose source existed and whose previous merge/main/stage pipelines were green, but the authoritative visual `testMatch` never collected them. A green workflow therefore overstated acceptance evidence.

### Initial root cause

The visual suite uses an explicit allow-list. New standalone browser-zoom files were added without updating that list, and there was no fail-closed unit/source contract coupling required browser-zoom owners to the collection boundary.

## 2026-08-07 11:52 Europe/Moscow — first authoritative collection run

### Changed before CI

- `frontend/playwright.visual.config.ts` now includes:
  - `home-browser-zoom.spec.ts`
  - `learn-browser-zoom.spec.ts`
  - `active-lesson-browser-zoom.spec.ts`
- `frontend/components/browser-zoom-collection-contract.test.ts` fail-closes the explicit collection boundary and canonical visual command.
- `frontend/e2e/phrases-visual.spec.ts` now contains one desktop-only canonical true-browser-owned 200% zoom acceptance case with MV3 extension + independent CDP/DOM telemetry, overflow/geometry/overlap/focus/runtime checks and metrics attachment.
- `.agents/AGENTS.issue-74-browser-zoom-collection.md` records the dormant-test category and mandatory prevention rule; `.agents/AGENTS.md` indexes it.
- Draft PR #426 was opened from exact base `0a120092d89f7fffcb63b010acb2cb71ea615740`.

### CI #2967 / run `31163124272`

Exact developer-authored head: `ad2dd2697eff12b8277bf6a86e2635263d091bbf`.

Passed before the browser failure:

- change-scope classifier;
- frontend runner policy;
- locked dependency installation;
- lint;
- typecheck;
- unit suite, including the new collection source contract;
- production build;
- production dependency audit.

Failed:

- `Frontend E2E (Visual regression)` job `92818156207`;
- failure was specifically `Run E2E tests`;
- setup/install/build all succeeded before Playwright execution.

Diagnostics:

- artifact: `frontend-playwright-report-visual` / `8988010273`;
- artifact digest: `sha256:a592a8df4b621b784b02f99ec02e98d2e0b67f6f3970855ac2fc0ed791cb99a8`;
- both first attempt and retry failed for each reported standalone owner, so this was deterministic rather than runner noise.

### Failure classification

#### Home

`home-browser-zoom.spec.ts` failed before applying zoom because it expected three legacy path cards:

- expected `3`;
- received `0`.

This expectation is stale. The current canonical `information-architecture.spec.ts` explicitly requires `Назначение основных разделов` to be hidden and states that Home delegates Learn/Dictionary/Progress destinations to the application shell. `LexigoHomeApp` still contains the section as hidden compatibility/structure, but it is not a visible Home acceptance owner.

Classification: stale dormant test contract, not product runtime/CSS defect.

Repair applied: visible path-card/grid assertions were removed and replaced with the current hidden-section + shell-owned navigation invariant.

#### Learn / Active Lesson

Both specs failed at the same pattern:

- helper called `locator.focus()`;
- locator was focused;
- `element.matches(":focus-visible")` was `false`;
- test required it to be `true`.

Programmatic focus is not proof of keyboard modality. The test claimed keyboard-visible focus but did not create keyboard-originated focus.

Classification: incorrect test interaction semantics, not product runtime/CSS defect.

Repair applied: all four zoom owners now move focus with keyboard traversal before asserting `:focus-visible`; the source contract requires this pattern.

### Scope decision

Runtime, CSS, API, dependencies, workflows and baselines remain prohibited. Allowed test scope was expanded only to the three existing standalone Home/Learn/Active browser-zoom owners because authoritative CI proved their dormant contracts need synchronization.

## 2026-08-07 12:13 Europe/Moscow — second authoritative collection run

### CI #2974 / run `31164577017`

Exact developer-authored head: `1c45430dd7e54163438c348399f0e7994defde7a`.

Authoritative Visual regression job: `92822695865`.

The decoded job log proves the repaired collection boundary is active:

- Playwright reported `Running 141 tests using 1 worker`;
- Home, Learn and Active standalone browser-zoom owners are explicitly listed in compact/medium as skipped-by-project and in `visual-desktop` as executed;
- Phrases browser-owned zoom is explicitly listed at `e2e/phrases-visual.spec.ts:388` and executed in `visual-desktop`;
- Active Lesson desktop browser-owned zoom completed without failure;
- Phrases desktop browser-owned zoom completed without failure;
- all eight Phrases content-addressed baseline cases completed without baseline mismatch;
- final summary: `55 passed`, `84 skipped`, `2 failed`.

The two remaining failures were deterministic on attempt and retry:

### Home follow-up classification

Failure:

- test required `lx-home-next-action` to become a single column at browser zoom 2;
- effective computed grid remained two columns: `243.992px 300px`.

Canonical CSS evidence:

- `adaptive-knowledge-coach-home.css` owns the routed Home grid with a more-specific two-column selector;
- its matching one-column override is `@media (max-width: 719px)`;
- the exact 1440px desktop / zoom=2 case lands at approximately 720 CSS px, so the canonical routed Home intentionally remains in the bounded two-column state at that boundary;
- the acceptance criterion is reflow/usability without clipping or horizontal overflow, not an invented one-column breakpoint at 720px.

Classification: over-constrained test expectation, not product defect.

Required repair: assert the canonical two-column 720px boundary (plus existing geometry, no-overflow and no-overlap checks) instead of requiring one column.

### Learn follow-up classification

Failure:

- `expectVisibleFocus(modeGroup.getByRole("radio").first())` could not return keyboard focus to the same first radio;
- CI shows the first mode radio has `tabindex="-1"` and `aria-checked="false"`.

This is standard roving-tabindex radio-group semantics: only the checked/current radio participates in the tab sequence. `Tab` followed by `Shift+Tab` returns to the group’s checked tabbable radio, not an arbitrary unchecked `.first()` element.

Classification: test selected a non-tabbable ARIA radio owner, not product defect.

Required repair: apply keyboard-focus assertions to each group’s `{ checked: true }` radio rather than `.first()`.

### Additional signal

The log contains `/api/v1/performance/rum` proxy `ECONNREFUSED 127.0.0.1:8080` messages during browser runs. They did not produce an Active/Phrases failure and are unrelated to the two deterministic assertions above; no observability/runtime scope expansion is justified by this run.

### Current scope decision

No runtime/CSS/API/workflow/dependency/baseline change is justified. The next commit stays within the already-approved browser-zoom test owners and corrects only the two proven test assumptions above.

### Next action

Correct the Home 720px grid expectation and Learn roving-radio focus targets, rerun the full required CI on the resulting developer-authored head, inspect exact successful visual logs, then perform review/thread audit and Ready/merge only if all required gates are green.
