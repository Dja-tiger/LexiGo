# Current Task Execution

## Task

- Branch: `style/issue-70-mobile-pwa-shell-order-independence`.
- Base SHA: `1030ef2decd970251846650371c18ed8ff9f0ba1`.
- Head SHA: resolve from live branch ref.
- PR: #368 (Draft).

## Skills used

### GitHub connector-first repository workflow

Purpose:

Read exact repository state, perform branch-only writes, inspect CI/review/deployment evidence and preserve expected-head delivery semantics.

Instruction source:

`skills://plugins/github/github/skill.md`, repository `AGENTS.md`, `.agents/AGENTS.md`, specialized Issue #70/tool/CSS instructions and `docs/agent-harness.md`.

Version or verification date:

Verified 2026-08-03 Europe/Moscow against base `1030ef2decd970251846650371c18ed8ff9f0ba1`.

Inputs:

- Issue #70 acceptance criteria;
- PR #366/#367 delivery evidence;
- current overlap parser and 81-item pre-slice manifest;
- production root stylesheet order;
- premium, mobile-PWA, adaptive-navigation and routed-shell chrome styles;
- source and Chromium computed-cascade contracts;
- frontend-core diagnostics from CI #2633 / run `30850565546`.

Files inspected:

- mandatory Agent Harness files and referenced specialized instructions;
- `.agents/PROJECT_STATE.md` and `.agents/current/**`;
- `frontend/app/layout.tsx`;
- `frontend/app/premium-ui.css`;
- `frontend/app/mobile-pwa-fixes.css`;
- `frontend/app/adaptive-navigation.css`;
- `frontend/app/adaptive-knowledge-coach-home.css`;
- global overlap source/manifest contracts;
- routed application root;
- navigation/mobile-shell source and browser specs;
- CI unit log and emitted actual conflict inventory.

Actions performed:

- closed stale post-merge memory through docs PR #367 before starting product work;
- created the product branch from exact current main;
- bounded the slice to the ten premium/mobile exact-selector conflicts;
- rejected an initial generic route-scoping mechanism after the parser proved it created three new routed-chrome conflicts;
- identified `adaptive-knowledge-coach-home.css` as the canonical routed application-shell chrome owner;
- removed mobile header background and logo declarations already unreachable beneath that routed owner;
- retained compact routed header geometry through 719px;
- retained routed avatar dimensions and view spacing through 760px;
- restricted standalone safe-area geometry to compact widths;
- expanded the browser fixture to load routed-shell chrome and compare production, routed-shell-first and mobile-first orders at six width boundaries;
- updated fail-closed source expectations and exact pair totals;
- used the CI parser output to generate the exact 71-item manifest rather than hand-filtering IDs;
- verified the committed Git blob `d379ee2f149fee52464272d70be4a88cfe84ba0e` against the generated artifact.

Commands or procedures:

- connector reads/fetches for exact refs, files and workflow evidence;
- contents-API branch writes with immediate read-back;
- Draft CI as the authoritative parser and browser execution environment;
- workflow artifact download and local deterministic extraction of the JSON block between `BEGIN ACTUAL CONFLICT IDS` and `END ACTUAL CONFLICT IDS`;
- pair-based classification verification before committing the manifest;
- Git blob hashing to prove the connector write exactly matches the generated file.

Artifacts produced:

- bounded mobile-PWA CSS cleanup;
- routed-shell source ownership contract;
- three-order × six-width Chromium cascade matrix;
- parser-derived 71-item exact-selector manifest;
- exact classification boundary: 50 intentional, 21 requires-proof, 0 protected.

Result:

The source correction and manifest are synchronized. Diagnostic CI proves the parser sees exactly the intended 71 conflicts and no replacement mobile/routed-chrome pair. A new complete CI run is required because browser, visual and downstream gates were blocked by the intentionally stale manifest in the diagnostic run.

Failures:

- Initial route-scoping created three new exact-selector conflicts with routed application-shell chrome.
- CI #2633 failed five unit assertions solely because the branch intentionally still contained the old 81-item manifest at that head.

Root cause:

The CSS file name suggested a Home-specific owner, but its selectors target `.lx-routed-app` globally. Mobile background/logo declarations were therefore dead duplicates on all production routed routes, while avatar/view declarations remained live. The first implementation grouped those categories incorrectly.

Fallback:

If the final browser proof detects computed drift, adjust only ownership selectors or declaration placement inside the allowed paths. Do not change approved values, snapshots, hashes, media boundaries, tolerances, timeouts or budgets.

Limitations:

This slice does not prove `.lx-resource-stack`, semantic non-identical-selector overlaps, Scenario/Learning switch ownership, Phrases grid, adaptive layout, account-security or async-state clusters.

Reusable lesson:

CSS ownership must be derived from selector reachability and production ancestry, not stylesheet names. Before increasing specificity, identify declarations already unreachable beneath a stronger global route owner and delete those duplicates instead of creating a second equally specific owner.
