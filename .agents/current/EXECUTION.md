# Current Task Execution

## Task

- Branch: `fix/issue-74-phrases-catalog-targets-v3`
- Base SHA: `faf466e56e05b6d365b8a0acf14d63a25140a36b`
- Head SHA: resolve from live branch ref
- PR: #442

## Skills used

### GitHub repository harness / connector-first Issue #74 delivery

Purpose:

Deliver the confirmed Phrases catalog residual target gap through exact-base writes, authoritative browser collection, full immutable-head CI, merge and deployment evidence.

Instruction source:

- `AGENTS.md`
- `.agents/AGENTS.md` and mandatory specialized instructions
- `.agents/AGENTS.issue-74-browser-zoom-collection.md`
- `.agents/SKILLS.md`
- `.agents/PROJECT_STATE.md`
- `.agents/current/*`
- `docs/agent-harness.md`
- GitHub plugin workflow guidance

Version or verification date:

2026-08-08 Europe/Moscow; PR #442 base remains exact `faf466e56e05b6d365b8a0acf14d63a25140a36b`.

Inputs:

- Live Issue #74 acceptance criteria and current Phrases route/CSS owners.
- Delivered Phrases search-clear and Active Lesson paint-inert target patterns.
- Authoritative UI/a11y/visual collections.
- CI #3038 Visual job `93052328695` and CI #3040 Visual job `93053573636`.
- Retained #3040 visual artifact `9016067521`, historical green baseline artifact `8932166073` and compiled #3040 trace CSS.

Files inspected:

- `frontend/components/phrases-catalog.tsx`
- `frontend/components/catalog-kind-navigation.tsx`
- `frontend/components/catalog-pagination.tsx`
- `frontend/app/phrases.css`
- `frontend/app/phrases-search-clear-touch-targets.css`
- `frontend/app/information-architecture.css`
- `frontend/app/catalog-enhancements.css`
- `frontend/app/catalog-pagination.css`
- `frontend/app/premium-ui.css`
- `frontend/app/layout.tsx`
- `frontend/e2e/phrases-search-clear-touch-targets.spec.ts`
- `frontend/e2e/phrases-visual.spec.ts`
- `frontend/e2e/phrases-catalog-touch-targets.spec.ts`
- `frontend/playwright.visual.config.ts`
- `frontend/package.json`

Actions performed:

- Reconciled current-task/project-state prerequisites and replayed the product slice from exact live base.
- Added route-scoped 44px fine / 48px coarse targets and authoritative browser acceptance.
- Classified #3038 from exact Visual logs and corrected topic-scrollport compensation relative to canonical spacing rather than updating baselines.
- Treated cancelled #3039 as non-evidence.
- Classified #3040 from exact Visual logs/artifacts: desktop baselines and 200% zoom pass; only compact Light/Dark fail `1628 -> 1678`.
- Compared current and historical green screenshots and read retained compiled CSS, proving the compact submit was displaced by `:is()` maximum specificity.
- Preserved concurrent `8a8cd37c...`, which independently removed submit from the mixed high-specificity positioning rule, and `477103ee...`, which centers hit probes away from fixed mobile-nav occlusion and accepts localized lesson controls taller than their 40px minimum.
- Give submit its own default `position: relative` plus equal-specificity `<768px` `position: absolute`, preserving both desktop pseudo containment and compact canonical placement.
- Replace direct coarse select resize with paint-inert semantic label expansion: 2px clickable block padding plus `-2px` compensated margins, keeping select paint 44px and label target 48px.
- Extend acceptance to assert submit computed positioning and to click the sort-label padding outside the painted select, requiring the wrapped select to receive focus.

Commands or procedures:

GitHub connector exact-ref reads/writes, failed-job log inspection, workflow artifact download, historical/current image comparison, trace CSS inspection, non-force Git tree/commit construction, immutable CI/PR lifecycle and deployment inspection.

Artifacts produced:

- `frontend/app/phrases-catalog-touch-targets.css`
- `frontend/e2e/phrases-catalog-touch-targets.spec.ts`
- root CSS import
- UI/a11y collection registration
- current Agent Harness records
- retained diagnostic evidence from CI #3038 and #3040

Result:

The current remediation combines all proven fixes without overwriting concurrent branch work, without snapshot updates and without changing approved compact paint. A fresh immutable CI head is required.

Failures:

- CI #3038: compact/desktop Phrases baseline drift plus true 200% search/topics overlap from wrong topic-margin compensation.
- CI #3039: cancelled after branch advancement; no product verdict.
- CI #3040: compact Light/Dark only at `390x1678` vs expected `390x1628`; desktop/200% zoom pass.
- First publication of an equivalent remediation commit was rejected non-force because the branch advanced; this is expected race protection, not a product failure.

Root cause:

The residual compact failure is CSS specificity, not a stale baseline. A shared `:is()` rule inherited type specificity from another arm and overrode the compact submit layout owner. Separately, a direct 48px native-select resize would alter paint; the semantic wrapper can own the extra clickable area.

Fallback:

If fresh CI still detects compact drift or semantic-label activation is inconsistent, inspect the exact new trace/geometry before changing CSS. Do not update content-addressed baselines, weaken target/perimeter/non-overlap assertions or resize canonical painted controls without an independently approved visual change.

Limitations:

Automated Chromium/WebKit and Stage validation cannot substitute for final physical-device acceptance required to close Issue #74.

Reusable lesson:

Mixed `:is()` selectors can acquire specificity from an unrelated arm. Isolate positioned responsive controls into equal-specificity owners when later breakpoint rules must win. Native form controls can gain paint-inert target area through semantic labels when that label contributes real clickable padding and compensated margins.
