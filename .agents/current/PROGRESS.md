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

Final immutable-head CI #2614/run `30829924223` exposed a separate Linux visual determinism defect on unchanged production code:

- first visual build failed only `compact Dictionary empty light`;
- same-SHA failed-job rerun passed that case and failed only `Profile compact light`;
- both builds checked out the same synthetic merge `00c371d4538ebe561be53453826134d446074555` with the same `APP_BUILD_ID`;
- loaded CSS URLs, order, lengths and byte hashes were identical;
- each failing PNG differed from its approved exact hash at exactly three pixels, with maximum per-channel drift of one RGB unit;
- the two runs used different heterogeneous Azure hosts;
- no CSS, component, snapshot, baseline hash or route budget changed between the previously green product head and the failing immutable head; only `.agents/current/PROGRESS.md` and `.agents/current/EXECUTION.md` had changed.

The visual project now launches Chromium with the single explicit argument `--disable-skia-runtime-opts`, forcing Skia's baseline raster path instead of host-CPU runtime optimizations. The approved exact hashes remain unchanged, and the focused source contract fails closed on any additional launch argument or pixel-tolerance replacement.

### Root cause

Adaptive navigation shell selectors had equal specificity to legacy premium and mobile-PWA selectors, so intended compact/tablet ownership depended on root stylesheet import order. Resource-stack width is a different ownership concern and remains explicitly unresolved.

The final visual failures were not stable UI regressions. Their three-pixel, one-channel-unit drift moved between unrelated screenshots on the same immutable source and identical assets, which isolates host-CPU-dependent Skia raster optimization as the remaining non-deterministic input.

### Changed files

- `.agents/current/TASK.md`;
- `.agents/current/PROGRESS.md`;
- `.agents/current/EXECUTION.md`;
- `frontend/app/adaptive-navigation.css`;
- `frontend/app/global-feature-style-overlap-manifest.json`;
- `frontend/app/global-feature-style-overlap-manifest.test.ts`;
- `frontend/components/navigation-mobile-shell-css-ownership.test.ts`;
- `frontend/e2e/navigation-mobile-shell-cascade.spec.ts`;
- `frontend/playwright.visual.config.ts`.

### Checks passed

- mandatory Agent Harness and specialized Issue #70 rules re-read;
- live main, Issue, PR inventory, prior CI and stage evidence verified;
- branch created from exact main;
- adaptive selector values and media boundaries preserved;
- adversarial adaptive-first Chromium matrix added for 390, 719, 720, 760, 761 and 1024 px;
- authoritative CI #2606/run `30827173353` emitted the exact parser-derived inventory used to correct the stale contracts;
- generated manifest Git blob SHA `957b5ae5c79f8236c4270076876552699f61f323` matched the locally computed Git blob SHA before fast-forward attachment;
- corrected full CI #2612/run `30829015122` passed on head `77b90f554501db881ba735da380ec82359beda84` without retry;
- frontend lint, TypeScript, complete unit/source suite, production build and dependency audit passed;
- backend unit/security and race-enabled integration passed;
- accessibility, iOS PWA, Lesson completion, performance budgets, both UI shards, Linux visual regression, CSP, controlled service worker and Dictionary smoke passed;
- aggregate Frontend quality and both API/Web container builds passed;
- CI #2614/run `30829924223` passed every non-visual gate on immutable head `4f973116616f28a81c764e8de5c8d4dd5135e151` in both the original run and same-SHA failed-job rerun;
- exact visual artifact analysis confirmed both failures were three-pixel, one-RGB-unit raster drift with identical source/assets rather than presentation changes;
- the deterministic Skia launch flag is protected by a focused source contract;
- no snapshot, baseline hash, route budget, timeout, dependency or production declaration-value change was required;
- all successful writes were read back by exact branch ref;
- main remained unchanged after every write.

### Checks failed

- CI #2606 frontend core failed only on intentionally stale manifest/count contracts and the initial incorrect assumption that all six mobile → adaptive conflicts belonged to the shell. The parser proved that `.lx-resource-stack | width` is a separate retained conflict.
- CI #2614 visual job failed twice on the same source but on two different exact-hash screenshots. Artifact analysis identified host-CPU Skia raster drift; deterministic launch configuration is now committed and requires new immutable-head CI.

### Current branch head

Resolve from live PR #366 head after this final evidence write.

### Next action

Run one final immutable-head full CI with deterministic Skia rasterization. No further branch writes are planned. If green, verify the final nine-path diff, empty comments/reviews/unresolved-thread surface and unchanged main; then mark Ready and perform expected-head squash merge followed by exact-SHA main CI and stage/public validation.
