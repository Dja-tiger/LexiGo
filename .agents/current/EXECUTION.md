# Current Task Execution

## Task

- Branch: `style/issue-70-adaptive-navigation-order-independence`.
- Base SHA: `e72e88c697ae74dc3dbdb65ed20ce640baee243d`.
- Head SHA: resolve from live branch ref.
- PR: #366 (Draft).

## Skills used

### GitHub repository workflow

Purpose:

Perform branch-safe repository inspection, bounded CSS ownership changes, parser-driven manifest reconciliation, exact visual artifact diagnosis, CI review and expected-head delivery through the connected GitHub application.

Instruction source:

- root `AGENTS.md`;
- `.agents/AGENTS.md` and all mandatory indexed documents;
- `.agents/SKILLS.md`;
- `.agents/AGENTS.issue-70-compatibility-reachability.md`;
- `.agents/AGENTS.issue-261-css-specificity.md`;
- `.agents/AGENTS.tool-selection.md`;
- `docs/agent-harness.md`;
- GitHub plugin skill.

Version or verification date:

2026-08-03.

Inputs:

- live main and open PR inventory;
- Issue #70;
- PR #364 source/browser evidence and delivery records;
- production CSS owners and overlap manifest;
- canonical routed-shell DOM;
- CI #2606/run `30827173353` parser diagnostics;
- corrected full CI #2612/run `30829015122` on product head `77b90f554501db881ba735da380ec82359beda84`;
- immutable-head CI #2614/run `30829924223` original and same-SHA failed-job rerun;
- CI #2619/run `30832095762` for the bounded renderer experiment;
- visual Playwright reports, screenshots, traces, CSS responses and runner metadata.

Files inspected:

- `AGENTS.md`;
- `.agents/AGENTS.md` and all mandatory specialized instructions;
- `.agents/PROJECT_STATE.md`;
- `.agents/current/**`;
- `docs/agent-harness.md`;
- `README.md` and `docs/architecture.md`;
- `frontend/components/routed-lexigo-app.tsx`;
- `frontend/app/premium-ui.css`;
- `frontend/app/mobile-pwa-fixes.css`;
- `frontend/app/adaptive-navigation.css`;
- `frontend/app/global-feature-style-overlap-manifest.json`;
- `frontend/app/global-feature-style-overlap-source.test.ts`;
- `frontend/app/global-feature-style-overlap-manifest.test.ts`;
- `frontend/components/navigation-mobile-shell-css-ownership.test.ts`;
- `frontend/e2e/navigation-mobile-shell-cascade.spec.ts`;
- `frontend/e2e/system-states-visual.spec.ts`;
- `frontend/e2e/profile-visual.spec.ts`;
- `frontend/playwright.visual.config.ts`.

Actions performed:

- verified exact live main and post-reconciliation state;
- confirmed only Dependabot PRs #304–#306 remain parallel;
- selected one adaptive-navigation shell correction without mixing premium/mobile or width-owner work;
- created the task branch from exact main and opened Draft PR #366;
- scoped only competing adaptive shell selectors below `.lx-routed-app`;
- added production-order and adaptive-first computed-cascade matrices at six critical widths;
- ran authoritative CI #2606 and retrieved the exact parser output;
- generated the exact 81-item manifest and attached Git blob `957b5ae5c79f8236c4270076876552699f61f323` through a non-forced branch fast-forward;
- corrected source/count contracts so `.lx-resource-stack | width` remains a separate unresolved conflict;
- ran corrected full CI #2612 successfully on product head `77b90f554501db881ba735da380ec82359beda84`;
- verified frontend core, backend unit/security/integration, all browser groups, aggregate frontend quality and both container builds passed;
- ran immutable-head CI #2614 and classified its moving exact-hash failures by inspecting two same-SHA attempts;
- downloaded and extracted both visual artifacts;
- compared approved and failed PNGs pixel-by-pixel;
- verified each failure changed exactly three pixels with maximum one-unit RGB-channel drift;
- verified source, synthetic merge, `APP_BUILD_ID`, CSS response sequence, lengths and byte hashes were identical;
- compared the green product head to the failing immutable head and confirmed only current Agent Docs had changed;
- evaluated `--disable-skia-runtime-opts` as a bounded experiment in CI #2619;
- observed that the experiment produced five stable alternate-raster exact-hash failures;
- applied the pre-recorded fallback: restored `frontend/playwright.visual.config.ts`, the focused source test and TASK contract byte-for-byte;
- preserved every visual snapshot, expected hash, tolerance and production CSS value unchanged;
- returned PR #366 to the original eight-file CSS ownership boundary.

