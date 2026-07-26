# Current Task Execution

## Task

- Issue: #198 — canonical Word Detail route
- Branch: `feat/issue-198-word-detail`
- Base SHA: `72291d9351f3c565d13be7b3f9e9055258f98ac6`
- Head SHA: resolve from live branch ref
- PR: #235 — Draft

## Skills used

### GitHub repository operations

Purpose: reconstruct live production state, isolate the atomic Word Detail slice, preserve branch-safe writes and validate implementation through repository CI.

Instruction source: root `AGENTS.md`, `.agents/AGENTS*.md`, `.agents/SKILLS.md`, `docs/agent-harness.md` and installed GitHub connector procedures.

Version or verification date: 2026-07-26.

Inputs: repository `Dja-tiger/LexiGo`, exact base `72291d9351f3c565d13be7b3f9e9055258f98ac6`, Issue #198, stage Issue #12 and Draft PR #235.

Files inspected: mandatory harness documents, live `main`, PR/Issue/CI state, README, architecture, route shell, session/bootstrap graph, Dictionary island/catalog, Word Detail API/model, lesson API, speech runtime, route/history owners, CSS owners, Playwright reports, traces and Linux visual artifacts.

Actions performed: kept all writes on the explicit feature branch; implemented strict Word Detail validation, separate route controller/presentation, bounded related-phrase search, exact single-word lesson creation, pronunciation fallback, responsive/accessibility/PWA/performance contracts and content-addressed visual baselines; classified CI failures; fixed route-local dark contrast; replaced invalid synchronous/fixed-delay graph switches with a pathname-settled cancelable `requestAnimationFrame` handoff; added canonical URL-to-history reconciliation before product graph hydration; promoted the complete failure category into the normative agent lesson.

Commands or procedures: exact GitHub file reads/writes with blob SHA and explicit branch, post-write read-back, live-main verification, workflow run/job/log/artifact inspection, Playwright report/trace analysis, Linux PNG SHA-256/IHDR verification and manual Figma comparison.

Artifacts produced: Draft PR #235; standalone Word Detail controller/presentation/styles; strict scheduler contract; App Router/PWA/accessibility/ownership/performance tests; reviewed Linux compact/desktop Light/Dark visual contract; reusable route-island and history-hydration lesson.

Result: the implementation checkpoint has exact API ownership, honest scheduler evidence, direct-entry independence, preserved Dictionary history, exact one-word practice creation and a route handoff that retains its router owner until pathname settlement, then replaces only the canonical LexiGo target in the current Next history entry before product graph hydration.

Failures: CI #1952 found two dark contrast defects and an async route-island race. CI #1955 confirmed the contrast correction but proved that `setTimeout(0)` remained a race. CI #1961 confirmed pathname settlement and a correct `/lesson/active` URL, but exposed stale Dictionary-owned application state retained inside the current Next history entry.

Root cause: Word Detail initially inherited decorative Figma primary text on dark surfaces below WCAG text contrast. Separately, navigation intent was treated as completed lifecycle; after that was fixed, URL ownership and application history ownership still diverged. `LexigoPremiumApp` hydrated from stale `{view: "library", detail: "101"}` state although the browser URL was already `/lesson/active`.

Fallback: preserve global/session/API/history ownership in the existing Dictionary island; apply only route-local foreground overrides; use a cancelable pathname predicate rather than DOM mutation or arbitrary delay; derive the new application target from the settled URL, merge it with framework-owned Next history metadata and only then mount the product graph.

Limitations: full required CI on the final developer-authored head, Ready transition, squash merge, exact-SHA stage/public validation, Issue closure and post-merge repository-memory reconciliation remain pending.

Reusable lesson: a navigation intent event, fixed delay and even a changed URL are individually insufficient lifecycle evidence for a cross-island application. Retain the source island until pathname settlement, reconcile the canonical URL target into the current framework history entry, preserve framework metadata and then transfer route ownership.

### CI debugging

Purpose: classify failing required checks from concrete logs and artifacts before changing production code or tests.

Instruction source: `.agents/AGENTS.base.md`, `.agents/AGENTS.progress-pr214.md`, `.agents/SKILLS.md` and installed `gh-fix-ci` procedure.

Version or verification date: 2026-07-26.

Inputs: CI #1952/run `30202093705`, CI #1955/run `30203166826`, CI #1961/run `30203753015`, UI shard/axe reports, visual artifact `8632306006` and UI trace artifact `8632501668`.

Actions performed: separated production defects from expected visual calibration; confirmed exact axe nodes/colors/ratios; confirmed lesson POST body and failed destination; traced event → graph state → island unmount → URL settlement → stale history hydration; rejected blind retry, timeout inflation and weaker URL-only assertions; tested each lifecycle hypothesis through full CI and replaced it after objective failure.

Artifacts produced: root-cause record, route-local contrast contract, pathname-settled graph handoff, canonical URL-derived history merge, source regression test and durable harness lesson.

Result: CI #1961 passed frontend core, backend, content security, accessibility, visual and iOS PWA gates and reproduced all four approved hashes. The remaining UI shard defect was reduced to stale application history and corrected at its owning bootstrap boundary.

Failures: the complete required CI result for the final documentation head is not yet available.

Fallback: if the final UI journey still fails, inspect the exact URL, `window.history.state`, rendered route graph and active lesson request sequence before changing the contract; do not weaken the `/lesson/active` or `.lx-active-lesson` assertions.

Regression gates: `frontend/components/word-detail-source.test.ts`, `frontend/e2e/app-router-routes.spec.ts`, axe Light/Dark, visual regression and full UI shard 1/2.

### Figma and Linux visual validation

Purpose: implement and approve the exact Word Detail hierarchy without inventing unsupported product state.

Instruction source: Issue #198, Figma nodes `78:99`/`78:274`, `.agents/SKILLS.md` visual procedure and Foundation V1 token source.

Version or verification date: 2026-07-26.

Inputs: LexiGo Design System `3xXmBWnf38jbvLjtziwber`, Mobile Dark `78:99`, Desktop Dark `78:274`, Linux artifact `8632306006` from CI #1955/head `7f00019d372a3daf2fd7bd14bac39c3abc69d27c`.

Actions performed: mapped compact/desktop hierarchy and Light/Dark semantics; excluded unsupported retention percentage and personal-note persistence; opened and manually reviewed all four Linux full-page actuals; verified dimensions and SHA-256; promoted exact content-addressed constants without `--update-snapshots`; confirmed exact reproduction in CI #1961.

Artifacts produced:

- compact Light `390 × 1745`, `0d9eade831f96bcdf7b55132ebce75c69cf22bd4be9761d28e0ce98595968f7b`;
- compact Dark `390 × 1745`, `f985ac2cce5ae144e09dbe296de886de10b3fe31b01e175cd579f85812ca8088`;
- desktop Light `1440 × 1160`, `64258a07b5010045dcc4929110f5635d072c995bfaf315d9140aee0e6a3abf72`;
- desktop Dark `1440 × 1160`, `0d5f69b6b4ecb530bd51b421e20f5fcd66f4bc01d60bb20969b592e9a95fde24`.

Result: all four reviewed actuals preserve the approved hierarchy, route chrome, readable contrast, action placement and responsive geometry; final navigation-only changes do not alter the route pixels.

Failures: the pre-fix dark foreground failed WCAG contrast on two text nodes; corrected actuals were reviewed before promotion.

Fallback: if final Linux comparison differs, do not update hashes blindly; retrieve the final-head artifact, inspect the visual delta and classify whether a navigation/history-only change can legitimately affect pixels.

Limitations: final-head visual comparison and complete required CI remain required before Ready.
