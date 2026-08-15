# Current Task Execution

## Task

- Branch: `test/issue-536-phrases-catalog-figma-parity`
- Base SHA: `a16a9dc598d61aa35ff7d10317a7a60b75e390e7`
- Head SHA: resolve from live branch ref
- PR: #538

## Skills used

### github

Purpose:

Inspect live repository state, issue/PR/CI ownership, read the authoritative Phrases implementation, diagnose immutable-head CI and write the atomic branch through the GitHub connector.

Instruction source:

`skills://plugins/github/github/skill.md`, `skills://plugins/github/gh-fix-ci/skill.md` and repository Agent Harness rules.

Version or verification date:

Verified 2026-08-15 Europe/Moscow.

Inputs:

Issue #536, umbrella #205, current `main`, repository-approved Figma handoff, existing Phrases visual owner, immutable-head CI #3557 and its Playwright diagnostic artifact.

Files inspected:

- `AGENTS.md`
- mandatory `.agents/AGENTS*.md`, `.agents/SKILLS.md`, `.agents/PROJECT_STATE.md`, `.agents/current/*`
- `docs/agent-harness.md`
- `README.md`
- `docs/architecture.md`
- `frontend/docs/adaptive-knowledge-coach.md`
- `frontend/e2e/phrases-visual.spec.ts`
- `frontend/e2e/word-detail-visual.spec.ts`
- `frontend/e2e/support/quality-gates.ts`
- `frontend/components/lexigo-phrases-app.tsx`
- `frontend/components/phrases-catalog.tsx`
- `frontend/app/phrases.css`
- `frontend/app/route-navigation.css`
- `frontend/lib/phrase-navigation.ts`
- `frontend/lib/navigation.ts`
- `frontend/lib/expanded-phrases-travel.ts`
- `frontend/playwright.visual.config.ts`
- CI #3557 artifact `frontend-playwright-report-visual` from artifact id `9248373811`

Actions performed:

- Verified Word Detail delivery and completed the required post-merge Agent Docs reconciliation through PR #537 before starting product work.
- Created the #536 branch from exact clean `main`.
- Identified the existing Phrases visual owner and canonical route/state assertions without touching baselines or production runtime.
- Classified guest catalog filtering as the deterministic fixture path for Travel-search and empty-search parity.
- Added four canonical Figma parity cases for `255:10`, `257:2`, `255:81`, `257:74` inside `frontend/e2e/phrases-visual.spec.ts`.
- Added explicit appearance/canvas, URL query/topic, route-island/main/catalog, visible RouteChrome, containment/no-overflow and reload-stability assertions.
- Opened draft PR #538.
- Ran full immutable-head CI #3557 on `961010a6116e443e2728eaf7b21e67da95eb730e`.
- Downloaded and inspected the Playwright visual diagnostic artifact after Visual regression failed.
- Classified the new Phrases failure as a test-contract error: 1440px desktop runtime owns `data-route-navigation="rail"`, not `header`.
- Classified the simultaneous `Dictionary empty light` SHA drift `e140551792a87445af08658ed78439638918b174b4b1a0e3d36448ef1ce7dbdf` → `dd2d0c587d648a01c1fc2d851fcea21f881716acf743268779f6132d15322ff6` as an independent, previously observed nondeterministic visual owner; no baseline refresh was made.
- Corrected only the Phrases canonical navigation contract: allowed expected navigation is now `mobile|rail`, and both desktop canonical cases expect `rail`.
- A temporary low-level blob-write commit (`7f48dc9718394f953c0818034e3cc0970deae177`) was immediately rejected by read-back because chunk boundaries corrupted source text. The product branch alone was reset to the last known-good `961010a...`; `main` was never modified. The focused correction was then re-applied through the normal UTF-8 Contents API.
- Verified the corrected Phrases source byte-for-byte with Git blob SHA `2567b08657d973bc3ec5fe69d42b2febf257590e`.

Commands or procedures:

GitHub connector reads/writes only for repository mutation; exact branch/main refs were verified after every write. CI diagnosis used the exact-head workflow/job metadata plus the content-addressed Playwright artifact, rather than treating a generic exit code as sufficient evidence. Playwright structure follows the already delivered Word Detail canonical parity pattern. Existing eight Phrases visual hashes and browser-owned zoom assertions remain untouched.

Artifacts produced:

- PR #538 `test(figma): add canonical Phrases catalog parity contract`.
- Four executable canonical Phrases catalog cases with exact `figma` annotations.
- `phrases-canonical-runtime.json` attachment per executed canonical case.
- CI #3557 Playwright visual diagnostics proving the desktop RouteChrome owner and unrelated Dictionary drift.
- Corrected product source blob `2567b08657d973bc3ec5fe69d42b2febf257590e`.
- Current task/preflight/progress/execution Agent Harness context for Issue #536.

Result:

The only Issue #536 defect exposed by the first immutable-head browser run was corrected in the test contract without changing production code or visual baselines. The new branch head must now pass a fresh full immutable-head CI before merge. If the known Dictionary drift is the sole residual Visual regression failure, only a controlled same-head job rerun is permitted.

Failures:

- CI #3557 Visual regression failed on the superseded head because the Phrases desktop cases expected `header` instead of the executable `rail` owner and because an unrelated Dictionary visual hash drift reproduced.
- Live Figma MCP cannot inspect/edit the cloud file because the connected Starter plan has exhausted the tool-call limit.
- A temporary low-level blob write corrupted whitespace/syntax; read-back detected it before merge evidence and the branch was restored before the final correct write.

Root cause:

- Phrases: incorrect preflight inference about desktop RouteChrome ownership. Executable browser evidence establishes persistent `rail` at 1440px.
- Dictionary: independent render nondeterminism in an existing content-addressed owner.
- Figma: external plan/tool quota.
- Temporary write: unsafe low-level chunk assembly for a large UTF-8 source file; normal Contents API is the correct write path.

Fallback:

- Use the already reviewed repository route map in `frontend/docs/adaptive-knowledge-coach.md` with explicit node IDs `255:10`, `257:2`, `255:81`, `257:74`; do not claim fresh live Figma synchronization.
- Preserve the approved Dictionary baseline and prove nondeterminism only through a controlled same-head rerun if it is the sole remaining failure.
- Use `GitHub.update_file` for complete UTF-8 source replacement; do not repeat low-level chunked blob assembly for this file.

Limitations:

No live cloud-canvas mutation or screenshot comparison is asserted while Figma MCP is blocked. Executable parity is against the approved repository handoff and observable runtime invariants. The corrected head still requires full CI/browser execution, clean review audit, expected-head merge, exact-main CI and Stage/public validation.

Reusable lesson:

For Figma parity slices, extend the route's existing authoritative browser owner, encode exact node provenance as test annotations, and prefer executable RouteChrome evidence over inferred breakpoint expectations. Classify visual failures from exact-head artifacts before changing tests or baselines, and use the normal UTF-8 Contents API for large source-file writes.
