# Current Task Progress

## 2026-08-17 Europe/Berlin

### Verified

- Issue #568 remains open under umbrella #205; Draft PR #570 remains the authoritative fail-closed visual audit path.
- Runtime Issue #574 / PR #575 is delivered on `e9314e08cfb517388b8427dcc5ba74df69c861f7`; immutable-head CI #3729, exact-main CI #3730 and exact-SHA Stage/public #3583 are green.
- Reconciliation PR #576 merged as current `main` `f614c1646f113e1303286ca3cc759a87e6dd74d5`; exact-main Agent Docs CI #3732 is green.
- Existing #570 head `7f6efef0d3832e095900b571708f7788760d76e5` predates #575 and cannot be used as the merge base or approval source.
- Old #570 route evidence spec contains 20 `REVIEW_REQUIRED` baselines and no approved consolidated post-fix fingerprints.
- Current `frontend/playwright.visual.config.ts` includes the independently delivered #575 `home-tablet-progress-visual.spec.ts`; reconstruction must preserve it while adding `route-tablet-parity.spec.ts`.
- Draft PR #569 overlaps structural tablet coverage. Its unique useful assertion is explicit reduced-motion media verification; it remains separate until authoritative #570 coverage is finalized.

### Finding

The full tablet audit must be reconstructed again because #575 changed authenticated Home presentation after the prior #570 reconstruction. The exact Linux matrix must be recaptured from current runtime; neither the pre-#572 nor pre-#575 artifacts are valid approval by inheritance.

### Root cause

Fail-closed #568 evidence correctly caused two independent runtime repair cycles: #572 for Learn/Phrases/Profile and #575 for Home spacing. Each runtime change invalidates the old evidence branch as a post-fix approval base.

### Changed files

Planned reconstructed diff from current `main`:
- `frontend/e2e/route-tablet-parity.spec.ts`
- `frontend/playwright.visual.config.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Checks passed

- #575 immutable-head, exact-main and Stage/public gates are green.
- #576 lightweight PR CI #3731 and exact-main CI #3732 are green.
- Live `main` and PR #570/#569 ownership were re-read before reconstruction.
- PR #569/#570 diffs were compared; #570 is the stronger combined structural + content-addressed visual owner.

### Checks failed

- None on the new reconstruction yet. The first Visual run is expected to fail intentionally at `REVIEW_REQUIRED` if all structural assertions pass.

### Current branch head

Resolve from live branch ref after reconstruction commit.

### Next action

Force-reconstruct `test/issue-568-tablet-parity` from exact `main` `f614c1646f113e1303286ca3cc759a87e6dd74d5`, preserving current runtime/config additions and restoring only the fail-closed #568 evidence contract. Update PR #570 provenance, run immutable CI, download the exact Linux Visual artifact and manually review every one of the 20 PNGs before any fingerprint write.
