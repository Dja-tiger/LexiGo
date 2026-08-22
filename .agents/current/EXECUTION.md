# Current Task Execution

## Task

- Issue: #642
- Branch: `test/issue-642-first-use-loading-error-visual`
- Base SHA: `0fce4b690a6fbff95dd2d4ec6c5e725a21700d9d`
- Evidence collection head: `98282f9bb6a7cea9797cf4fddcf663ec7970d69f`
- Final approval head: resolve from live branch after commit
- PR: #645

## Skills used

### GitHub repository operations

Purpose: reconstruct a stale visual-evidence branch on delivered `main`, collect exact immutable Linux evidence, approve only manually reviewed content-addressed fingerprints and preserve a four-file atomic scope.

Instruction source: root `AGENTS.md`, `.agents/AGENTS.md`, applicable `.agents/AGENTS.*`, `docs/agent-harness.md`, Issue #642 and repository visual-evidence rules.

Verification date: 2026-08-22.

Inputs: current-base `0fce4b690a6fbff95dd2d4ec6c5e725a21700d9d`; Issue #642; Draft PR #645; reconstructed head `98282f9bb6a7cea9797cf4fddcf663ec7970d69f`; CI #3983 / `32582045336`; fresh Visual artifact `9478170455`; OpenPencil artifact `9448087269`.

Files inspected: PR metadata/diff, authoritative `frontend/e2e/first-use-visual.spec.ts`, current First Use runtime/CSS, all eight fresh Linux actual PNGs, all eight active OpenPencil reference PNGs and Agent Harness current-task files.

Actions performed: revalidated live refs; reconstructed #645 as a single-parent branch from current `main`; ran immutable CI; confirmed all non-visual gates green; verified Visual failed exactly eight times only at `REVIEW_REQUIRED`; downloaded the exact Visual artifact; recomputed each PNG SHA-256; manually reviewed all eight actual/reference pairs; approved only the fresh current-head fingerprints; prepared a fast-forward fingerprint-approval commit.

Commands or procedures: GitHub connector reads/writes, Git Data blob/tree/commit/ref workflow, workflow job/log/artifact inspection, artifact digest verification, local ZIP extraction and SHA-256 recomputation, and side-by-side image review.

Artifacts produced: GitHub Actions artifact `9478170455` (`sha256:0191bada13f950d617681e92880f42bd9e4c2afaa57152e359889ada3fe7b6f0`) plus local comparison sheets used only for manual review.

Result: all eight fresh fingerprints approved for commit; final immutable CI still required.

Failures: CI #3983 intentionally failed Visual regression because the eight new entries still contained `REVIEW_REQUIRED`; aggregate Frontend quality failed only as its dependency summary. Exactly 158 visual tests passed and exactly the eight intended First Use tests failed. No product/runtime assertion failed.

Root cause: intentional fail-closed evidence collection. A previous run had also exposed stale desktop-loading CSS, so its hashes were rejected. On the current-main reconstruction the two desktop-loading hashes changed while the six unaffected cases remained stable, confirming the stale evidence was not reused.

Fallback: if final CI after committing the reviewed hashes fails semantically or any fresh screenshot changes, do not update hashes automatically. Reproduce the failure and classify it as test-local, infrastructure/browser flake or product/design mismatch before any further write.

Limitations: Linux browser screenshot hashes are exact runtime artifacts and are not interchangeable with OpenPencil export hashes. Manual review established parity; it does not claim byte equality between the two rendering engines.

Reusable lesson: visual approval must be tied to the exact current runtime/base and exact CI artifact. Deterministic stale screenshots are not valid baselines.

### OpenPencil visual evidence

Purpose: provide fail-closed provenance for First Use loading/error parity.

Instruction source: Issue #642, active repository-owned OpenPencil mapping and established Issue #74 visual collection rules.

Inputs: OpenPencil source SHA `6d73b785aaeb7dda35a53c9c5f16edfc9cbef1092dbce992183538f16505520e`; acceptance run `32486519368`; artifact `9448087269`; digest `sha256:6613ec5c6680ff962e2612c366aba454a7ab815212e2b1a763a9f4c085b95689`; nodes `n117/n128/n277/n288/n442/n456/n614/n628`.

Reviewed mappings:

- `n117` loading compact Light → `5ac755583ae348e92dd14af1e28ae97874c3072fb7f6825c36b5a9ef7df9fb8b`
- `n277` loading compact Dark → `643dcc73be33f1878765f2b6826d41e689f7ebec277ac0ce9777b9161f6d97e3`
- `n442` loading desktop Light → `448d90d81985018b383454f905371379831f475fbc24be3b1e95822bf11b814d`
- `n614` loading desktop Dark → `f9f88c3000aad5445d4bd1139cf81face075838b82d3f776d80227aa7c511a9e`
- `n128` error compact Light → `e4b0f198fff3a41acdca84f23b07b82250affae262a3c95719fed43c1c402e49`
- `n288` error compact Dark → `03983eea1fc462f0e667deba5246952bfcf247da24a3cef4c3f33eec3320a7b3`
- `n456` error desktop Light → `1175fc95ac3085e4fc3b748cc4ffd6f4f032fe4dfe29a46d209d18bd1569a3fa`
- `n628` error desktop Dark → `6cfbf773756e934a50e8b30a30a896399d3efd328fd2c101539d020b89682a06`

Manual review result: accepted. Mobile reference exports include device/status-bar framing that is intentionally outside the browser runtime capture, but route content, hierarchy, copy, controls, theme and canonical content viewport align. Desktop loading now omits the stale compact callout and aligns with the intended desktop note owner.

No OpenPencil source, screen-map entry, runtime CSS/React, workflow or binary snapshot is modified by the approval commit.
