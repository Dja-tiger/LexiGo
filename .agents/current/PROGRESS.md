# Current Task Progress

## 2026-08-16 03:10 Europe/Moscow

### Verified

- Exact base `main`: `01fad069e74f1675f7ea6bddda6b0b9cbd9fe4d9` after docs reconciliation PR #544.
- Atomic Issue #545 exists under Figma parity umbrella #205.
- Draft PR #546 is open from `test/issue-545-dictionary-empty-renderer-equivalence` and is mergeable.
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
- `.agents/current/EXECUTION.md`
- `frontend/e2e/system-states-visual.spec.ts`

No production React/CSS/runtime, PNG baseline, workflow, package, lockfile or Playwright configuration file is changed.

### Implementation

`SYSTEM_STATE_VISUAL_BASELINES` distinguishes the primary Figma-approved SHA from optional exact renderer-equivalent SHA values.

Only `compact-empty-light` registers `dd2d...` as renderer-equivalent. All other states keep only their original primary SHA.

The existing two-capture invariant remains ordered before fingerprint acceptance:

1. capture raw PNG twice after stable layout barriers;
2. require capture 2 SHA to equal capture 1 SHA exactly;
3. then require that exact SHA to be the primary approved fingerprint or a specifically reviewed renderer-equivalent fingerprint for that state.

No numerical pixel tolerance, threshold, screenshot update mode, retry weakening or production change was introduced.

### Checks passed

- Changed-file audit: exactly four allowed files.
- Primary `e140...` value remains unchanged.
- Only `compact-empty-light` has `rendererEquivalentSha256`.
- Consecutive-capture exact equality still executes before accepted-fingerprint lookup.
- Initial PR CI #3581 / run `31916209356` on developer head `49c6bb6c098a17539f29fce03ced4064ebfa28b4`:
  - classify change scope: success;
  - frontend core quality: success;
  - backend unit/security: success;
  - backend integration: success;
  - lesson completion, content security, iOS PWA dictionary, accessibility, performance budgets, controlled service worker, Dictionary smoke: success;
  - authoritative Visual job `95088422936`: success on GitHub-hosted worker in Azure `centralus`, Ubuntu 24.04.4, runner image `20260810.271.1`, Playwright digest `sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e`;
  - Visual summary: `73 passed`, `116 skipped`, zero Playwright `flaky` classification and no test retry;
  - Dictionary Empty `79:93` executed successfully in all three visual projects.

### Checks pending

- Initial CI #3581 still had UI shards 1/2 and 2/2 running at this checkpoint; all other jobs were green.
- This evidence synchronization changes the branch head, therefore a new full immutable-head CI is required and will be treated as authoritative final-head validation.
- After final-head CI, perform a second same-head Visual execution on another hosted worker if the GitHub Actions API permits rerunning a successful Visual job; otherwise record the API limitation and use an independent final-head workflow execution only if a repository-owned trigger exists.
- Final review/comments/thread audit.
- Expected-head squash merge and exact-main CI.

### Checks failed

- None attributable to the implementation.

### Current branch head

Resolve from the live branch after the paired `EXECUTION.md` evidence update.

### Next action

Finish task-memory evidence synchronization, then validate the new final head with the complete repository CI. Inspect the final-head Visual log itself for zero `flaky`, not merely job-level success; then obtain the second independent same-head renderer proof before Ready/merge.
