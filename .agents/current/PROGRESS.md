# Current Task Progress

## 2026-08-07 11:39 Europe/Moscow

### Verified

- PR #425 was made Ready and expected-head squash-merged as `0a120092d89f7fffcb63b010acb2cb71ea615740`.
- Exact-SHA post-merge CI #2966 / run `31162312821` completed successfully.
- `main` remained `0a120092d89f7fffcb63b010acb2cb71ea615740` through branch creation, pre-CI writes and the first CI-failure classification.
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

Required repair: remove visible path-card/grid assertions from the Home zoom owner and assert the current hidden-section + shell-owned navigation invariant instead.

#### Learn / Active Lesson

Both specs failed at the same pattern:

- helper called `locator.focus()`;
- locator was focused;
- `element.matches(":focus-visible")` was `false`;
- test required it to be `true`.

Programmatic focus is not proof of keyboard modality. The test claimed keyboard-visible focus but did not create keyboard-originated focus.

Classification: incorrect test interaction semantics, not product runtime/CSS defect.

Required repair: focus each target through real keyboard traversal before asserting `:focus-visible` and computed focus styling. Home contains the same stale helper and the new Phrases case inherited it, so all four zoom owners must use one equivalent keyboard-originated pattern.

### Scope decision

Runtime, CSS, API, dependencies, workflows and baselines remain prohibited. Allowed test scope was expanded only to the three existing standalone Home/Learn/Active browser-zoom owners because authoritative CI proved their dormant contracts need synchronization.

### Current branch head

Resolve from live branch ref after this write. The pre-classification developer head was `ad2dd2697eff12b8277bf6a86e2635263d091bbf`; TASK classification commit is `be682c17c8fdec35d4683a7222cc41c9908c5200`.

### Next action

Correct Home to the canonical information-architecture contract, replace programmatic-focus evidence with keyboard-originated focus evidence across Home/Learn/Active/Phrases, strengthen the source contract against regression, then rerun the full required CI on the new developer-authored head.
