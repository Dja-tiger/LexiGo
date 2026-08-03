# Current Task Progress

## 2026-08-04 01:25 Europe/Moscow

### Verified

- Base `cc3636872f47c44948d9be5f3aec4784fb2c5a79` is the exact current `main` after PR #371 reconciliation and lightweight main CI `30859484907`.
- Latest deployed product remains `740de92a4c6b748d9bcc6232b1c69d1601ca2be4`, stage run `30859063535`.
- The manifest contains exactly eight `scenario-catalog.css` → `learning-section-switch.css` items, all `requires-proof`, all targeting `.lx-learning-section-switch--learn` width or horizontal margins.
- Learn renders the `--learn` variant only at pathname `/learn`; Scenario Catalog renders the separate `--scenarios` variant.
- Production imports `scenario-catalog.css` before `learning-section-switch.css`.

### Finding

The Scenario Catalog stylesheet is a valid shared visual and compatibility fallback owner. The source-order defect exists because Learn placement used the same one-class specificity as that fallback across global, tablet, desktop, compact and narrow ranges.

### Root cause

Learn placement was route-specific in behavior but not in selector ancestry. Reversing stylesheet order allowed Scenario Catalog fallback width/margins to replace the intended Learn geometry.

### Changed files

- `.agents/current/TASK.md`;
- `.agents/current/PROGRESS.md`;
- `.agents/current/EXECUTION.md`;
- `frontend/app/learning-section-switch.css`;
- `frontend/components/learning-section-switch-css-ownership.test.ts`;
- `frontend/e2e/navigation-mobile-shell-cascade.spec.ts`.

### Checks passed

- All five Learn placement selector blocks now use `.lx-routed-app[data-route-path="/learn"]` ancestry.
- Declaration values and media boundaries are unchanged.
- Scenario Catalog CSS and manifest JSON are unchanged.
- Source proof protects all eight reviewed fallback items, route-specific renderer boundaries, import order, selector specificity and approved geometry.
- Existing Chromium fixture now loads Scenario Catalog and Learn styles under production plus two adversarial orders.
- Fixture covers 360, 390, 719, 720, 760, 761, 1024 and 1440px and compares complete shell/switch snapshots.

### Checks failed

- No authoritative CI has run on this branch yet.
- Exact computed pixel expectations still require execution on the authoritative Linux Chromium environment.

### Current branch head

Resolve from the live branch after this Agent Harness update.

### Next action

Open a Draft PR and run full product CI. Inspect source/unit results first, then the focused Chromium proof. Adjust only incorrect fixture expectations or route selector mechanics; do not change approved values, baselines, breakpoints, tolerances, timeouts or budgets.
