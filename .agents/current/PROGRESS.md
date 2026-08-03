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

### Root cause

Adaptive navigation shell selectors had equal specificity to legacy premium and mobile-PWA selectors, so intended compact/tablet ownership depended on root stylesheet import order. Resource-stack width is a different ownership concern and remains explicitly unresolved.

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
- authoritative CI #2606/run `30827173353` confirmed backend and accessibility gates passed and emitted the exact parser-derived inventory;
- generated manifest Git blob SHA `957b5ae5c79f8236c4270076876552699f61f323` matched the locally computed Git blob SHA before fast-forward attachment;
- all successful writes were read back by exact branch ref;
- main remained unchanged after every write.

### Checks failed

- CI #2606 frontend core failed only on intentionally stale manifest/count contracts and the initial incorrect assumption that all six mobile → adaptive conflicts belonged to the shell. The parser proved that `.lx-resource-stack | width` is a separate retained conflict.
- The stale contracts have now been corrected from authoritative output; a new full CI run is pending.

### Current branch head

Resolve from live PR #366 head after the current documentation write.

### Next action

Update execution evidence and PR description, then inspect the next full CI run. Fix only exact failures within the declared eight-file boundary; after immutable-head green, verify review surface and deliver through expected-head squash merge, exact-SHA main CI and stage/public validation.
