# Current Task Progress

## 2026-07-28 17:30 Europe/Moscow

### Identity

- Issue: #199 — Phrases runtime implementation and route-island extraction.
- Branch: `agent/issue-199-phrases-runtime`.
- Base/main SHA at branch creation: `3475d1443bbccedb63bca54e67c5762aec2374e3`.
- Draft PR: #273.
- Current head: resolve from live PR ref after this evidence write.

### Verified implementation

- Mandatory repository harness and every indexed mandatory document were read from live `main` before product writes.
- Stale PROJECT_STATE was reconciled separately through PR #272 before Issue #199 implementation started.
- Exact Figma production context was read for catalog/detail Light/Dark mobile/desktop and resilient-state nodes.
- Canonical `/phrases` and `/phrases/[slug]` now use the dedicated dynamically loaded `LexigoPhrasesApp` entry instead of the `LexigoPremiumApp` compatibility graph.
- Phrases remains a Dictionary catalog kind; primary navigation remains Home, Learn, Dictionary and Progress.
- Authenticated catalog requests preserve server order and bounded pagination through `/api/v1/words?kind=phrase&source=phrases`.
- Direct Phrase Detail loads `/api/v1/phrases/{slug}` independently without catalog metadata, progress or catalog warm-up.
- URL-backed `topic`, `query`, `sort` and `page` survive reload and Browser Back/Forward.
- History writes use the shared navigation state owner and preserve route-graph state and scroll restoration.
- Lesson configuration hands off to the existing Learn island through `source=phrases` and the selected topic.
- Session restoration, refresh coordination, review outbox, Service Worker, appearance and account runtime remain centralized existing owners.
- Loading, empty, correlated error/retry, offline and guest-preview states remain local to the Phrases surface while controls stay visible.
- Responsive, Light/Dark, reduced-motion, forced-colors, keyboard/focus and 200% reflow contracts are implemented.
- Request-scoped E2E fixtures cover direct detail, catalog ordering, bounded Android pagination and Learn handoff.

### Functional CI evidence

- CI #2258 / run `30364447226` completed successfully on immutable head `a7835d85390fc143d50c023d647cf1785ed566bf`.
- Passed gates included frontend lint, TypeScript, unit/source tests, production build, dependency audit, backend unit/security, backend integration, both UI shards, visual regression, accessibility/axe, content security, controlled Service Worker, iOS PWA, Dictionary smoke and performance budgets.
- A previously observed Active Lesson WebKit race outside Phrases ownership passed on the repeated immutable-head run; no unrelated runtime change was made.

### Controlled performance evidence

- Controlled run: `30366489438`.
- Probe head: `dc22918ffe99bc8e52116d885ab0baf961762d00`.
- Artifact: `8691127915`, `frontend-playwright-report-perf`.
- Artifact digest: `sha256:ac33ca9695a7b3bc8db26b4f8bca89c54fa05b0eb0a8145c7b93cf629bc9c589`.
- Exact cold `/phrases` measurement: `226149` JavaScript bytes and `19` initial requests.
- Original monolithic route: `238257` JavaScript bytes and `19` initial requests.
- Reduction: `12108` bytes, or `5.1%`.
- Permanent budget: baseline `226149`, ceiling `235000`, maximum `22` initial requests.
- The test-only probe was removed byte-for-byte; `route-bundle-budget.spec.ts` returned to canonical blob `304e7c62d3163a59edac3e648246e2aa4ce00660`.

### Controlled visual evidence

- Controlled run: `30366489438` on head `dc22918ffe99bc8e52116d885ab0baf961762d00`.
- Artifact: `8691167183`, `frontend-playwright-report-visual`.
- Artifact digest: `sha256:5b9a1c18f27d014de47885a1ae7743f93583730b17734e5dc04eb6d293b16790`.
- Eight Linux full-page images were inspected for compact/desktop, Light/Dark, catalog/detail.
- No horizontal overflow was present; approved route hierarchy, controls, responsive boundaries and detail composition were preserved.
- Exact dimensions and SHA-256 hashes were promoted into `frontend/e2e/phrases-visual.spec.ts` as blocking content-addressed baselines.

### Current changed evidence owners

- `frontend/bundle-budgets.json` owns the measured `/phrases` baseline and permanent ceiling.
- `frontend/lib/bundle-budgets.test.ts` blocks Phrases from returning to the monolithic baseline or release limits.
- `docs/frontend-bundle-budgets.md` records the functional CI, controlled artifact and reduction evidence.
- `frontend/e2e/phrases-visual.spec.ts` owns eight content-addressed Linux baselines.
- `frontend/e2e/phrases-production.spec.ts` covers server order, URL state/reload, direct-detail isolation and Learn handoff.

### Remaining release gates

- Run one full immutable-head CI after all evidence and probe-removal commits.
- Confirm the final changed-path manifest contains no prohibited or undeclared files and no probe placeholders remain.
- Audit PR comments, review submissions and unresolved threads.
- Update the PR description with exact final CI, budget and visual evidence; mark PR Ready.
- Perform expected-head squash merge.
- Verify post-merge `main` CI.
- Deploy the exact squash merge SHA to stage and verify deploy, public smoke and public browser checks.
- Close Issue #199 and reset/reconcile `.agents/current/**` only after exact-SHA post-merge validation.

### Next action

Wait for the final CI on the new evidence head. Do not start another issue until PR #273 is squash-merged and its exact merge SHA passes stage/public validation.
