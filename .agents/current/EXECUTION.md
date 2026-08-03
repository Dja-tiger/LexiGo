# Current Task Execution

## Task

- Branch: `style/issue-70-adaptive-navigation-order-independence`.
- Base SHA: `e72e88c697ae74dc3dbdb65ed20ce640baee243d`.
- Head SHA: resolve from live branch ref.
- PR: #366 (Draft).

## Skills used

### GitHub repository workflow

Purpose:

Perform branch-safe repository inspection, bounded production changes, parser-driven manifest reconciliation, exact visual artifact diagnosis, CI review and expected-head delivery through the connected GitHub application.

Instruction source:

- root `AGENTS.md`;
- `.agents/AGENTS.md` and all mandatory indexed documents;
- `.agents/SKILLS.md`;
- `.agents/AGENTS.issue-70-compatibility-reachability.md`;
- `.agents/AGENTS.issue-261-css-specificity.md`;
- `.agents/AGENTS.tool-selection.md`;
- `docs/agent-harness.md`;
- GitHub plugin skill;
- Chromium command-line switch definition for `--disable-skia-runtime-opts`;
- Playwright configuration contract for `use.launchOptions.args`.

Version or verification date:

2026-08-03.

Inputs:

- live main and open PR inventory;
- Issue #70;
- PR #364 source/browser evidence and delivery records;
- production CSS owners and overlap manifest;
- canonical routed-shell DOM;
- CI #2606/run `30827173353` frontend diagnostics and parser output;
- corrected full CI #2612/run `30829015122` on product head `77b90f554501db881ba735da380ec82359beda84`;
- immutable-head CI #2614/run `30829924223` original and same-SHA failed-job rerun;
- both visual Playwright report artifacts, screenshots, traces, CSS responses and runner metadata.

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
- ran full authoritative CI #2606 and retrieved frontend-core diagnostics;
- parsed the exact 81-item inventory and pair/classification totals from `vitest.log`;
- generated the exact replacement manifest locally;
- created Git blob `957b5ae5c79f8236c4270076876552699f61f323`, verified it matched the locally computed Git blob SHA, attached it through a base-tree commit and fast-forwarded only the task branch;
- corrected source/count contracts so `.lx-resource-stack | width` remains an explicit separate conflict;
- ran corrected full CI #2612 on head `77b90f554501db881ba735da380ec82359beda84` without retry;
- verified frontend core, backend unit/security, backend integration, all browser groups, aggregate frontend quality and both container builds passed;
- verified unchanged Linux visual regression, accessibility results and route-performance budgets;
- recorded successful product-CI evidence and ran final immutable-head CI #2614 on `4f973116616f28a81c764e8de5c8d4dd5135e151`;
- observed one exact-hash visual failure, then reran only failed jobs on the same immutable source without changing code or baseline;
- observed the original visual case pass and a different exact-hash case fail on the second Azure host;
- downloaded and extracted both visual artifacts;
- compared approved and failed PNGs at pixel level;
- verified each failure changed exactly three pixels, with maximum one-unit RGB-channel drift;
- verified the production CSS response sequence, lengths and byte hashes were identical across both runs;
- verified both attempts used synthetic merge and `APP_BUILD_ID` `00c371d4538ebe561be53453826134d446074555`;
- compared green head `77b90f554501db881ba735da380ec82359beda84` to failing head `4f973116616f28a81c764e8de5c8d4dd5135e151` and confirmed only current Agent Docs changed;
- added Chromium visual launch argument `--disable-skia-runtime-opts` to force Skia's baseline code path;
- added a fail-closed source contract requiring that argument to be the only custom visual launch argument and forbidding pixel-tolerance substitution;
- preserved all approved exact visual hashes and snapshots unchanged.

Commands or procedures:

- connector reads by exact branch/SHA;
- branch creation from immutable main SHA;
- sequential explicit-branch contents writes;
- Git Data `create_blob` → `create_tree` → `create_commit` → non-forced `update_ref` for the generated manifest;
- read-after-write blob verification;
- live main verification after every write;
- authoritative CI job/log/artifact inspection;
- same-SHA rerun of failed workflow jobs;
- local dependency-free parsing of CI diagnostics;
- local ZIP/report/trace extraction and exact PNG pixel comparison;
- repository writes exclusively through the GitHub connector.

Artifacts produced:

- routed-shell adaptive selector correction;
- adversarial-order Chromium proof;
- exact 81-item overlap manifest;
- fail-closed 81/50/31 count contract;
- explicit 10-item premium/mobile and one-item resource-stack retained boundaries;
- deterministic Chromium/Skia visual launch contract;
- exact pixel-drift and identical-asset diagnosis;
- active task, progress and execution records.

Result:

The implementation, parser-derived contracts and visual determinism correction are synchronized. Corrected full CI #2612/run `30829015122` passed completely on product head `77b90f554501db881ba735da380ec82359beda84`. Immutable-head CI #2614 showed host-dependent three-pixel Skia raster drift while every non-visual gate passed. The visual project now forces Skia's baseline raster path without changing any approved hash. One new full immutable-head CI is required before Ready and merge.

Failures:

- CI #2606 frontend core failed on the intentionally stale 107-item manifest/count contract and on the initial assumption that all six mobile → adaptive conflicts belonged to navigation shell ownership.
- CI #2614 visual job failed on `compact Dictionary empty light`; the same-SHA rerun passed that case and failed `Profile compact light` instead. Each artifact differed from its approved hash at exactly three pixels by at most one RGB unit.

Root cause:

Five mobile → adaptive conflicts were shell selectors corrected by routed specificity. The sixth is `.lx-resource-stack | width`, a distinct layout-width owner explicitly excluded from this atomic slice. The parser correctly retained it.

The visual failures were caused by Chromium/Skia runtime CPU optimization selecting slightly different raster code paths on heterogeneous Azure hosts. Identical source, build identity and CSS assets produced moving three-pixel, one-channel-unit differences rather than a stable presentation change.

Fallback:

- If final CI shows a stable computed presentation or approved-hash change, revert the atomic PR and select a narrower declaration-migration mechanism. Do not absorb resource-stack or premium/mobile ownership into this slice.
- If `--disable-skia-runtime-opts` produces a stable third image instead of the approved hashes, remove the flag and stop this slice for a separate visual-harness design decision. Do not promote hashes, add tolerance or quantize screenshots in this PR.

Limitations:

- local clone and direct local repository test execution remain unavailable because the execution container cannot resolve GitHub hosts;
- repository evidence and final validation therefore use exact GitHub refs and authoritative CI;
- CI diagnostic artifacts are used to derive exact parser and pixel evidence, never as a substitute for final immutable-head CI.

Reusable lesson:

Source-order ownership must be split by semantic owner, not only stylesheet pair. A parser-retained selector outside the selected shell boundary is evidence to narrow the contract, not a reason to broaden production scope.

Exact content-addressed screenshot checks must also control the raster implementation. When identical source and assets fail on different three-pixel locations across hosts, preserve the approved hashes and remove CPU-runtime optimization as the variable instead of weakening the visual assertion.
