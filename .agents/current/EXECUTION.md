# Current Task Execution

## Task

- Branch: feat/issue-563-first-use-parity
- Base SHA: 263fe7457d741d184885810a779ee7d3b79593ab
- Head SHA: resolve from live branch ref
- PR: #564

## Skills used

### GitHub repository engineering / OpenPencil parity evidence

Purpose:

Reconcile the First Use canonical design-parity evidence PR with the separately delivered runtime repair, without reverting runtime code or weakening content-addressed Linux approval semantics.

Instruction source:

- `AGENTS.md`
- `.agents/AGENTS.md`
- applicable specialized Agent Harness rules
- `.agents/SKILLS.md`
- `docs/agent-harness.md`
- connected GitHub plugin skill
- active OpenPencil mapping in `docs/figma/openpencil-screen-map.json`

Version or verification date:

2026-08-17, reconstructed from exact runtime merge `263fe7457d741d184885810a779ee7d3b79593ab`.

Inputs:

- Issue #563 / Draft PR #564 and old head `fafec6e19f9195b73b79eb0d75a69ffd09d74b30`.
- Runtime defect Issue #565 / PR #566.
- PR #566 manually reviewed Linux fingerprints.
- Successful PR-head CI #3692 and exact-main CI #3693.
- Active OpenPencil First Use screen map and canonical geometries.

Files inspected:

- `frontend/e2e/first-use-visual.spec.ts` on old #564 head and new `main`.
- `.agents/current/**` on new `main`.
- PR #564 diff, metadata, reviews and review threads.
- PR #566 delivery evidence and exact-main CI.

Actions performed:

- Confirmed #564 was non-mergeable after #566 because both touched First Use visual evidence.
- Confirmed #564 had no reviews/threads and no head movement before reconstruction.
- Force-moved only `feat/issue-563-first-use-parity` from recorded old head to exact new `main`; no `main` mutation occurred.
- Reapplied the #563 typed visual contract with `screenMapKey`, OpenPencil node, route and canonical viewport for each baseline.
- Kept canonical desktop evidence at 1440×900 and compact evidence at 390×844.
- Kept runtime/source-map validation fail closed.
- Kept the local `Не уверен` selection in the canonical Resume fixture.
- Rebased the Resume starting fingerprints onto the manually reviewed #566 runtime hashes instead of reintroducing stale pre-fix hashes.
- Updated task/progress/execution records to separate runtime delivery from canonical evidence approval.

Commands or procedures:

Connector-first PR diff/ref verification, exact-head CI inspection, guarded branch ref reconstruction, sequential contents-API writes and planned immutable-head CI/manual artifact review.

Artifacts produced:

- Reconstructed PR #564 branch on top of runtime merge `263fe745…`.
- Canonical First Use provenance contract in `frontend/e2e/first-use-visual.spec.ts`.
- Updated current-task harness records.

Result:

PR #564 now inherits the delivered #566 runtime repair in its base and contains only evidence/test/harness changes. It no longer carries stale pre-fix Resume fingerprints. Canonical 1440×900 desktop hashes remain unapproved until the next exact Linux artifact is manually reviewed.

Failures:

- Historical #564 CI #3686 exposed the runtime defect and therefore cannot be treated as final canonical approval evidence.
- The old #564 branch became non-mergeable after #566 changed the same visual spec; this was resolved by deterministic branch reconstruction rather than conflict-marker editing or runtime rollback.

Root cause:

The parity audit and runtime repair were intentionally split for scope safety. Once the runtime repair merged, the test-only branch had to be reconstructed so canonical provenance logic sat on top of the corrected runtime and its reviewed starting fingerprints.

Fallback:

If the reconstructed immutable-head CI shows non-visual failures, diagnose those directly without changing runtime files. If canonical desktop hashes differ, keep the gate red until exact Linux PNGs are manually reviewed; never use update-snapshot as approval.

Limitations:

- #564 validates canonical First Use route-level design evidence, not the full umbrella #205 tablet/zoom/reduced-motion/manual matrix.
- Stage redeploy is not required after #564 because it changes no runtime code.

Reusable lesson:

When an evidence-only PR discovers a runtime defect that must be repaired separately, land and validate the runtime fix first, then reconstruct the evidence branch from the corrected runtime base. Never resolve the resulting conflict by restoring stale fingerprints or allowing test code to mask the production fix.
