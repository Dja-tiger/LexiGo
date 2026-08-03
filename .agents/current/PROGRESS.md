# Current Task Progress

## 2026-08-04 01:42 Europe/Moscow

### Verified

- Base `cc3636872f47c44948d9be5f3aec4784fb2c5a79` is the exact reconciled `main`.
- Draft PR #372 is the only active Issue #70 product slice.
- The reviewed manifest contains exactly eight `scenario-catalog.css` → `learning-section-switch.css` items, all `requires-proof`.
- CI #2657 / run `30860028186` reached frontend unit/source tests and failed before browser execution.

### Finding

The first implementation replaced the unscoped Learn selectors with routed selectors. That made production placement deterministic but removed all eight reviewed fallback IDs from the parser inventory. Two companion tests also encoded stale assumptions: Scenario Catalog does not use a `--scenarios` modifier, and the navigation proof still expected the pre-switch six-stylesheet order literals.

### Root cause

The correct ownership model mirrors the delivered resource-stack pattern: preserve valid compatibility fallback selectors and repeat the same declarations under stronger canonical `/learn` ancestry. The initial source contract confused Scenario Catalog's base visual class with a nonexistent route modifier and coupled to exact array formatting rather than the expanded cascade contract.

### Changed files

- `.agents/current/TASK.md`;
- `.agents/current/PROGRESS.md`;
- `.agents/current/EXECUTION.md`;
- `frontend/app/learning-section-switch.css`;
- `frontend/components/learning-section-switch-css-ownership.test.ts`;
- `frontend/components/navigation-mobile-shell-css-ownership.test.ts`;
- `frontend/e2e/navigation-mobile-shell-cascade.spec.ts`.

### Checks passed

- All five unscoped compatibility fallbacks are preserved.
- All five matching `/learn` routed owners use identical declarations and stronger specificity.
- Scenario Catalog CSS and manifest JSON remain unchanged.
- The focused source contract now reflects the actual Scenario renderer base class.
- The navigation contract accepts the expanded three-order proof while retaining prior shell/resource ownership assertions.
- The previous CI failure was limited to three source assertions; lint, TypeScript and the remaining 533 tests passed.

### Checks failed

- CI #2657 is not delivery evidence because it ran on the superseded route-only mechanism.
- The corrected fallback-plus-routed mechanism has not yet completed authoritative CI.

### Current branch head

Resolve from the live branch after this Agent Harness update.

### Next action

Run full product CI on the corrected immutable head. Require the 71-item parser inventory and all source tests to pass before evaluating exact Chromium switch geometry.
