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
- overlap parser and 81-item pre-slice manifest;
- production root stylesheet order;
- premium, mobile-PWA, adaptive-navigation and routed-shell chrome styles;
- source and Chromium computed-cascade contracts;
- frontend-core diagnostics from CI #2633 / run `30850565546`;
- Playwright reports and traces from CI #2636 / run `30851215899` UI shards 1 and 2.

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
- CI unit log, emitted actual conflict inventory and both Playwright diagnostic archives.

Actions performed:

- closed stale post-merge memory through docs PR #367 before starting product work;
- created the product branch from exact current main;
- bounded the slice to the ten premium/mobile exact-selector conflicts;
- rejected an initial generic route-scoping mechanism after the parser proved it created three new routed-chrome conflicts;
- identified `adaptive-knowledge-coach-home.css` as the canonical routed application-shell chrome owner;
- removed mobile header background and logo declarations already unreachable beneath that routed owner;
- retained bounded compact fallback/dictionary header declarations, routed avatar dimensions and responsive view spacing;
- expanded the browser fixture to load routed-shell chrome and compare production, routed-shell-first and mobile-first orders at six width boundaries;
- updated fail-closed source expectations and exact pair totals;
- generated the exact 71-item manifest from CI parser output and verified Git blob `d379ee2f149fee52464272d70be4a88cfe84ba0e`;
- downloaded and unpacked both CI #2636 Playwright reports;
- proved both UI shards failed only at 390px and 719px with identical desktop/Android results and retries;
- traced the computed 54px header, zero top padding and zero view padding to the existing stronger non-dictionary routed-shell selectors;
- corrected only the new proof expectations from shadowed mobile fallback values to unchanged production computed values.

Commands or procedures:

- connector reads/fetches for exact refs, files and workflow evidence;
- contents-API branch writes with immediate read-back;
- Draft CI as the authoritative parser and browser execution environment;
- workflow artifact download and deterministic extraction of parser/Playwright diagnostics;
- pair-based classification verification before committing the manifest;
- Git blob hashing to prove the connector manifest write exactly matched the generated file;
- exact comparison of desktop Chromium and Android Chromium failure contexts before modifying the proof.

Artifacts produced:

- bounded mobile-PWA CSS cleanup;
- routed-shell source ownership contract;
- three-order × six-width Chromium cascade matrix;
- parser-derived 71-item exact-selector manifest;
- exact classification boundary: 50 intentional, 21 requires-proof, 0 protected;
- preserved Playwright evidence for the incorrect compact expectation at 390px/719px.

Result:

The source correction and manifest are synchronized. CI #2636 passed frontend core, backend, visual, accessibility, security, PWA, Dictionary, Lesson and performance gates. Its two UI shard failures were deterministic errors in the newly authored compact expected snapshot, not production changes. The proof now asserts the pre-existing routed-shell values while still requiring equality across all three stylesheet orders.

Failures:

- Initial route-scoping created three new exact-selector conflicts with routed application-shell chrome.
- CI #2633 failed five unit assertions solely because the branch intentionally still contained the old 81-item manifest at that head.
- CI #2636 failed both UI shards because the new `/learn` fixture expected lower-specificity mobile fallback values at compact widths; aggregate frontend quality failed and container builds were skipped.

Root cause:

CSS ownership was initially inferred too coarsely. The routed-shell file targets `.lx-routed-app` globally, and at compact widths its non-dictionary `.lx-app:not(...)` selectors are more specific than the mobile fallback selectors. The production result has always been 54px header min-height, `env(safe-area-inset-top)` top padding and zero view padding on `/learn`; the test incorrectly expected 58px, `+12px` and 18px.

Fallback:

If the corrected full CI still detects computed drift, use exact Playwright traces to revise only fixture ancestry or owner assertions. Do not change production values, snapshots, hashes, media boundaries, tolerances, timeouts or budgets.

Limitations:

This slice does not prove `.lx-resource-stack`, semantic non-identical-selector overlaps, Scenario/Learning switch ownership, Phrases grid, adaptive layout, account-security or async-state clusters.

Reusable lesson:

CSS ownership must be derived from full production ancestry and selector specificity, not stylesheet names or isolated declarations. A proof fixture must assert the effective stronger owner while separately protecting fallback declarations that remain live only on excluded route states.
