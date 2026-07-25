# Current Task Execution

## Task

- Issue: #196 — Scenario Lessons UI; bounded reconciliation with #24
- Branch: `feat/issue-196-scenario-lessons-ui`
- Base SHA: `96caedb58a289ce13af9862a9258ba007809a73c`
- Head SHA: resolve from live branch ref after this write
- PR: #221 — Draft until the immutable final head is completely green

## Skills used

### GitHub repository production workflow

Purpose: restore authoritative state, keep one atomic product slice, inspect live CI evidence, and enforce final-head/squash/post-merge validation.

Instruction source: `AGENTS.md`, `.agents/AGENTS.md`, all mandatory referenced documents, `.agents/SKILLS.md`, `docs/agent-harness.md`, and the GitHub connector production workflow.

Version or verification date: live repository state repeatedly verified on 2026-07-25.

Inputs: repository `Dja-tiger/LexiGo`, PR #221, Issues #196/#24/#12, merged PRs #216/#218/#219/#220/#222, CI runs #1803–#1826.

Files inspected: mandatory harness files; current task/progress/execution memory; PR diff and comments; branch/base refs; workflow jobs, logs and artifacts; stage Issue #12.

Actions performed:

- reconciled stale stage memory in a separate PR #222 before further product writes;
- verified full CI #1804 and squash merge `96caedb58a289ce13af9862a9258ba007809a73c`;
- synchronized PR #221 with the new `main` and kept it at behind `0`;
- classified every CI failure before changing code;
- downloaded Playwright/visual artifacts and inspected Linux screenshots and exact browser diagnostics;
- kept PR #221 Draft while acceptance evidence was incomplete;
- audited the PR conversation; no comments or unresolved review threads were present at the latest check.

Commands or procedures: exact-ref reads, PR/base/head comparison, workflow job and step inspection, artifact download, screenshot review, sequential content writes with current blob SHA, and live branch readback.

Artifacts produced: merged state-reconciliation PR #222; Draft PR #221; immutable CI/artifact references recorded in `PROGRESS.md` and visual/bundle contracts.

Result: the product slice remains isolated, traceable, mergeable, and constrained by the repository harness.

Failures: repository state initially claimed stage was still on `1538632…` although Issue #12 proved a healthy `d7dc76c…` deployment.

Root cause: durable repository memory had not been reconciled after a successful documentation/main deployment.

Fallback: one-file reconciliation PR #222 was completed before the product branch continued.

Limitations: GitHub connector content writes replace whole UTF-8 files; executable browser validation is delegated to canonical repository CI because the local container cannot resolve GitHub hosts.

Reusable lesson: resolve mutable refs and deployment state live; record immutable evidence, not assumptions.

### Figma design-to-code

Purpose: map approved Scenario hierarchy and responsive states to production React/CSS without copying presentation-only sample data.

Instruction source: Figma design-to-code skill and repository design-token ownership rules.

Version or verification date: exact nodes retrieved before implementation on 2026-07-25.

Inputs: Figma file `3xXmBWnf38jbvLjtziwber`; nodes `76:100`, `76:127`, `76:219`; React 19, Next.js 16, TypeScript and plain CSS.

Files inspected: semantic design tokens, focused Active Lesson presentation, route chrome/footer owners and Scenario API fields.

Actions performed: compared compact Light, compact Dark and desktop Dark nodes; mapped approved spacing, typography, column collapse, progress and semantic states to existing `--ak-*` tokens.

Artifacts produced: `scenario-lessons.css`, route-local accessibility CSS and deterministic compact/desktop visual contracts.

Result: Figma hierarchy is represented while all role, objective, step and judgement content remains server-owned.

Failures: Figma sample copy included fields not available in the API.

Root cause: sample presentation data is not an application contract.

Fallback: preserve visual hierarchy and render only approved API fields.

Limitations: this slice does not infer Progress recommendations or add content fields absent from the backend contract.

Reusable lesson: Figma is visual truth; the API is semantic truth.

### Scenario API contract analysis

Purpose: preserve the ownership boundary established by PRs #216/#218.

Instruction source: `api/openapi-scenarios.json`, backend Scenario models/services/stores and merged contract evidence.

Inputs: seven authenticated Scenario endpoints; Scenario/Attempt/Submit schemas; optimistic version and idempotency rules.

Actions performed:

- implemented runtime validators for every consumed response;
- bounded submit payloads to `submissionId`, `attemptVersion`, authored response/facts/hypotheses and allowed review metadata;
- preserved the exact normalized payload and submission id after ambiguous transport failure;
- implemented 409 resynchronization without overwriting the owned unsent draft;
- drove completion exclusively from the server attempt state.

Artifacts produced: `frontend/lib/scenarios.ts`, unit tests, authenticated request orchestration and mutable Playwright API fixture.

Result: judgement, review events, correctness and scheduling remain server-owned.

Failures: an early test fixture was readonly and widened the expected Scenario step type.

Root cause: the mock object did not declare the same explicit mutable contract as production code.

Fallback: type the fixture as `ScenarioStep`; do not weaken production validators.

Reusable lesson: recovery caches may own authored evidence, never authoritative judgement.

### React and Next.js route-island implementation

Purpose: add canonical `/scenarios/[slug]` behavior without introducing a second legacy product runtime.

Instruction source: existing bootstrapped route graph, React Compiler rules, Next App Router conventions, navigation/session owners and focused-route contracts.

Actions performed:

