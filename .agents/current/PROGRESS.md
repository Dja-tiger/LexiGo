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

`home-browser-zoom.spec.ts` failed before applying zoom because it expected three legacy path cards: expected `3`, received `0`.

This expectation is stale. The current canonical `information-architecture.spec.ts` explicitly requires `Назначение основных разделов` to be hidden and states that Home delegates Learn/Dictionary/Progress destinations to the application shell.

Classification: stale dormant test contract, not product runtime/CSS defect.

Repair applied: visible path-card/grid assertions were removed and replaced with the current hidden-section + shell-owned navigation invariant.

#### Learn / Active Lesson

Both specs called `locator.focus()` and then required `:focus-visible`; programmatic focus does not prove keyboard modality.

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
- Home, Learn and Active standalone browser-zoom owners are explicitly collected and executed in `visual-desktop`;
- Phrases browser-owned zoom is explicitly collected and executed in `visual-desktop`;
- Active Lesson and Phrases desktop browser-owned zoom completed without failure;
- all eight Phrases content-addressed baseline cases completed without baseline mismatch;
- final summary: `55 passed`, `84 skipped`, `2 failed`.

### Home follow-up classification

The test required a single-column Home action grid at browser zoom 2, while the computed grid remained `243.992px 300px`. Canonical routed Home CSS switches to one column only at `max-width: 719px`; exact 1440px / zoom=2 lands at about 720 CSS px.

Classification: over-constrained test expectation, not product defect.

Repair applied: the test now asserts the canonical bounded two-column 720px boundary while retaining containment, no-overflow and no-overlap checks.

### Learn follow-up classification

The test targeted `.first()` in roving-tabindex radio groups; CI showed that radio had `tabindex="-1"` and `aria-checked="false"`.

Classification: test selected a non-tabbable ARIA radio owner, not product defect.

Repair applied: keyboard focus assertions now target each group’s `{ checked: true }` radio.

### Additional signal

The log contains `/api/v1/performance/rum` proxy `ECONNREFUSED 127.0.0.1:8080` messages during browser runs. They did not produce an acceptance failure and are unrelated to the deterministic assertions; no observability/runtime scope expansion is justified.

## 2026-08-07 12:29 Europe/Moscow — third authoritative collection run

### CI #2979 / run `31165575226`

Exact developer-authored head: `8427cfbb16ec77826c8fe58e9d39911189887979`.

Authoritative Visual regression job: `92825844195`.

Confirmed from the exact decoded job log:

- Playwright again reported `Running 141 tests using 1 worker`;
- Active Lesson desktop true browser zoom executed and passed;
- Learn desktop true browser zoom executed and passed, proving the checked-radio repair;
- Phrases desktop true browser zoom executed and passed;
- all eight Phrases content-addressed baseline cases executed without mismatch;
- Word Detail browser-owned zoom also executed without failure;
- final summary: `56 passed`, `84 skipped`, `1 failed`.

Diagnostics:

- artifact: `frontend-playwright-report-visual` / `8988935251`;
- artifact digest: `sha256:369e7011029a09d52c2ba24feaa0d516ee883f8efcac94aa9dafccd4eae5b7f2`;
- Home failure reproduced on the initial attempt and retry.

### Only remaining failure

Home already asserts the canonical two-column grid and no overlap, but a leftover assertion also required the progress panel to be vertically stacked after the hero:

- hero bottom expected threshold: `496.8359375`;
- progress `y`: `106`.

Those values are consistent with the already-confirmed same-row two-column layout. The assertion therefore contradicts the canonical grid it immediately precedes.

Classification: final stale test-contract assumption, not product runtime/CSS defect.

Required repair: retain the two-column, containment, no-overflow and no-overlap checks, and replace the vertical stacking requirement with same-row/top-alignment evidence that is compatible with the canonical two-column layout. Add a fail-closed source-contract guard so the contradictory stacking assertion cannot return.

### Current scope decision

No runtime/CSS/API/workflow/dependency/baseline change is justified. The next write remains strictly inside the Home browser-zoom owner, source contract and reusable harness lesson.

### Next action

Apply the final Home geometry contract repair, strengthen the source guard, rerun the complete required CI on the resulting authored head, inspect exact successful visual evidence, then perform review/thread audit and Ready/merge only if the whole workflow is green.
