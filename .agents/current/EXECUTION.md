# Current Task Execution

## Task

- Issue: #197 — Dictionary catalog
- Branch: `feat/issue-197-dictionary-catalog`
- Base SHA: `6f9bcd196af1f876500d2b6f700e5e7fdfb685aa`
- Head SHA before final baseline promotion: resolve from live branch ref
- PR: #233 — Draft

## Skills used

### GitHub repository operations

Purpose: reconstruct live repository state, isolate Issue #197, maintain branch-safe evidence and drive the PR through CI, merge and deployment validation.

Instruction source: `AGENTS.md`, `.agents/AGENTS*.md`, `.agents/SKILLS.md`, `docs/agent-harness.md` and the installed GitHub connector procedures.

Version or verification date: 2026-07-26.

Inputs: repository `Dja-tiger/LexiGo`, live main `6f9bcd196af1f876500d2b6f700e5e7fdfb685aa`, Issue #197, Draft PR #233 and stage Issue #12.

Files inspected: root/harness state, README, architecture, Dictionary route island, catalog presentation, navigation/history owners, catalog CSS, pagination/search primitives, visual/accessibility/keyboard/PWA/bundle/IA contracts, CI jobs, logs and artifacts.

Actions performed: created the atomic branch from exact `main`; wrote the task boundary; published Draft PR #233; classified failed CI jobs from exact logs; corrected the obsolete component reconstruction; reviewed Figma nodes; preserved current runtime owners; implemented the catalog presentation; updated focused contracts; downloaded and inspected Linux visual artifacts; isolated a nondeterministic profile-glyph boundary; converted Dictionary screenshots to masked content-addressed baselines.

Commands or procedures: live Issue/PR/main/stage verification, explicit branch-scoped writes and read-back, CI job/log/artifact inspection, SHA-256 verification, pixel-diff analysis, retry comparison and manual image review.

Artifacts produced: Figma-backed Dictionary catalog, Word Detail compatibility boundary, focused regression contracts, CI evidence for Light/Dark and the four approved content-addressed hashes recorded in `.agents/current/PROGRESS.md`.

Result: implementation and non-visual gates are production-ready; final visual hashes are approved and await promotion followed by a complete immutable-head CI run.

Failures: CI #1889 used an obsolete component shape; CI #1907 retained stale binary screenshots; CI #1908 exposed the provisional Dark baseline and profile-glyph antialias noise; CI #1909 intentionally failed while collecting the four masked calibration hashes.

Root cause: the first checkpoint was not based on the exact current component blob. The subsequent visual noise came from raw PNG hashing of an antialiased profile glyph outside the Dictionary product surface.

Fallback: restore the exact current runtime contracts before any presentation work; fail visual promotion unless Linux actuals are manually inspected; mask only the identified non-product glyph rather than widening thresholds or weakening the gate.

Limitations: PR #233 is still Draft, the approved hashes have not yet been committed, and exact squash-SHA stage validation has not yet run.

Reusable lesson: presentation redesign must be applied as a delta to the exact live component; raw screenshot hashes should exclude proven non-product antialias boundaries while retaining full deterministic coverage of the product surface.

### Figma design inspection

Purpose: obtain the exact approved Dictionary mobile/desktop hierarchy and semantic tokens instead of inferring from the existing route.

Instruction source: Issue #197 and the Figma design-to-code inspection procedure.

Version or verification date: 2026-07-26.

Inputs: LexiGo Design System `3xXmBWnf38jbvLjtziwber`, Mobile Light `78:54`, Desktop Light `78:193`.

Files inspected: Figma node contexts, screenshots and variable definitions.

Actions performed: compared approved mobile and desktop structures with the current React/CSS implementation; recorded search, quick-filter, filter-rail, result-row, pagination and status-presentation patterns; verified Linux Light actuals against those nodes and checked compact Dark against semantic tokens.

Commands or procedures: `get_design_context`, `get_variable_defs`, Linux artifact review and viewport-specific visual comparison.

Artifacts produced: verified design/state matrix and approved compact Light, compact Dark, medium Light and desktop Light evidence.

Result: the catalog presentation matches the approved hierarchy while existing API/history/island architecture remains authoritative.

Failures: no design-source failure. The initial raw visual SHA instability was outside the Dictionary surface and is isolated by the final mask.

Root cause: not applicable to the Figma source.

Fallback: block baseline promotion if actual hierarchy, contrast, overflow or interaction state diverges from the approved nodes.

Limitations: Figma uses representative content/status labels; production count and state remain derived from validated server responses.

Reusable lesson: representative Figma data is presentation evidence, not a replacement for server-owned business semantics.
