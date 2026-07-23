# Frontend route bundle budgets

Issue #115 requires a measurable baseline before the monolithic product graph is split into route-level client islands. The gate measures what a user actually downloads, not private framework artifacts.

## Measurement model

Next.js 16 uses Turbopack for `next build`. Internal route-size manifests and the former `First Load JS` reporting are not a stable public contract and do not model App Router layouts and client components reliably. LexiGo therefore measures cold browser transfer in the existing production performance harness.

`frontend/e2e/route-bundle-budget.spec.ts` opens every canonical route in a fresh Pixel 5 Chromium context with:

- production `next build` + `next start`;
- service workers blocked;
- browser cache disabled;
- 4× CPU throttling;
- simulated 3G;
- deterministic authenticated API fixtures.

For each route the test records:

- initial request count;
- every loaded `/_next/static/chunks/*.js` asset;
- transferred JavaScript bytes using `max(transferSize, encodedBodySize)`;
- runtime errors during direct entry.

The covered routes are `/`, `/learn`, `/phrases`, `/dictionary`, `/progress`, `/profile` and `/lesson/active`.

## Blocking CI gate

`playwright.performance.config.ts` runs both the existing interaction/Core Web Vitals budget and the route JavaScript budget. The performance browser job is part of the required frontend matrix, so a route that exceeds its ceiling fails the PR.

Three self-hosted runner services share one physical host. Normal frontend install, build and browser commands acquire a shared host lock through `scripts/ci/frontend-container.sh`; the performance command acquires the same lock exclusively. Performance measurement therefore waits until competing frontend workloads finish, while ordinary browser groups retain parallel execution. The lock behavior is covered by `scripts/ci/frontend-container.test.sh`. Timing ceilings are not raised to absorb host contention.

The route report is written to:

```text
test-results/route-bundle-budget-report.json
```

Playwright global teardown also embeds it into the existing required artifact:

```text
test-results/performance-budget-report.json
```

The report contains the execution profile, configured budgets, route totals and exact JavaScript asset inventory. Existing CI diagnostics upload `test-results` on failure and retain the combined performance artifact for successful release validation.

## Baseline and ceilings

CI run `29954272668` measured every canonical route on the original global product graph:

| Route | JavaScript transfer | Initial requests |
| --- | ---: | ---: |
| `/` | 238,257 bytes | 18 |
| `/learn` | 238,257 bytes | 19 |
| `/phrases` | 238,257 bytes | 19 |
| `/dictionary` | 238,257 bytes | 19 |
| `/progress` | 238,257 bytes | 18 |
| `/profile` | 238,257 bytes | 20 |
| `/lesson/active` | 238,257 bytes | 18 |

All routes loaded the same 12 JavaScript chunks. This is the measurable baseline for the original global `RoutedLexigoApp` client graph and the evidence for extracting route-level islands.

`frontend/bundle-budgets.json` owns the canonical route inventory and release ceilings. Routes that still use the global product graph retain the original `275,000` byte ceiling and at most 24 initial requests.

These limits are ceilings, not targets. Client-island extraction must reduce route transfer and then tighten the corresponding route-specific ceiling from a successful production CI artifact.

## First route island: Dictionary

The first production slice of Issue #115 moves `/dictionary` and `/words/:id` into `LexigoDictionaryApp`, a dedicated dynamic client entry. `LexigoBootstrappedApp` remains mounted across route transitions and continues to own session restoration, refresh coordination, review outbox runtime, account controls and session notices.

The Dictionary island owns only:

- dictionary route navigation and filter state;
- catalog metadata and progress reads required by that screen;
- paginated word-list and word-detail requests;
- transitions from the catalog to lesson configuration or authentication.

The shared authenticated JSON client in `frontend/lib/authorized-json.ts` preserves the existing CSRF, timeout, typed-response and refresh-on-401 behavior without importing the monolithic product graph. Browser regressions verify direct entry, Home ↔ Dictionary transitions, Back/Forward, scroll restoration and a single `/api/v1/auth/refresh` bootstrap request.

CI run `30017544470` on head `d803f844e899270b88af3b6fd47e977dd02ad6de` measured the merged island:

| Route | Before | After | Reduction | Initial requests |
| --- | ---: | ---: | ---: | ---: |
| `/dictionary` | 238,257 bytes | 205,239 bytes | 33,018 bytes (13.9%) | 18 |

The route-specific budget is therefore locked to:

- `baselineJavascriptBytes`: `205239`;
- `maxJavascriptBytes`: `235000`;
- `maxInitialRequests`: `22`.

The ceiling leaves bounded measurement and dependency-update headroom while remaining below the original monolithic transfer. `schemaVersion: 2` allows a route whose baseline differs from the shared original measurement to carry explicit `baselineEvidence` with the source run, capture date and head SHA.

A budget increase requires:

- the before/after JSON reports;
- identification of the new asset or dependency;
- an explanation of why the increase is necessary;
- confirmation that direct entry, reload, Back/Forward and browser suites remain green.

Do not raise a ceiling solely to make CI green.

## Local use

From `frontend`:

```bash
npm ci
npm run build
npm run test:e2e:performance
```

## Ownership

- `bundle-budgets.json` owns canonical routes, baselines, evidence and ceilings.
- `route-bundle-budget.spec.ts` owns cold-route JavaScript measurement and reporting.
- `bundle-budgets.test.ts` owns configuration invariants for ceilings and route-specific evidence.
- `performance-budget.spec.ts` continues to own LCP, CLS, long-task, CSS and interaction budgets.
- `performance-global-teardown.ts` owns the combined performance artifact contract.
- `playwright.performance.config.ts` owns the production low-end mobile execution profile.
- `frontend-container.sh` owns host-level shared/exclusive scheduling for frontend workloads.
- `frontend-container.test.sh` owns the concurrency contract for that scheduling.
