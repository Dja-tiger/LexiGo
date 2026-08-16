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
- Runtime defect Issue #565 / PR #566 / merge `263fe7457d741d184885810a779ee7d3b79593ab`.
- Successful #566 PR-head CI #3692, exact-main CI #3693 and exact-SHA Stage #3545.
- Active OpenPencil First Use screen map and canonical geometries.
- #564 reconstructed CI #3694 / run `31976982547` and exact Linux visual artifact #9271382750.

Files inspected:

- `frontend/e2e/first-use-visual.spec.ts` on old #564 head, corrected `main` and reconstructed branch.
- `.agents/current/**` on corrected `main` and reconstructed branch.
- PR #564 diff, metadata, reviews and review threads.
- PR #566 delivery evidence and exact-main/Stage status.
- Exact Linux First Use desktop PNGs from artifact #9271382750.
- Active OpenPencil references for Guest Light/Dark `n321/n493` and Resume Light/Dark `n378/n550`.

Actions performed:

- Confirmed #564 was non-mergeable after #566 because both touched First Use visual evidence.
- Confirmed #564 had no reviews/threads and no head movement before reconstruction.
- Force-moved only `feat/issue-563-first-use-parity` from recorded old head to exact new `main`; no `main` mutation occurred.
- Reapplied the #563 typed visual contract with `screenMapKey`, OpenPencil node, route and canonical viewport for each baseline.
- Kept canonical desktop evidence at 1440×900 and compact evidence at 390×844.
- Kept active screen-map validation fail closed.
- Kept local `Не уверен` selection in the canonical Resume fixture rather than fabricating server state.
- Ran reconstructed CI #3694. Frontend core passed; Visual regression failed only the four expected canonical desktop fingerprints while 77 executed visual checks passed.
- Downloaded exact Linux artifact #9271382750, digest `sha256:0ffef81c3306dc08a2c11fe7b1e042d8f5b6a8b241039a5094514b088a40f3cc`.
- Manually compared every changed 1440×900 PNG to its active OpenPencil node before approval.
- Approved only the four reviewed deterministic hashes:
  - `n321` Guest Light: `1675a56bf2a31716b6ce7c8dc52bffed9f42190e9743ae88a7c411b59046da79`
  - `n493` Guest Dark: `a60bd586f61bf9ecc71bc9f28e8e549593361d2ae3badb8b60faa73c37050063`
  - `n378` Resume Light: `4da3f3589f396a164a05677dfe545167c1647521afde6b206048d7cd4142eae2`
  - `n550` Resume Dark: `abe2f9c7c180accf73bb6e7771845a85610a89cdee42e170d12787acc4c62e80`
- Did not use snapshot regeneration/update mode and did not modify runtime, backend, API, design, workflow or deploy files.

Commands or procedures:

Connector-first PR/ref/diff verification, exact-head CI inspection, guarded branch ref reconstruction, contents-API writes, deterministic Linux visual execution, artifact download, manual image-by-image OpenPencil review and explicit SHA-256 approval.

Artifacts produced:

- Reconstructed PR #564 branch on top of runtime merge `263fe745…`.
- Canonical First Use provenance contract in `frontend/e2e/first-use-visual.spec.ts`.
- Reviewed Linux artifact #9271382750 with four approved canonical desktop fingerprints.
- Updated current-task harness records.

Result:

PR #564 now inherits the delivered #566 runtime repair in its base and contains only evidence/test/harness changes. All four canonical 1440×900 desktop First Use fingerprints have been manually reviewed and explicitly approved against their active OpenPencil references. The branch is ready to be frozen for one final immutable-head CI run.

Manual review conclusions:

- Guest Light/Dark: route/state ownership, two-column hierarchy, actions, preview surface and canonical geometry match the active reference family; no overflow/clipping or new functional layout defect was found. Some typography/button-size differences remain but are not masked by changing accessibility-safe runtime tokens in a test-only PR.
- Resume Light/Dark: the #566 repair produces the approved intro + single diagnostic surface hierarchy with selected `Не уверен`, saved-progress note and actions. The prior nested surface/progress-track mismatch is gone.
- Intentional runtime-truth divergences are preserved: authenticated runtime does not render the guest login action; `DiagnosticPrompt.topic` remains dynamic server content instead of an unavailable design-demo sentence; typography/tone differences are documented rather than hidden by fixtures.

Failures:

- Historical #564 CI #3686 exposed the runtime defect and is superseded by #566.
- Reconstructed #564 CI #3694 intentionally failed closed on four unapproved canonical desktop fingerprints before manual review. That failure is the approval gate working as designed, not a runtime regression.

Root cause:

The parity audit and runtime repair were intentionally split for scope safety. Once the runtime repair merged, the evidence branch had to be reconstructed so canonical provenance logic sat on top of the corrected runtime. Migrating desktop evidence from legacy 1440×1024 runtime captures to exact active 1440×900 design frames necessarily changed deterministic hashes and required fresh manual approval.

Fallback:

If final immutable-head CI shows a non-visual failure, diagnose it without changing runtime files. If any approved visual hash changes again on the same deterministic environment, keep the gate red and inspect the exact new Linux artifact; never auto-update snapshots or weaken provenance/geometry assertions.

Limitations:

- #564 validates canonical First Use route-level design evidence, not the full umbrella #205 tablet/zoom/reduced-motion/manual matrix.
- Stage redeploy is not required after #564 because it changes no runtime code.

Reusable lesson:

When an evidence-only PR discovers a runtime defect that must be repaired separately, land and validate the runtime fix first, then reconstruct the evidence branch from the corrected runtime base. When canonical viewport semantics change, old reviewed fingerprints are only starting evidence: obtain a fresh deterministic Linux artifact, compare exact outputs to the active design source, and approve hashes explicitly only after manual review.
