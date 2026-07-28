# Current Task Execution

## Task

- Issue: #199 — Phrases runtime implementation and route-island extraction.
- Branch: `agent/issue-199-phrases-runtime`.
- Base SHA: `3475d1443bbccedb63bca54e67c5762aec2374e3`.
- Head SHA: resolve from live PR ref after this evidence write.
- Draft PR: #273.

## Skills used

### Repository Agent Harness

Purpose: enforce exact-base branching, atomic scope, ownership boundaries, validation, expected-head merge and post-merge delivery.

Instruction source: `AGENTS.md`, `.agents/AGENTS.md`, every indexed mandatory `.agents/AGENTS.*.md` document, `.agents/SKILLS.md`, `.agents/PROJECT_STATE.md`, `.agents/current/**`, `docs/agent-harness.md`.

Verification date: 2026-07-28.

Inputs: live `main`, Issue #199, PRs #270–#273, CI records and stage Issue #12.

Actions performed:

- read all mandatory harness documents before product writes;
- reconciled stale PROJECT_STATE separately through PR #272;
- created the product branch from exact reconciled `main` SHA;
- declared allowed/prohibited paths and runtime owners before each scope expansion;
- read back every remote write and compared branch-to-base changed paths;
- kept PR #273 Draft while implementation, diagnostics and release evidence were incomplete;
- refused to start the next issue before full current-slice delivery.

Result: Issue #199 remained an isolated product slice with explicit ownership and rollback boundaries.

Failures and recovery:

- Initial reconciliation draft was broader than necessary. Readback and compare detected it; historical evidence was restored before PR #272 opened.
- Multiple diagnostic/controlled CI runs were cancelled by newer branch commits. No cancelled run was treated as release evidence; the live PR head was re-read before each authoritative gate.

Reusable lesson: use the smallest reconciliation patch, resolve the live head before every immutable gate and distinguish diagnostic/controlled runs from final release CI.

### Figma Design Context

Purpose: implement only approved Phrases production nodes while preserving repository shell and information architecture ownership.

Instruction source: Figma plugin skills and `frontend/docs/adaptive-knowledge-coach.md`.

Verification date: 2026-07-28.

Inputs: Figma file `3xXmBWnf38jbvLjtziwber`; nodes `255:10`, `257:2`, `255:55`, `257:47`, `255:81`, `257:74`, `255:162`, `257:159`, `257:212` and Screen Map `261:2`.

Actions performed:

- read catalog/detail Light/Dark compact/desktop contexts;
- mapped responsive hierarchy, resilient states and detail composition to existing tokens and shell owners;
- preserved Phrases as a Dictionary catalog kind instead of adding a fifth primary destination;
- separated illustrative Figma chrome from authoritative repository navigation.

Result: dedicated catalog/detail presentation matches approved nodes without duplicating `RouteChrome`, session or PWA ownership.

Reusable lesson: route content and application chrome are independent contracts; implement the approved content hierarchy inside the existing product shell.

### GitHub Live Repository Operations

Purpose: inspect and modify immutable repository refs while retaining exact CI, artifact and merge evidence.

Verification date: 2026-07-28.

Inputs: repository `Dja-tiger/LexiGo`, Issue #199, PR #273, exact commit SHAs, Actions runs and artifacts.

Actions performed:

- created strict phrase payload validators and presentation owners;
- added `LexigoPhrasesApp` as a dynamic route entry;
- preserved common History state, session adoption and Learn handoff contracts;
- added request-scoped browser fixtures and source ownership tests;
- diagnosed every CI failure from exact job logs or uploaded artifacts;
- hardened the Dictionary smoke script to match class tokens rather than an exact class attribute string;
- kept unrelated Active Lesson runtime unchanged when a WebKit race was not attributable to the Phrases diff and confirmed it on a later successful run.

Functional result:

- CI #2258 / run `30364447226` passed the complete required matrix on head `a7835d85390fc143d50c023d647cf1785ed566bf`.
- Passed jobs included frontend core, backend unit/security/integration, both UI shards, visual regression, accessibility, content security, iOS PWA, controlled Service Worker, Dictionary smoke and performance budgets.

Failures and recovery:

