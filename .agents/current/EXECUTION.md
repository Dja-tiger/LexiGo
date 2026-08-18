# Current Task Execution

## Task

- Branch: `test/issue-587-min-mobile-route-parity`
- Base SHA: `f920fee4891426fce819c9cb2fb506599b3bc1fc`
- Head SHA: resolve from live branch ref after documentation synchronization
- PR: #588

## Skills used

### GitHub repository workflow

Purpose:
Reconstruct and finish the existing fail-closed minimum-mobile audit PR on corrected live `main`.

Instruction source:
`AGENTS.md`, `.agents/AGENTS.md`, `.agents/SKILLS.md`, issue-specific CSS/phrases guidance, and `docs/agent-harness.md`.

Version or verification date:
2026-08-18.

Inputs:
Issue #587, PR #588, corrected `main`, delivered child fixes #589/#590, reconstructed audit owner, diagnostic CI/artifact evidence.

Files inspected:
- `AGENTS.md`
- `.agents/**` harness owners
- `frontend/e2e/route-tablet-parity.spec.ts`
- live PR/Issue/CI/Stage metadata
- authoritative Linux Visual artifact #9318281585, including all 20 exact 320×700 Light/Dark PNGs

Actions performed:
- Verified #590 runtime delivery and post-merge reconciliation are complete.
- Reconstructed PR #588 atomically from `main@f920fee4891426fce819c9cb2fb506599b3bc1fc` without reviving stale harness history.
- Verified reconstructed diff is exactly four allow-listed files and `behind_by=0`.
- Ran diagnostic CI #3778 / run `32119608484` on head `092a578bcf04e3ab7d4bcb98038535797058b011`.
- Confirmed all 20 minimum-mobile states reached the deliberate `REVIEW_REQUIRED` gate only after ownership, reduced-motion, overflow, clipping/focus and runtime-error assertions passed.
- Downloaded authoritative Linux Visual artifact #9318281585 with digest `sha256:6066e9fc393afe1f1052cdf836d63a645df2e1f3b65d10972e9ab7da9094ac20`.
- Manually reviewed every exact 320×700 PNG in Light and Dark after #589/#590 landed.
- Confirmed initial/retry captures are byte-stable for all 20 states.
- Confirmed existing 768×1024 and 1440×1024 visual fingerprints remain unchanged.
- Replaced only the 20 `REVIEW_REQUIRED` minimum-mobile entries with exact reviewed width/height/SHA256/source-run/source-head values.
- Verified the committed audit owner blob `6f005e069c1cfdcdf74c271f14611d64c55654dd` exactly matches the locally constructed reviewed source.

Commands or procedures:
GitHub connector live reads/writes, content-addressed branch reconstruction, diagnostic CI inspection, authoritative artifact download, exact PNG review, exact fingerprint commit, then final immutable-head CI and merge gates.

Artifacts produced:
- Diagnostic Visual artifact #9318281585.
- Reviewed 20-state 320×700 baseline map in `frontend/e2e/route-tablet-parity.spec.ts`.

Result:
Manual review completed with no additional runtime defect. Reviewed minimum-mobile fingerprints are committed and ready for immutable-head reproduction.

Failures:
Diagnostic Visual was intentionally red because all 20 minimum-mobile entries were fail-closed `REVIEW_REQUIRED` placeholders.

Root cause:
Expected verification policy, not a product or infrastructure failure. The placeholders intentionally block approval until exact Linux evidence is manually reviewed.

Fallback:
If the later immutable-head run does not reproduce any reviewed fingerprint exactly, do not widen tolerance or update snapshots; classify the exact state and investigate runtime/environment drift.

Limitations:
PR #588 is not mergeable by policy until the new final immutable head completes full CI, reviews are clean, and main has not drifted.

Reusable lesson:
A fail-closed responsive audit can safely approve a non-canonical minimum width only when structural/runtime ownership checks pass first, exact authoritative PNGs are manually reviewed, retries are byte-stable, and the reviewed fingerprints are reproduced on a later immutable head.