Commands or procedures:

- connector reads by exact branch/SHA;
- branch creation from immutable main SHA;
- sequential explicit-branch contents writes;
- Git Data `create_blob` → `create_tree` → `create_commit` → non-forced `update_ref` for the generated manifest;
- read-after-write blob verification;
- live main verification after every write;
- authoritative CI job/log/artifact inspection;
- same-SHA rerun of failed workflow jobs after classification;
- local dependency-free parser and exact PNG pixel comparison;
- repository writes exclusively through the GitHub connector.

Artifacts produced:

- routed-shell adaptive selector correction;
- adversarial-order Chromium proof;
- exact 81-item overlap manifest;
- fail-closed 81/50/31 count contract;
- explicit 10-item premium/mobile and one-item resource-stack retained boundaries;
- exact pixel-drift and identical-asset diagnosis;
- active task, progress and execution records.

Result:

The CSS implementation and parser-derived contracts are synchronized. Full CI #2612 passed completely on the product head. Later immutable-head visual failures were classified as moving host-dependent three-pixel raster variation. The renderer experiment did not preserve approved hashes and has been fully removed. PR #366 again contains only the eight-file CSS ownership slice and requires one final immutable-head full CI before Ready and merge.

Failures:

- CI #2606 frontend core failed on the intentionally stale 107-item manifest/count contract and the initial assumption that all six mobile → adaptive conflicts belonged to navigation shell ownership.
- CI #2614 visual failed on `compact Dictionary empty light`; the same-SHA rerun passed that case and failed `Profile compact light` instead. Each artifact differed at exactly three pixels by at most one RGB unit.
- CI #2619 visual failed on five stable alternate-raster hashes under the experimental Skia flag. The experiment was rejected and reverted.

Root cause:

Five mobile → adaptive conflicts were shell selectors corrected by routed specificity. The sixth is `.lx-resource-stack | width`, a distinct layout-width owner excluded from this atomic slice.

The moving visual failures were caused by host-dependent Chromium/Skia raster variation rather than a stable UI or CSS regression. Forcing a different raster path was not compatible with the repository's current approved hashes and therefore cannot be included in this PR.

Fallback:

- Keep the visual harness, snapshots, hashes and tolerance unchanged in this slice.
- If final CI repeats the already classified moving three-pixel variation, rerun only failed jobs on the same immutable SHA without source changes.
- If a stable presentation or broad exact-hash change appears on the restored harness, stop delivery and investigate; do not update baselines or broaden this PR.

Limitations:

- local clone and direct local repository test execution remain unavailable because the execution container cannot resolve GitHub hosts;
- repository evidence and final validation therefore use exact GitHub refs and authoritative CI;
- CI artifacts are used for parser and pixel evidence, never as a substitute for final immutable-head CI.

Reusable lesson:

Source-order ownership must be split by semantic owner, not only stylesheet pair. A parser-retained selector outside the selected shell boundary is evidence to narrow the contract, not a reason to broaden production scope.

A renderer-level visual determinism change is a separate tooling slice when it changes existing approved hashes. It must not be mixed into a CSS ownership PR or used to justify baseline promotion.
