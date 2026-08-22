# Current Task Execution

## Task

- Issue: #642
- Branch: `test/issue-642-first-use-loading-error-visual`
- Base SHA: `0fce4b690a6fbff95dd2d4ec6c5e725a21700d9d`
- Head SHA: resolve from live branch ref after reconstructed commit
- PR: #645

## Skills used

### GitHub repository operations

Purpose: reconstruct an evidence branch on exact current `main` without carrying stale runtime history, preserve a four-file atomic diff and obtain immutable-head Linux visual provenance.

Instruction source: root `AGENTS.md`, `.agents/AGENTS.md`, `.agents/AGENTS.base.md`, `.agents/AGENTS.tool-selection.md`, `docs/agent-harness.md`, Issue #642 and repository visual-evidence rules.

Version or verification date: live repository state revalidated on 2026-08-22.

Inputs: `main=0fce4b690a6fbff95dd2d4ec6c5e725a21700d9d`, Issue #642, Draft PR #645, prior head `93eb5733d6250eb159b76e23862c88b14c9c006f`, CI #3969 / run `32539008972`, Visual artifact `9466508067`, delivered runtime #647/#648 and active OpenPencil artifact `9448087269`.

Files inspected: PR metadata/diff, `frontend/e2e/first-use-visual.spec.ts`, current `frontend/app/first-use.css`, delivered `frontend/components/lexigo-onboarding-app.tsx`, Issue #647 / PR #648 evidence, Agent Harness templates/current state, prior Linux visual artifact and exact OpenPencil renders.

Actions performed: re-audited live refs; confirmed #656 delivery and reconciliation were complete; downloaded and manually compared the prior eight-state Linux artifact; rejected stale hashes because desktop loading still showed the compact note on the older head; confirmed current `main` contains the later desktop visibility reassertion; prepared a new single-parent reconstruction using the existing test blob and current task-local docs.

Commands or procedures: GitHub connector reads, workflow jobs/logs/artifact download, local artifact unzip/SHA-256 and side-by-side visual inspection, Git Data blob/tree/commit/ref workflow, compare audit and exact-head CI monitoring.

Artifacts produced: diagnostic side-by-side comparisons of old Linux actuals versus OpenPencil references; reconstructed Draft PR #645 head; subsequent fresh Linux PNG/JSON evidence artifact.

Result: pending branch ref update and fresh current-main immutable CI.

Failures: prior CI #3969 intentionally failed Visual regression because all eight new baselines were `REVIEW_REQUIRED`; aggregate Frontend quality failed only as a consequence. No semantic/core/backend/browser gate failed. The prior desktop loading actuals were not approved because they exposed a stale-base visibility mismatch.

Root cause: evidence hashes bind to the exact tested runtime. The previous PR head predates a later CSS specificity fix now present on `main`, so its desktop loading screenshots are not authoritative for current production code.

Fallback: if the fresh Visual job fails before reaching `REVIEW_REQUIRED`, inspect exact logs/artifacts and repair only the evidence owner if the defect is test-local. If fresh current-main actuals still expose a product mismatch, keep #645 fail-closed and create a separate runtime issue/PR.

Limitations: OpenPencil render hashes and Linux browser screenshot hashes are different evidence domains; only the fresh Linux actuals from the reconstructed current-main head may become runtime fingerprints.

Reusable lesson: never approve a visual fingerprint merely because the state and test are deterministic; first prove that the exact branch contains the latest delivered runtime/CSS and manually compare that exact artifact with its design node.

### OpenPencil visual evidence

Purpose: bind every loading/error screenshot to the active repository-owned design source and preserve fail-closed approval semantics.

Instruction source: Issue #642, `.agents/AGENTS.progress-pr214.md`, Issue #74 visual collection rules and the delivered #647 repair evidence.

Inputs: OpenPencil source SHA `6d73b785aaeb7dda35a53c9c5f16edfc9cbef1092dbce992183538f16505520e`; acceptance run `32486519368`; artifact `9448087269`; digest `sha256:6613ec5c6680ff962e2612c366aba454a7ab815212e2b1a763a9f4c085b95689`; nodes `n117/n128/n277/n288/n442/n456/n614/n628`.

Files inspected: all eight active OpenPencil loading/error PNGs and node exports, the previous Linux actuals, current runtime/CSS and `docs/figma/openpencil-screen-map.json` contract through the existing visual owner.

Actions performed: retained exact key/node/route/viewport bindings; retained canonical error copy; kept all new fingerprints at `REVIEW_REQUIRED`; manually classified the old mobile/error states as structurally aligned but rejected the old desktop-loading fingerprints because the stale branch rendered an extra compact callout that current `main` now suppresses.

Commands or procedures: authoritative `frontend/e2e/first-use-visual.spec.ts`, exact PNG SHA-256 attachments/JSON provenance, artifact digest verification and side-by-side review.

Artifacts produced: fresh eight Linux actual PNGs and JSON records will be produced by the next immutable Visual regression run.

Result: pending fresh current-main evidence.

Failures: historical pre-repair evidence triggered #647; the later #3969 evidence was test-semantically correct but stale relative to current `main`, so it is diagnostic only.

Root cause: visual approval must follow current runtime, not merely a previously reconstructed evidence branch.

Fallback: approve no hash until every fresh current-main actual is reviewed against its exact active node.

Limitations: no fuzzy tolerance, snapshot update mode or Figma Cloud dependency is permitted.

Reusable lesson: a fail-closed visual pipeline can correctly identify both product defects and stale-branch evidence; treat both as reasons not to bless hashes.
