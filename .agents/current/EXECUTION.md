# Current Task Execution

## Task

- Issue: #545 — [High][Figma][CI] Зафиксировать renderer equivalence для Dictionary Empty 79:93
- Branch: `test/issue-545-dictionary-empty-renderer-equivalence`
- Base SHA: `01fad069e74f1675f7ea6bddda6b0b9cbd9fe4d9`
- Head SHA: resolve from live branch ref after this evidence update
- PR: #546 — `test(figma): scope Dictionary renderer-equivalent hash`

## Skills used

### Figma evidence handling

Purpose:

Preserve canonical Figma ownership while live canvas access is quota-blocked and distinguish reviewed renderer variance from a design change.

Instruction source:

- `AGENTS.md`
- `.agents/AGENTS.md`
- `.agents/AGENTS.base.md`
- `.agents/AGENTS.tool-selection.md`
- `.agents/SKILLS.md`
- `.agents/PROJECT_STATE.md`
- `docs/agent-harness.md`
- Figma MCP usage skill
- Issue #518 / PR #520 evidence
- Profile PR #543 CI artifacts

Version or verification date:

2026-08-16 Europe/Moscow.

Inputs:

- Canonical Figma node `79:93` at `390x844`.
- Primary reviewed SHA `e140551792a87445af08658ed78439638918b174b4b1a0e3d36448ef1ce7dbdf`.
- Hosted renderer SHA `dd2d0c587d648a01c1fc2d851fcea21f881716acf743268779f6132d15322ff6`.
- CI #3574 Visual jobs `95073618389` and `95074585326`.
- Historical #3486 evidence from Issue #518.
- Initial PR #546 CI #3581 / run `31916209356`, developer head `49c6bb6c098a17539f29fce03ced4064ebfa28b4`.

Files inspected:

- `frontend/e2e/system-states-visual.spec.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `.agents/PROJECT_STATE.md`
- PR #520 and Issue #518
- PR #546 live metadata and CI jobs
- authoritative Playwright logs for Visual jobs
- downloaded authoritative Playwright visual report containing both `e140...` and `dd2d...` captures

Actions performed:

- Re-ran live Figma metadata access and confirmed the Starter-plan tool-call limit still blocks fresh cloud inspection.
- Reconstructed the original and rerun Visual job behavior from GitHub Actions logs rather than relying on the prior success label alone.
- Determined that the same-head Profile rerun still contained `1 flaky`; it therefore did not establish deterministic rendering.
- Compared the two authoritative PNG rasters directly and localized the variance to three one-LSB antialias pixels on the calendar-reminder control.
- Created Issue #545 with exact acceptance boundaries.
- Created an atomic branch from verified exact main.
- Updated only the existing System State visual owner plus current task evidence.
- Opened Draft PR #546 and ran repository-owned CI.
- Inspected the authoritative Visual job log instead of treating a green status as sufficient evidence.

Commands or procedures:

- GitHub live-state reconstruction and workflow/job-log inspection.
- Playwright artifact download and direct pixel comparison.
- Exact SHA-256 comparison; no OCR or perceptual thresholding.
- Repository contents API writes on the atomic branch.
- GitHub Actions job-level log inspection for explicit passed/skipped/flaky classification.

Artifacts produced:

- Issue #545.
- Branch `test/issue-545-dictionary-empty-renderer-equivalence`.
- Draft PR #546.
- Scoped test-contract change in `frontend/e2e/system-states-visual.spec.ts`.
- Task-memory evidence describing the runner split and validation semantics.

Result:

The visual contract keeps `e140...` as the primary Figma-approved SHA and allows `dd2d...` only as an exact renderer-equivalent SHA for `compact-empty-light`. Two consecutive captures must still be bit-identical before fingerprint acceptance, and an unreviewed third SHA still fails.

Initial PR #546 Visual validation succeeded cleanly on GitHub-hosted `centralus`:

- job `95088422936`;
- Ubuntu 24.04.4 / runner image `20260810.271.1`;
- Playwright image digest `sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e`;
- `73 passed`, `116 skipped`;
- zero `flaky` classification and no test retry;
- Dictionary Empty `79:93` passed in all three configured visual projects.

The evidence write itself changes the PR head. Therefore the next complete CI on the new head, not CI #3581, is the immutable final-head gate.

Failures:

No implementation failure identified. Existing `/api/v1/performance/rum` proxy `ECONNREFUSED` diagnostics appear in the Visual web-server log but are non-fatal, pre-existing and outside this atomic renderer-equivalence scope; the full Visual suite still completed cleanly.

Root cause:

Hosted runner antialias rasterization variance at three RouteChrome calendar-reminder edge pixels after semantic/data/layout stabilization.

Fallback:

If final CI produces an unreviewed third SHA or consecutive captures diverge within one attempt, do not broaden the allow-list or add tolerance. Inspect the new authoritative artifact and classify it before any source change.

If GitHub refuses a deliberate rerun of a successful Visual job, do not misrepresent that as a second-worker proof. Use only an actual independent same-head execution if a supported repository-owned trigger exists, or retain Draft state until the acceptance proof can be produced.

Limitations:

Fresh Figma cloud inspection remains blocked by MCP quota. This slice relies on the already approved canonical node and directly inspected CI artifacts; it does not claim fresh Figma synchronization.

Reusable lesson:

A job-level success produced by Playwright retry is not evidence of deterministic visual rendering. For a proven host-specific final-raster split, preserve the primary design fingerprint, require stable repeated capture inside one attempt, and scope any independently reviewed equivalent raw fingerprint to the single affected state rather than introducing broad tolerance.
