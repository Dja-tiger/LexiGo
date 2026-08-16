# Current Task Progress

## 2026-08-16 03:00 Europe/Moscow

### Verified

- Exact base `main`: `01fad069e74f1675f7ea6bddda6b0b9cbd9fe4d9` after docs reconciliation PR #544.
- No open PR existed before starting this slice.
- Atomic Issue #545 exists under Figma parity umbrella #205.
- Canonical Dictionary Empty source remains Figma node `79:93`, viewport `390x844`.
- Primary approved SHA-256 remains `e140551792a87445af08658ed78439638918b174b4b1a0e3d36448ef1ce7dbdf`.
- Independently reviewed hosted-renderer SHA-256 is `dd2d0c587d648a01c1fc2d851fcea21f881716acf743268779f6132d15322ff6`.
- Fresh Figma MCP access remains unavailable because the connected Starter-plan tool-call quota is exhausted; no new cloud state is inferred.

### Finding

The previous #518/#520 lifecycle stabilization is necessary but insufficient for raw PNG identity across hosted workers.

Authoritative Profile CI #3574 / run `31909934661` proved:

- Visual job `95073618389` rendered `dd2d...` on both initial execution and Playwright retry even after semantic reminder hydration and stable-layout barriers;
- same-head Visual rerun job `95074585326` completed successfully only through Playwright retry and still reported `1 flaky`, so it did not prove determinism;
- source, canonical Figma state and product UI were unchanged.

Artifact comparison of primary `e140...` and hosted `dd2d...` established:

- identical `390x844` geometry;
- exactly 3 differing pixels out of 329160;
- maximum absolute RGB channel delta of 1 LSB;
- coordinates `(272,7)`, `(273,15)`, `(321,18)`;
- all differences are on the antialiased edge of the RouteChrome calendar-reminder control, outside Dictionary content.

### Root cause

Hosted renderer antialias rasterization can produce one of two independently observed bit-exact fingerprints after semantic/data/layout stabilization. This is runner/rendering nondeterminism, not a product defect, Figma design change or capture-between-layout-states defect.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `frontend/e2e/system-states-visual.spec.ts`

`EXECUTION.md` is the next task-memory write before PR creation.

### Implementation

`SYSTEM_STATE_VISUAL_BASELINES` now distinguishes the primary Figma-approved SHA from optional exact renderer-equivalent SHA values.

Only `compact-empty-light` registers `dd2d...` as renderer-equivalent. All other states keep only their original primary SHA.

The existing two-capture invariant remains ordered before fingerprint acceptance:

1. capture raw PNG twice after stable layout barriers;
2. require capture 2 SHA to equal capture 1 SHA exactly;
3. then require that exact SHA to be the primary approved fingerprint or a specifically reviewed renderer-equivalent fingerprint for that state.

No numerical pixel tolerance, threshold, screenshot update mode, retry weakening or production change was introduced.

### Checks passed

- Branch/read-back inspection confirms the primary `e140...` value remains present and unchanged.
- Branch/read-back inspection confirms only `compact-empty-light` has `rendererEquivalentSha256`.
- Branch/read-back inspection confirms consecutive-capture exact equality still executes before accepted-fingerprint lookup.

### Checks failed

- None yet. Repository-owned PR CI has not run because the Draft PR has not been opened yet.

### Current branch head

Resolve from live branch after `EXECUTION.md` synchronization.

### Next action

Synchronize `EXECUTION.md`, audit the branch diff against the allowed-path boundary, open Draft PR #545 scope, then run authoritative PR CI and inspect the Visual job for zero Playwright flaky classification.