- Early source-contract failure: new application root absent from the audited allowlist. Fixed by explicitly adding the legitimate route owner.
- Early browser failures: stale direct-detail fixtures, old readiness headings, legacy accessible names, missing listitem/sort/empty contracts, route-focus labels and contrast overrides. Each was fixed with a request- or route-scoped compatibility change.
- Dictionary shell smoke searched for exact `class="lx-phrase-grid"`. The test was corrected to match a class token, preserving runtime semantics.
- A temporary duplicate route-label synchronization was superseded by the owner-level `LexigoPhrasesApp` label; later CI validated the final owner behavior.

Reusable lesson: fixture interception must be request-scoped, accessibility names are product contracts, and shell smoke tests should match semantic class tokens rather than serialized attribute formatting.

### Controlled Performance Measurement

Purpose: obtain a reproducible cold-route JavaScript/request baseline and lock a permanent route-specific budget.

Instruction source: `docs/frontend-bundle-budgets.md`, `frontend/e2e/route-bundle-budget.spec.ts`, existing Home/Learn/Active Lesson controlled-measurement precedent.

Execution:

- added a temporary test-only assertion only after the complete route report had been written;
- preserved the production module graph;
- ignored cancelled controlled runs caused by newer commits;
- accepted controlled run `30366489438` on probe head `dc22918ffe99bc8e52116d885ab0baf961762d00`;
- downloaded and inspected artifact `8691127915`, digest `sha256:ac33ca9695a7b3bc8db26b4f8bca89c54fa05b0eb0a8145c7b93cf629bc9c589`;
- removed the probe byte-for-byte and restored canonical route-spec blob `304e7c62d3163a59edac3e648246e2aa4ce00660`.

Result:

- `/phrases` measured `226149` JavaScript bytes and `19` initial requests;
- original monolith measured `238257` bytes and `19` requests;
- reduction is `12108` bytes (`5.1%`);
- permanent baseline is `226149`;
- permanent ceiling is `235000` JavaScript bytes and `22` initial requests;
- `bundle-budgets.test.ts` blocks return to the original monolithic transfer/release boundary.

Limitations: the measurement is the repository-standard Pixel 5 Chromium, cache-disabled, 4× CPU, simulated-3G profile; it is a release budget, not a universal device benchmark.

Reusable lesson: force artifact upload only after report serialization, remove the probe exactly, and derive ceilings from controlled production CI rather than local guesses.

### Content-Addressed Linux Visual Validation

Purpose: make approved Phrases catalog/detail Light/Dark compact/desktop output a blocking, immutable release contract.

Execution:

- added an isolated Phrases visual project to the existing Linux visual configuration;
- used deterministic API/runtime fixtures and full-page screenshots;
- corrected the probe readiness locator to the approved `h1` before capture;
- captured eight screenshots in controlled run `30366489438` on head `dc22918ffe99bc8e52116d885ab0baf961762d00`;
- downloaded artifact `8691167183`, digest `sha256:5b9a1c18f27d014de47885a1ae7743f93583730b17734e5dc04eb6d293b16790`;
- manually inspected compact/desktop Light/Dark catalog/detail output and horizontal overflow evidence;
- promoted exact image dimensions and SHA-256 hashes into `frontend/e2e/phrases-visual.spec.ts`.

Result:

- catalog compact Light/Dark: `390×1628`;
- catalog desktop Light/Dark: `1440×1185`;
- detail compact Light/Dark: `390×2147`;
- detail desktop Light/Dark: `1440×1413`;
- all eight images are now verified by content-addressed blocking tests.

Reusable lesson: visual probes must attach actual screenshots on mismatch, and baseline promotion requires both human review and exact hash/dimension evidence.

## Production ownership result

- `LexigoBootstrappedApp`: session restoration, refresh coordination, account runtime and dynamic route selection.
- `LexigoPhrasesApp`: Phrases API reads, URL/history state, presentation and Learn handoff only.
- `RouteChrome`: sole primary navigation owner.
- `ReviewOutboxRuntime`: sole durable connectivity/review queue owner.
- Backend: authoritative order, phrase detail payload and persistence.
- Previous `LexigoPremiumApp` Phrases compatibility code remains only as rollback/dead-code debt for Issue #70; canonical routes no longer load it.

## Remaining execution

1. Run full CI on the final evidence head after all probes are removed and baselines/budgets are locked.
2. Confirm changed-path manifest and absence of probe placeholders.
3. Audit PR comments, reviews and unresolved threads.
4. Update PR body with exact final evidence and mark Ready.
5. Expected-head squash merge.
6. Verify post-merge `main` CI and exact-SHA stage/public deploy/browser checks.
7. Close Issue #199 and reset/reconcile agent state before selecting the next issue.
