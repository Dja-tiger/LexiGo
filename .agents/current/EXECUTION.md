# Current Task Execution

## Task

- Branch: `style/issue-70-learning-switch-placement`.
- Base SHA: `cc3636872f47c44948d9be5f3aec4784fb2c5a79`.
- Head SHA: resolve from live branch ref.
- PR: pending Draft PR.

## Skills used

### GitHub connector-first repository workflow

Purpose:

Read exact repository state, preserve compatibility fallback ownership and add adversarial source-order evidence for one bounded CSS slice.

Instruction source:

GitHub skill, repository Agent Harness, Issue #70 CSS instructions and `docs/agent-harness.md`.

Version or verification date:

Verified 2026-08-04 Europe/Moscow against exact base `cc3636872f47c44948d9be5f3aec4784fb2c5a79`.

Inputs:

- Issue #70 acceptance criteria;
- reconciled PR #370/#371 delivery evidence;
- eight reviewed Scenario Catalog/Learn switch manifest items;
- root stylesheet order;
- Scenario Catalog and Learn placement styles;
- Route Primary Navigation and Scenario Catalog renderers;
- existing navigation/mobile-shell source and browser contracts.

Files inspected:

Mandatory Agent Harness files, project state/current templates, layout import order, both switch stylesheets, renderers, manifest and existing Chromium fixture.

Actions performed:

- created the product branch from exact reconciled main;
- confirmed Scenario Catalog is the shared visual/fallback owner and Learn is the route-specific placement owner;
- scoped all five Learn placement blocks below `.lx-routed-app[data-route-path="/learn"]`;
- preserved every declaration value and media boundary;
- left Scenario Catalog CSS and manifest JSON unchanged;
- added a focused source contract for the eight reviewed items and renderer/import/specificity boundaries;
- extended the existing browser fixture with live switch markup, both stylesheets, two adversarial orders and eight responsive widths.

Commands or procedures:

Exact-ref connector reads, branch-only contents writes, source inventory inspection and computed-cascade fixture extension.

Artifacts produced:

- canonical Learn route placement selector;
- eight-item source ownership contract;
- production + adversarial switch computed-cascade proof integrated into both authoritative UI commands.

Result:

The intended Learn switch geometry is now more specific than Scenario Catalog fallbacks at every responsive range. Authoritative CI remains required to validate exact computed pixels and the full product matrix.

Failures:

None yet. Browser expectations have not executed on authoritative Linux Chromium.

Root cause:

Route-specific placement was encoded with a route-agnostic one-class selector, leaving equal-specificity fallback declarations dependent on import order.

Fallback:

If computed evidence differs, correct only fixture expectations or route selector ancestry. Do not change approved values, breakpoints, snapshots, tolerances, timeouts or budgets.

Limitations:

This slice does not alter Scenario Catalog layout, adaptive layout, Phrases, Account Security, async state or semantic non-identical-selector auditing.

Reusable lesson:

When a shared component has valid fallback styling, preserve it and give the canonical route a stronger ancestry-based placement owner instead of deleting cross-route compatibility declarations.