- added a dedicated authenticated `LexigoScenarioApp` route island;
- preserved exact `return_to` during initial and mid-session authentication loss;
- implemented entry, active, paused, feedback and completed states;
- guarded browser Back and explicit close flows;
- reused `AccessibleDialog` instead of creating a second modal owner;
- extended focused chrome/footer suppression and navigation parsing for Scenario paths;
- added audited single-owner source contracts.

Artifacts produced: canonical App Router page, bootstrap integration, navigation/session tests and route-local presentation.

Failures:

- React Compiler rejected `Date.now()` during render;
- synchronous state transitions inside effects violated compiler/lint ownership;
- the application-root allow-list did not enumerate the new route island;
- invalid App Router slugs rendered the semantic 404 boundary with HTTP 200.

Root causes:

- impure time acquisition was coupled to render;
- derived transitions were modeled as effect-driven state;
- an audited enumerator was intentionally closed-world;
- Next App Router soft navigation status is not equivalent to rendered route semantics.

Fallbacks:

- initialize timing from user/runtime events and cancellable scheduling;
- restructure ownership instead of disabling rules;
- extend the audited enumerator with single-bootstrap/isolation assertions;
- verify semantic 404 UI and absence of the Scenario island.

Reusable lesson: a route contract is DOM, state, history and ownership—not only a URL or HTTP status.

### Accessible interaction and responsive reflow

Purpose: satisfy keyboard, focus, live-region, axe, forced-color, reduced-motion and 200% zoom contracts across desktop/mobile engines.

Instruction source: `.agents/lessons/accessibility.md`, existing `AccessibleDialog`, WCAG-oriented project gates and Playwright accessibility suites.

Actions performed:

- implemented initial dialog focus, Tab/Shift+Tab containment, Escape and trigger restoration;
- selected the actually visible close trigger by viewport rather than hidden desktop markup;
- added route-local contrast foreground aliases for small accent text;
- declared contrast variables on the portal dialog root;
- preserved 44 px touch targets while constraining the zoomed mobile header label and focused skip link;
- retained strict document-width assertions with offender diagnostics.

Artifacts produced: `scenario-lessons-accessibility.css`, keyboard E2E, axe coverage and 320 px/200% zoom coverage in Chromium and WebKit variants.

Result: CI #1826 passed both UI shards and accessibility after the route-chrome constraint; desktop Chromium/WebKit, Android Chromium and iOS WebKit no longer produce horizontal scrolling.

Failures:

- original Figma accent colors produced 3.01–3.42:1 contrast for 12–14 px labels;
- portal-rendered dialog text retained the invalid color because CSS variables did not inherit from `.lx-scenario`;
- zoomed header and fixed skip link expanded document width;
- an early keyboard test clicked a hidden desktop button on mobile.

Root causes: visual accents were used as text foregrounds; portal inheritance was assumed; fixed/intrinsic route chrome was omitted from reflow ownership; selectors ignored responsive visibility.

Fallbacks: semantic color mixing, portal-root variables, explicit narrow inline-size constraints and visible-trigger selection.

Reusable lesson: audit the rendered portal and global route chrome, not only descendants of the feature root.

### Playwright CI, visual regression and performance budgets

Purpose: provide deterministic executable evidence across the complete browser matrix.

Instruction source: canonical CI workflow, `.agents/lessons/ci.md`, existing quality-gate fixtures and package scripts.

Actions performed:

- created a mutable Scenario fixture with idempotency, optimistic versioning, pause/resume and controlled transport failure;
- added lifecycle, retry, reload, history, completion, keyboard, zoom and Dark/reduced-motion E2E;
- registered Scenario in UI, accessibility, axe and visual groups;
- measured the cold route through a controlled failing calibration and removed the calibration sentinel immediately afterward;
- enforced `202679` measured JS bytes/`16` requests with ceilings `235000`/`18`;
- generated and manually reviewed Linux compact Light and desktop Dark screenshots;
- stored content-addressed width, height, SHA-256 and source-run/head evidence.

Artifacts produced:

- compact Light: `390 × 1792`, SHA-256 `85a674882de19c87bc92d4b06888d7dc91471726a9916a943d4592bbd7919aab`;
- desktop Dark: `1440 × 1054`, SHA-256 `eaad352ced6e94a639014af3ea9a01c5bd20ec335857fe21a5d2cec93af4da40`;
- measured route budget in `frontend/bundle-budgets.json`.

Result: CI #1826 passed all relevant runtime/browser/performance gates; its only intentional failure was the now-updated desktop Dark hash after the proven contrast correction.

Failures encountered and classifications:

- typecheck: stale/incorrect fixture typing;
- unit: stale audited route-owner enumerator;
- axe: production contrast and portal inheritance defects;
- UI: stale soft-404/status assertion, unscoped alert selector, hidden mobile selector and production reflow defects;
- visual: expected missing/changed Linux baseline after intentional UI correction;
- performance calibration: intentional artifact-producing failure, removed before final evidence.

Root-cause method: inspect exact job logs/artifacts, classify before editing, and never increase waits, use `.first()`, disable compiler rules or weaken required gates.

Limitations: content-addressed PNG contracts are Linux-renderer specific and must be refreshed only from reviewed canonical CI evidence.

Reusable lesson: a visual hash update is valid only when the corresponding production change, exact Linux actual and immutable source run/head have all been reviewed.

## Finalization state

- Product implementation and pre-final acceptance fixes are complete.
- The branch still requires one complete green CI on the final documentation/baseline head.
- After green CI: audit live base/head/diff/review threads, move PR #221 to Ready, squash merge, validate new-main stage deploy/public smoke/public browser matrix, then reconcile `.agents/PROJECT_STATE.md` in the required follow-up slice.
