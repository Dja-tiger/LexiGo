# Current Task Execution

## Task

- Branch: `feat/issue-24-scenario-catalog`
- Base SHA: `56c8bf7b589601510ff60465c68c7482f5a8f320`
- Head SHA: resolve from live branch ref
- PR: #228 — `feat(scenarios): add server-backed Scenario catalog`

## Skills used

### GitHub repository operations

Purpose: restore exact repository state, implement the bounded Issue #24 slice, diagnose immutable CI evidence and prepare a safe merge candidate.

Instruction source: installed GitHub connector skill plus `AGENTS.md`, `.agents/AGENTS*.md`, `.agents/SKILLS.md` and `docs/agent-harness.md`.

Verification date: 2026-07-26.

Inputs: repository `Dja-tiger/LexiGo`, base/main `56c8bf7b589601510ff60465c68c7482f5a8f320`, Issue #24, PR #228 and CI runs `30180574842`, `30181760632`, `30181864359`, `30182388921`, `30182704593`, `30183186758`.

Actions performed: verified live repository state; created branch-scoped Git blobs/trees/commits with read-back; inspected workflow jobs, logs, traces and artifacts; measured `/scenarios`; reviewed Linux actuals against Figma; fixed compact/header and desktop/rail collisions; isolated Progress fixtures; recorded bundle and content-addressed visual provenance.

Procedures: explicit branch/ref on every mutation; no direct `main` write; no workflow modification; immutable run/job/artifact identifiers; manual Linux actual review before baseline promotion; full CI rerun required on the final developer head.

Result: CI #1866 passed every product/platform job except the deliberately stale desktop Learning hash. The corrected desktop actual is manually approved and ready for final content-addressed acceptance.

Failures and root causes:

- Early evidence runs exposed pending Scenario baselines and an invalid provisional bundle baseline.
- A shared Progress fixture unintentionally changed unrelated Progress/calendar visuals; it is now parameterized through its single broad API owner.
- The desktop Learning switch was centered across the full viewport and extended beneath the fixed Foundation V1 rail. The rail's z-index visually hid the overlap. The switch is now aligned with the content column to the right of the rail.

Final evidence:

- `/scenarios`: `198852` JavaScript bytes and `17` requests; ceilings `230000` and `19`.
- Scenario Catalog compact Light: `390 × 1876`, SHA-256 `6d6412fabb2e1b9d5b146da4609da35b7544252d9ab04bd4a8ae3c6e45d26508`.
- Scenario Catalog compact Dark: `390 × 1876`, SHA-256 `fa874501b7c1a9f66b868c350f607bec444ab12255a18a108f990295a525a47a`.
- Scenario Catalog desktop Light: `1440 × 981`, SHA-256 `350597de5f363c687c821223b88d86849a62bf51f17b2483c300455fb717ae8a`.
- Learning compact: `390 × 1212`, SHA-256 `8cbc1f01bb7079ca0a83b785db2e42be205489edd2dec48a7e40e5b915f20fb9`.
- Learning medium: `768 × 6154`, SHA-256 `4acb9301f3837fb235670c6841c281eb732488701566a84db3b406eaac422812`.
- Learning desktop: `1440 × 1656`, SHA-256 `3be9635dd17bf578adb48cfcbae812c46fe3714969574e5b9a6627b82b7d4088`, source run `30183186758`, source head `623a143a5e4f988606a723efdac66fbd3e43953d`.

Manual review: the corrected desktop full-page Linux actual starts after the 220 px rail with the intended 40 px gutter, preserves route controls, has no masked tab, clipping or horizontal overflow, and repeated byte-for-byte on retry.

Limitations: final immutable-head CI, PR review-thread audit, squash merge, exact-SHA stage/public validation, Issue closure and post-merge memory reconciliation remain blocking.

Reusable lesson: fixed overlays can hide underlying content while a screenshot appears superficially clean. Keep geometric collision assertions authoritative and reconcile failures against computed layout before changing tolerances. Route-specific network data should be supplied by the fixture owner itself rather than by competing route registrations.

### Figma design inspection

Purpose: provide exact product source for the Scenario catalog and Learning entry pattern.

Source: LexiGo Design System `3xXmBWnf38jbvLjtziwber`, nodes `228:3`, `228:4`, `228:5`, `228:6`.

Result: approved compact Light/Dark and desktop Light catalog states plus Learning subsection entry. Global navigation remains four items; catalog ordering and recommendation remain server-owned.

### Browser, visual and performance evidence

Purpose: prove route behavior, visual fidelity, responsive geometry and cold-route cost on deterministic Linux infrastructure.

Result: all intended visual states and performance evidence are reviewed and content-addressed. The next run must pass the complete matrix without update mode on the final developer head.
