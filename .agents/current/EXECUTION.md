# Current Task Execution

## Task

- Branch: `feat/issue-24-scenario-catalog`
- Base SHA: `56c8bf7b589601510ff60465c68c7482f5a8f320`
- Head SHA: resolve from live branch ref
- PR: #228 — `feat(scenarios): add server-backed Scenario catalog`

## Skills used

### GitHub repository operations

Purpose: Restore exact repository state, isolate Issue #24, implement the bounded product slice, inspect immutable CI evidence and prepare a safe merge candidate.

Instruction source: installed GitHub connector skill plus `AGENTS.md`, `.agents/AGENTS*.md`, `.agents/SKILLS.md` and `docs/agent-harness.md`.

Version or verification date: 2026-07-26.

Inputs: repository `Dja-tiger/LexiGo`, base/main `56c8bf7b589601510ff60465c68c7482f5a8f320`, Issue #24, PR #228, CI runs `30180574842`, `30181760632` and `30181864359`.

Files inspected: mandatory harness/current-state documents, architecture, Scenario API and consumers, route chrome/navigation owners, visual/performance specs, workflow jobs/logs/artifacts and PR changed-file set.

Actions performed: verified live main/stage/Issue state; created and read back branch-scoped commits; inspected exact CI jobs; downloaded performance and visual artifacts; corrected a real responsive overlap; isolated unrelated Progress fixture drift; recorded measured bundle and content-addressed visual evidence.

Commands or procedures: explicit branch/ref on every mutation; Git blob/tree/commit construction before fast-forwarding the branch; commit-diff/read-back verification; immutable run/job/artifact IDs for diagnostics; no direct main write and no workflow modification.

Artifacts produced: Draft PR #228, Scenario Catalog route island, focused tests, responsive Learning switch owner, performance report, Linux visual actuals and final evidence contracts.

Result: measurement head `e608d6f58135d689e06cd49735c6a05bec82c1a3` passed all non-evidence product gates. Final developer-authored evidence head still requires a complete green CI run before Ready/merge.

Failures:

- CI #1861 visual comparison exposed new/pending Scenario baselines, expected Learning baseline changes and unrelated Progress/calendar drift.
- The first measurement head used an invalid JavaScript baseline value and CI #1862 correctly failed the bundle-budget unit contract.
- CI #1863 intentionally failed performance and visual jobs to publish exact measured artifacts.

Root cause:

- The Learning subsection switch was in normal flow while route brand/navigation/reminder controls were fixed in the same top band.
- `QUALITY_PROGRESS.scenarios` was added to a shared visual fixture, coupling unrelated Progress/calendar baselines to the Scenario catalog slice.
- A provisional measurement value diverged from the shared baseline without required provenance.

Fallback and corrections:

- Added `frontend/app/learning-section-switch.css` as the responsive placement owner and manually checked 390/768/1440 Linux actuals.
- Replaced ordinary Lesson Composer snapshot acceptance with content-addressed dimensions/SHA/run/head contracts and an explicit no-overlap assertion.
- Kept canonical Progress/calendar fixtures without Scenario projection and exposes the full recommendation only to Scenario catalog visuals.
- Repeated measurement using a valid JavaScript baseline and a temporary request ceiling, then recorded the actual result with provenance.

Limitations: final immutable-head CI, review-thread audit, squash merge, exact-SHA stage deploy/public validation, Issue closure and post-merge memory reconciliation remain blocking.

Reusable lesson: evidence fixtures must be route-local when optional projections alter presentation; visual review must test geometric non-overlap with fixed chrome rather than DOM visibility alone; measurement-only budget changes must still satisfy all configuration provenance contracts.

### Figma generate design and inspection

Purpose: Close the missing Scenario catalog design gap before implementation and provide exact mobile/desktop/appearance source nodes.

Instruction source: installed `figma-use`, `figma-generate-design` and `figma-design-to-code` skills plus repository Figma rules.

Version or verification date: 2026-07-26.

Inputs: LexiGo Design System file `3xXmBWnf38jbvLjtziwber`; existing Progress, focused Scenario and Dictionary catalog patterns.

Files inspected: Figma page `76:2`, production components/variables/styles, semantic color collection and existing route patterns.

