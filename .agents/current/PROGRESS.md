# Current Task Progress

## 2026-08-18 12:28 +03:00

### Verified

- Live `main` is `f920fee4891426fce819c9cb2fb506599b3bc1fc` after #590 delivery reconciliation.
- #590 runtime remains deployed on Stage as `86a27e1ae91e344906137fd885dd4733cac68aec` with deploy/public smoke/public browser success.
- PR #588 is the only remaining open PR.
- PR #588 was reconstructed from corrected `main` with `behind_by=0`, mergeable=true and exactly four allow-listed files.
- Diagnostic CI #3778 / run `32119608484` ran on exact head `092a578bcf04e3ab7d4bcb98038535797058b011`.
- All structural/runtime checks for the 20 new 320×700 Light/Dark states passed before the deliberate visual review gate.
- Authoritative Linux Visual artifact #9318281585 has digest `sha256:6066e9fc393afe1f1052cdf836d63a645df2e1f3b65d10972e9ab7da9094ac20`.
- All 20 exact PNGs were manually reviewed after the #589 Learn contrast and #590 Phrase Detail width fixes.
- Initial/retry 320×700 captures are byte-stable for all 20 states.
- Existing 768×1024 and 1440×1024 fingerprints reproduced unchanged in the diagnostic run.
- The 20 reviewed fingerprints were committed to `frontend/e2e/route-tablet-parity.spec.ts`; resulting source blob is `6f005e069c1cfdcdf74c271f14611d64c55654dd`.

### Finding

The corrected runtime now satisfies the minimum-supported 320×700 route-parity contract across all ten canonical routes in both explicit appearances. No additional runtime defect was found during manual review.

### Root cause of earlier audit failures

The original fail-closed audit correctly exposed two runtime issues before baseline approval:
- #589: compact Learn Light heading contrast;
- #590: minimum-width Phrase Detail readable width.

Both were delivered and Stage-verified before the audit was reconstructed.

### Changed files

- `frontend/e2e/route-tablet-parity.spec.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Checks passed

- #589 delivered and reconciled.
- #590 immutable-head CI, exact-main CI, Stage/public gate and reconciliation succeeded.
- Reconstructed #588 diagnostic structural/runtime checks succeeded for all 20 minimum-mobile states.
- Manual review of all exact authoritative Linux PNGs completed.
- Reviewed hashes, dimensions, source run and source head provenance are now recorded.

### Checks failed

Diagnostic Visual intentionally concluded failure only because the 20 entries were still `REVIEW_REQUIRED`. That fail-closed condition has now been replaced by the manually reviewed exact fingerprints.

### Current branch head

Resolve from live branch ref after current-task documentation synchronization.

### Next action

Freeze the resulting head, require a full immutable-head CI to reproduce all approved fingerprints, then perform the final diff/review/main-drift gate and squash-merge PR #588 only with expected-head protection.
