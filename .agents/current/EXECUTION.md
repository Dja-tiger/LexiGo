# Current Task Execution

## Task

- Branch: `style/issue-70-learning-switch-placement`.
- Base SHA: `cc3636872f47c44948d9be5f3aec4784fb2c5a79`.
- Head SHA: resolve from live branch ref.
- PR: #372 (Draft).

## Skills used

### GitHub connector-first repository workflow

Purpose:

Preserve compatibility fallback ownership while proving deterministic `/learn` placement under adversarial stylesheet order.

Instruction source:

GitHub skill, repository Agent Harness, Issue #70 CSS instructions and `docs/agent-harness.md`.

Version or verification date:

Verified 2026-08-04 Europe/Moscow against the exact base SHA.

Inputs:

- eight reviewed Scenario Catalog/Learn switch conflict IDs;
- Scenario Catalog and Learn placement styles;
- Route Primary Navigation and Scenario Catalog renderers;
- existing shell/resource cascade proof;
- frontend-core diagnostics from CI #2657 / run `30860028186`.

Files inspected:

Mandatory harness files, project state, import order, both switch stylesheets, renderer files, manifest/source contracts and the Chromium fixture.

Actions performed:

- scoped the initial Learn placement rules to canonical `/learn` ancestry;
- ran full diagnostic CI and inspected its exact unit/source failures;
- identified that route-only replacement removed the eight reviewed manifest IDs;
- restored every unscoped compatibility fallback and paired it with an identical stronger routed owner;
- corrected Scenario renderer evidence to its actual base switch class;
- generalized the navigation source contract to the expanded scenario/learning cascade orders without weakening prior shell/resource assertions;
- kept Scenario Catalog CSS, manifest JSON, values and breakpoints unchanged.

Commands or procedures:

Exact-ref connector reads, branch-only writes, workflow artifact extraction and fail-closed Vitest diagnostics.

Artifacts produced:

- five fallback-plus-routed Learn placement selector groups;
- eight-item focused ownership contract;
- expanded three-order/eight-width Chromium switch proof;
- updated shell ownership source contract.

Result:

The final mechanism preserves the reviewed 71-item inventory while making production Learn placement independent of import order. Authoritative CI remains required.

Failures:

The superseded CI head failed three source assertions: eight parser IDs disappeared, the Scenario renderer modifier was assumed incorrectly, and an older shell test matched exact pre-expansion order literals.

Root cause:

Valid compatibility fallbacks were removed instead of being paired with stronger route-specific owners; companion tests contained stale implementation assumptions.

Fallback:

If browser evidence differs, correct only computed expectations or route ancestry. Do not change approved values, media boundaries, snapshots, tolerances, timeouts or budgets.

Limitations:

Adaptive layout, Phrases, Account Security, async state and final semantic overlap auditing remain separate Issue #70 slices.

Reusable lesson:

Preserve reviewed fallback selectors and add stronger route ownership; source contracts should assert semantic order membership and actual renderer classes rather than incidental array formatting or invented modifiers.
