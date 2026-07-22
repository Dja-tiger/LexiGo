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

CI run `29954272668` measured every canonical route on the same production build:

| Route | JavaScript transfer | Initial requests |
| --- | ---: | ---: |
| `/` | 238,257 bytes | 18 |
| `/learn` | 238,257 bytes | 19 |
| `/phrases` | 238,257 bytes | 19 |
| `/dictionary` | 238,257 bytes | 19 |
| `/progress` | 238,257 bytes | 18 |
| `/profile` | 238,257 bytes | 20 |
| `/lesson/active` | 238,257 bytes | 18 |

All routes loaded the same 12 JavaScript chunks. This is the measurable baseline for the current global `RoutedLexigoApp` client graph and the evidence for extracting route-level islands.

`frontend/bundle-budgets.json` owns the canonical route inventory and release ceilings. The first ceiling is `275,000` bytes per route, approximately 15% above the measured transfer, with at most 24 initial requests.

These limits are ceilings, not targets. Client-island extraction should reduce route transfer and then tighten the corresponding ceiling.

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

- `bundle-budgets.json` owns canonical routes, baselines and ceilings.
- `route-bundle-budget.spec.ts` owns cold-route JavaScript measurement and reporting.
- `performance-budget.spec.ts` continues to own LCP, CLS, long-task, CSS and interaction budgets.
- `performance-global-teardown.ts` owns the combined performance artifact contract.
- `playwright.performance.config.ts` owns the production low-end mobile execution profile.
- `frontend-container.sh` owns host-level shared/exclusive scheduling for frontend workloads.
- `frontend-container.test.sh` owns the concurrency contract for that scheduling.
