# Current Task Execution

## Task

- Branch: `feat/issue-24-scenario-catalog`
- Base SHA: `56c8bf7b589601510ff60465c68c7482f5a8f320`
- Head SHA: resolve from live branch ref
- PR: #228 — `feat(scenarios): add server-backed Scenario catalog`

## Skills used

### GitHub repository operations

Purpose: restore exact repository state, isolate Issue #24, implement the bounded product slice, inspect immutable CI evidence and prepare a safe merge candidate.

Instruction source: installed GitHub connector skill plus `AGENTS.md`, `.agents/AGENTS*.md`, `.agents/SKILLS.md` and `docs/agent-harness.md`.

Verification date: 2026-07-26.

Inputs: repository `Dja-tiger/LexiGo`, base/main `56c8bf7b589601510ff60465c68c7482f5a8f320`, Issue #24, PR #228 and CI runs `30180574842`, `30181760632`, `30181864359`, `30182388921`, `30182704593`.

Files inspected: mandatory harness/current-state documents, architecture, Scenario API and consumers, route chrome/navigation owners, compiled CSS, visual/performance specs, Playwright traces, workflow jobs/logs/artifacts and PR changed-file set.

Actions performed: verified live main/stage/Issue state; created and read back branch-scoped commits; inspected exact CI jobs; downloaded performance and visual artifacts; measured the catalog route; identified and corrected compact/header overlap; traced unrelated Progress fixture drift; identified a masked desktop rail overlap; prepared a content-column alignment correction without weakening the geometric assertion.

Procedures: explicit branch/ref on every mutation; Git blob/tree/commit construction before fast-forwarding the branch; commit-diff/read-back verification; immutable run/job/artifact IDs for diagnostics; no direct main write and no workflow modification.

Artifacts produced: Draft PR #228, Scenario Catalog route island, focused tests, responsive Learning switch owner, performance report, Linux visual actuals and content-addressed evidence contracts.

Result: CI #1865 passed every completed production gate except visual regression. The remaining red state is fully classified and requires one corrected desktop Linux actual before final immutable-head CI.

Failures and root causes:

- CI #1861 exposed pending Scenario baselines, expected Learning changes and unrelated Progress/calendar drift.
- CI #1862 correctly rejected an invalid provisional bundle baseline without provenance.
- CI #1863 intentionally published measured performance and visual artifacts.
- CI #1864 showed that the first route-stacking correction did not isolate Progress and that desktop switch geometry still intersected the rail.
- CI #1865 trace proved the broad `quality-gates.ts` handler continued to own `/api/v1/progress`. Its desktop screenshot and compiled CSS proved the switch was centered across the entire viewport and extended about 90 px under the fixed 220 px Foundation V1 rail. This was a product defect hidden by rail z-index, not subpixel contact.

Corrections:

- `installQualityGateAPI` accepts an explicit `progress` payload so the broad fixture remains the single deterministic API owner.
- Baseline Progress/calendar visuals install a payload without Scenario projection; Scenario catalog visuals reinstall the broad fixture with the full recommendation.
- `frontend/app/learning-section-switch.css` aligns the desktop switch with the content column to the right of the 220 px rail, using the existing 40 px shell gutter and a maximum width of 1180 px.
- The no-overlap assertion remains `overlapWidth > 1 && overlapHeight > 1`; no threshold or visual gate is weakened.
- The old desktop Learning hash is revoked. A corrected Linux actual must be harvested and manually reviewed before final acceptance.

Limitations: corrected evidence CI, new desktop hash, final full CI, review-thread audit, squash merge, exact-SHA stage/public validation, Issue closure and post-merge memory reconciliation remain blocking.

Reusable lesson: a fixed overlay can visually mask underlying content while the screenshot appears clean. Geometric assertions must remain authoritative, and their failure must be reconciled with computed layout before any tolerance is relaxed. Shared network fixtures should expose route-specific payloads through the fixture owner itself rather than competing route registrations.

### Figma design inspection

Purpose: close the missing Scenario catalog design gap before implementation and provide exact mobile/desktop/appearance source nodes.

Instruction source: installed Figma skills plus repository Figma rules.

Verification date: 2026-07-26.

Inputs: LexiGo Design System file `3xXmBWnf38jbvLjtziwber`; existing Progress, focused Scenario and Dictionary catalog patterns.

Actions performed: confirmed no approved Scenario discovery frame existed; defined server-ownership/navigation constraints; created and reviewed Mobile Light, Mobile Dark, Desktop Light and Learning entry frames; corrected auto-layout width/content-fit defects from rendered screenshots.

Artifacts: Figma nodes `228:3`, `228:4`, `228:5`, `228:6` and matrix heading `228:2`.

Result: approved implementation source exists. `/scenarios` remains a subsection of `Обучение`; global navigation remains four items; catalog order and recommendation remain server-owned.

Reusable lesson: generated Figma auto-layout must be verified from rendered screenshots at every target width; node structure alone is not visual evidence.

### Browser, visual and performance evidence

Purpose: prove route behavior, visual fidelity, responsive geometry and cold-route cost on deterministic Linux infrastructure.

Instruction source: repository Playwright configuration, content-addressed visual helper, bundle-budget contract and harness visual-review rules.

Verification date: 2026-07-26.

Inputs: CI #1863 performance artifact `8625816416`, visual artifact `8625821205`; CI #1865 visual artifact `8626078416`; Figma nodes `228:3`–`228:6`.

Evidence:

- `/scenarios`: `198852` JavaScript bytes, `17` requests; ceilings `230000`/`19`.
- Scenario Catalog: compact Light `390 × 1876` / `6d6412fabb2e1b9d5b146da4609da35b7544252d9ab04bd4a8ae3c6e45d26508`; compact Dark `390 × 1876` / `fa874501b7c1a9f66b868c350f607bec444ab12255a18a108f990295a525a47a`; desktop Light `1440 × 981` / `350597de5f363c687c821223b88d86849a62bf51f17b2483c300455fb717ae8a`.
- Learning compact: `390 × 1212` / `8cbc1f01bb7079ca0a83b785db2e42be205489edd2dec48a7e40e5b915f20fb9`.
- Learning medium: `768 × 6154` / `4acb9301f3837fb235670c6841c281eb732488701566a84db3b406eaac422812`.
- Learning desktop: previous hash revoked after geometric proof of rail overlap; corrected evidence pending.

Result: catalog cost and catalog visuals are reviewed and reproducible. Final comparison must pass without update mode after the corrected desktop Learning actual is accepted.

Reusable lesson: an evidence run may be intentionally fail-closed only when the failure is isolated, artifacts are uploaded, all other gates remain green and the subsequent final developer head reruns the complete matrix without weakened assertions.