Actions performed: confirmed no approved Scenario discovery frame existed; defined server-ownership/navigation constraints; created and reviewed Mobile Light, Mobile Dark, Desktop Light and Learning entry frames; corrected auto-layout width/content-fit defects from rendered screenshots.

Commands or procedures: read-only node inventory and token inspection; semantic Light/Dark mode binding; bounded wrapper/content writes; screenshot review after every structural change.

Artifacts produced: Figma nodes `228:3`, `228:4`, `228:5`, `228:6` and matrix heading `228:2`.

Result: approved implementation source exists. `/scenarios` remains a subsection of `Обучение`; global navigation remains four items; catalog order and recommendation remain server-owned.

Failures: initial generated mobile/entry rows collapsed because nested HUG/FILL sizing competed with fixed wrappers.

Root cause: generated auto-layout constraints were semantically plausible but geometrically unstable in compact frames.

Fallback: inspected actual node dimensions, converted critical rows/cards/tabs to fixed constraints and repeated screenshot review.

Limitations: none for design source; production acceptance remains governed by final Linux CI and stage evidence.

Reusable lesson: generated Figma auto-layout must be verified from rendered screenshots at every target width; node structure alone is not visual evidence.

### Browser, visual and performance evidence

Purpose: Prove route behavior, visual fidelity, responsive geometry and cold-route cost on deterministic Linux infrastructure.

Instruction source: repository Playwright configuration, content-addressed visual helper, bundle-budget contract and harness visual-review rules.

Version or verification date: 2026-07-26.

Inputs: CI #1863 run `30181864359`, head `e608d6f58135d689e06cd49735c6a05bec82c1a3`, performance artifact `8625816416`, visual artifact `8625821205`, Figma nodes `228:3`–`228:6`.

Files inspected: Playwright HTML/results, `route-bundle-budget-report.json`, six accepted full-page actuals, existing Progress/calendar diffs and changed fixture ownership.

Actions performed: measured `/scenarios`; reviewed compact Light/Dark and desktop Light catalog actuals; reviewed compact/medium/desktop Learning actuals; verified hash repeatability across runs; rejected unrelated Progress/calendar baseline changes; added route-local fixture isolation and geometric overlap detection.

Commands or procedures: deterministic Linux Chromium viewports 390/768/1440; full-page PNG dimension and SHA-256 verification; cold Pixel 5 Chromium profile with cache disabled, 4× CPU and simulated 3G; artifact provenance stored as immutable run/head identifiers.

Artifacts produced:

- `/scenarios`: `198852` JavaScript bytes, `17` requests; ceilings `230000`/`19`.
- Scenario Catalog: compact Light `390 × 1876` / `6d6412fabb2e1b9d5b146da4609da35b7544252d9ab04bd4a8ae3c6e45d26508`; compact Dark `390 × 1876` / `fa874501b7c1a9f66b868c350f607bec444ab12255a18a108f990295a525a47a`; desktop Light `1440 × 981` / `350597de5f363c687c821223b88d86849a62bf51f17b2483c300455fb717ae8a`.
- Learning: compact `390 × 1212` / `8cbc1f01bb7079ca0a83b785db2e42be205489edd2dec48a7e40e5b915f20fb9`; medium `768 × 6154` / `4acb9301f3837fb235670c6841c281eb732488701566a84db3b406eaac422812`; desktop `1440 × 1656` / `f70cdc58badacd2f13d568f97d05bc38d54121adf3382480cab438baa6f04f9f`.

Result: measured route cost and all intended visual changes are reviewed and reproducible. Final comparison must pass without update mode on the final developer head.

Failures: initial `/learn` actuals showed overlap; shared Progress fixture produced a 26 px unrelated drift; performance/visual jobs were deliberately red while artifacts were being harvested.

Root cause: missing responsive placement owner, cross-route fixture coupling and pending content-addressed evidence.

Fallback: introduced the placement owner, isolated fixtures and promoted reviewed actuals into immutable metadata instead of changing CI workflows or accepting unrelated binary baselines.

Limitations: final full CI and exact-SHA stage/public browser evidence remain pending.

Reusable lesson: an evidence run may be intentionally fail-closed only when the failure is isolated, artifacts are uploaded, all other gates remain green and the subsequent final developer head reruns the complete matrix without weakened assertions.
