# Current Task Progress

## 2026-08-03 18:20 Europe/Moscow

### Verified

- Live `main`: `e72e88c697ae74dc3dbdb65ed20ce640baee243d`.
- Issue #70 remains open.
- Draft PR #366 owns this atomic slice.
- Parallel open PRs are Dependabot #304–#306 and do not overlap this slice.
- PR #364 proof established 37 original navigation/mobile-shell conflicts: 21 premium → adaptive, 10 premium → mobile and 6 mobile → adaptive.
- `.lx-routed-app` is the canonical ancestor around `RouteChrome` and `LexigoBootstrappedApp` for every product route.

### Finding

Routed-shell specificity removes all 21 premium → adaptive conflicts and five navigation/mobile-shell mobile → adaptive conflicts without changing declaration values or media boundaries. The authoritative parser correctly preserves one separate mobile → adaptive item for `.lx-resource-stack | width`, because that selector was intentionally excluded from this shell-only correction.

The exact post-change manifest boundary is:

- 81 total conflicts;
- 50 `intentional`;
- 31 `requires-proof`;
- 0 `protected`;
- 10 premium → mobile shell conflicts;
- one separate mobile → adaptive `.lx-resource-stack` width conflict;
- zero premium → adaptive conflicts.

Immutable-head CI #2614/run `30829924223` exposed a Linux exact-hash visual flake on unchanged production code:

- the first visual build failed only `compact Dictionary empty light`;
- the same-SHA failed-job rerun passed that case and failed only `Profile compact light`;
- both attempts used the same source, synthetic merge `00c371d4538ebe561be53453826134d446074555`, `APP_BUILD_ID`, CSS URLs, order, lengths and byte hashes;
- each failed PNG differed from its approved hash at exactly three pixels, with maximum one-unit RGB-channel drift;
- the failures moved between unrelated screenshots on different Azure hosts;
- between the previously green product head and the failing immutable head only `.agents/current/PROGRESS.md` and `.agents/current/EXECUTION.md` had changed.

A bounded `--disable-skia-runtime-opts` experiment was evaluated in CI #2619/run `30832095762`. It produced a stable third raster output and changed five existing exact hashes, so the pre-recorded fallback was applied. The visual configuration and focused source contract were restored byte-for-byte, no baseline/hash/tolerance was modified, and visual-harness work remains outside this CSS ownership PR.

### Root cause

Adaptive navigation shell selectors had equal specificity to legacy premium and mobile-PWA selectors, so intended compact/tablet ownership depended on root stylesheet import order. Resource-stack width is a different ownership concern and remains explicitly unresolved.

The moving three-pixel visual failures are classified as host-dependent Chromium/Skia raster variation rather than a stable presentation regression. The attempted renderer-level mitigation was rejected because it did not preserve the repository's approved exact hashes.

### Changed files

- `.agents/current/TASK.md`;
- `.agents/current/PROGRESS.md`;
- `.agents/current/EXECUTION.md`;
- `frontend/app/adaptive-navigation.css`;
- `frontend/app/global-feature-style-overlap-manifest.json`;
- `frontend/app/global-feature-style-overlap-manifest.test.ts`;
- `frontend/components/navigation-mobile-shell-css-ownership.test.ts`;
- `frontend/e2e/navigation-mobile-shell-cascade.spec.ts`.

### Checks passed

- mandatory Agent Harness and specialized Issue #70 rules re-read;
- live main, Issue, PR inventory, prior CI and stage evidence verified;
- branch created from exact main;
- adaptive selector values and media boundaries preserved;
- adversarial adaptive-first Chromium matrix added for 390, 719, 720, 760, 761 and 1024 px;
- authoritative CI #2606/run `30827173353` emitted the exact parser-derived inventory used to correct stale contracts;
- generated manifest Git blob SHA `957b5ae5c79f8236c4270076876552699f61f323` matched the locally computed Git blob SHA before fast-forward attachment;
- corrected full CI #2612/run `30829015122` passed completely on product head `77b90f554501db881ba735da380ec82359beda84` without retry;
- frontend lint, TypeScript, complete unit/source suite, production build and dependency audit passed;
- backend unit/security and race-enabled integration passed;
- accessibility, iOS PWA, Lesson completion, performance budgets, both UI shards, Linux visual regression, CSP, controlled service worker and Dictionary smoke passed;
- aggregate Frontend quality and both API/Web container builds passed;
- CI #2614/run `30829924223` passed every non-visual gate on immutable head `4f973116616f28a81c764e8de5c8d4dd5135e151` in the original run and same-SHA rerun;
- exact visual artifact analysis confirmed moving three-pixel, one-RGB-unit drift with identical source/assets;
- CI #2619 proved that forcing the alternate Skia path would change five approved hashes and therefore must not be included in this PR;
- `frontend/playwright.visual.config.ts`, focused source test and TASK contract were restored to their pre-experiment blobs;
- no snapshot, baseline hash, tolerance, route budget, timeout, dependency or production declaration-value change remains;
- every successful write was read back by exact branch ref;
- main remained unchanged after every write.

### Checks failed

- CI #2606 frontend core failed only on intentionally stale manifest/count contracts and the initial incorrect assumption that all six mobile → adaptive conflicts belonged to the shell. The parser proved that `.lx-resource-stack | width` is a separate retained conflict.
- CI #2614 visual failed on two different three-pixel exact-hash cases across same-SHA attempts.
- CI #2619 visual failed on five stable alternate-raster hashes under the experimental Skia flag. That experiment has been fully reverted.

### Current branch head

Resolve from live PR #366 head after this evidence write.

### Next action

Run final immutable-head full CI on the restored eight-file CSS ownership diff. No further branch writes are planned. If the visual gate repeats the already classified moving three-pixel host variation, rerun only failed jobs on the same immutable SHA without modifying code or baselines. After full green, verify the final diff and review surface, then perform expected-head squash merge, exact-SHA main CI and stage/public validation.
