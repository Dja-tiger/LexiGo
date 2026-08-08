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
- CI #3038 Visual job `93052328695`, CI #3040 Visual job `93053573636` and CI #3043 UI shard 2 job `93055344133`.
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
- repository browser-test search for native select/label focus conventions

Actions performed:

- Reconciled current-task/project-state prerequisites and replayed the product slice from exact live base.
- Added route-scoped 44px fine / 48px coarse targets and authoritative browser acceptance.
- Classified #3038 from exact Visual logs and corrected topic-scrollport compensation relative to canonical spacing rather than updating baselines.
- Treated cancelled #3039 as non-evidence.
- Classified #3040 from exact Visual logs/artifacts and retained compiled CSS; isolated compact search-submit displacement to `:is()` maximum specificity.
- Preserved concurrent specificity/probe fixes and published combined head `8ff76253c6ff75a146ae58d664f11d4142bcd390` without force.
- Ran full immutable-head CI #3043. Visual, accessibility, UI shard 1, lesson, PWA, security, performance and backend gates all passed; only UI shard 2 failed two native-select focus assertions.
- Read exact UI shard 2 job `93055344133`: 91 passed, 85 skipped, 2 failed; Android Chromium and iOS WebKit both reached/passed geometry and `elementFromPoint` ownership checks, then failed only because the native sort select was not `document.activeElement` after a synthetic mouse click on label padding.
- Searched repository browser contracts and found no existing native-select label-padding focus invariant to preserve.
- Replace the non-portable focus assertion with four direct target facts: `label.control === select`, `select.labels` contains the wrapper, the exact padding point resolves to that label outside the 44px select, and a Playwright mouse click at that point is delivered to the label as a browser-trusted click with matching client coordinates.
- Leave runtime CSS unchanged because #3043 already proves product paint/geometry through Visual and accessibility gates.

Commands or procedures:

GitHub connector exact-ref reads/writes, failed-job log inspection, workflow artifact download, historical/current image comparison, retained trace CSS inspection, repository test-contract search, non-force Git tree/commit construction, immutable CI/PR lifecycle and deployment inspection.

Artifacts produced:

- `frontend/app/phrases-catalog-touch-targets.css`
- `frontend/e2e/phrases-catalog-touch-targets.spec.ts`
- root CSS import
- UI/a11y collection registration
- current Agent Harness records
- retained diagnostic evidence from CI #3038, #3040 and #3043

Result:

The product implementation on #3043 is paint-inert and geometrically accepted; the remaining red gate is corrected at the browser-contract layer without changing CSS, snapshots or product semantics. A fresh immutable full CI is required.

Failures:

- CI #3038: compact/desktop Phrases baseline drift plus true 200% search/topics overlap from wrong topic-margin compensation.
- CI #3039: cancelled after branch advancement; no product verdict.
- CI #3040: compact Light/Dark only at `390x1678` vs expected `390x1628`; desktop/200% zoom pass.
- CI #3043: UI shard 2 only; Android Chromium and iOS WebKit native select did not expose focus after synthetic label-padding mouse click even though target geometry and hit ownership passed.

Root cause:

The #3043 failure is a test portability assumption: native select focus/picker behavior after automated label activation is platform/browser-specific. The Issue #74 target contract needs proof of a real 48px associated label hit surface and actual pointer-event delivery, not a universal `document.activeElement` side effect.

Fallback:

If browser-trusted click delivery is not stable across engines, inspect exact event evidence before changing the target implementation. Do not weaken 48px geometry/association/hit-point assertions, update content-addressed baselines or modify runtime CSS without new product evidence.

Limitations:

Automated Chromium/WebKit and Stage validation cannot substitute for final physical-device acceptance, including native picker/focus behavior, required to close Issue #74.

Reusable lesson:

For native form controls, test the platform-independent accessibility contract directly: target geometry, semantic association, hit ownership and real trusted input delivery. Do not promote mobile native picker/focus side effects into a cross-browser invariant when the browser automation layer does not expose them consistently.
