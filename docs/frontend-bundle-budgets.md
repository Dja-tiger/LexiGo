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

The covered routes are `/`, `/learn`, `/phrases`, `/dictionary`, `/words/101`, `/progress`, `/profile`, `/lesson/active`, `/scenarios` and `/scenarios/incident-update`.

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

The global teardown emits one stable, sorted log line per route containing only route, JavaScript bytes and initial request count. The JSON report remains the owner of the full execution profile, configured budgets and exact JavaScript asset inventory.

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

These limits are ceilings, not targets. Client-island extraction must reduce route transfer and then tighten the corresponding route-specific ceiling from successful production CI evidence.

## Home route island

`/` is rendered by the dedicated dynamic entry `LexigoHomeApp`. `LexigoBootstrappedApp` remains mounted and is still the sole owner of session restoration, refresh coordination, account runtime and route-entry loading. `ReviewOutboxRuntime`, Service Worker and appearance bootstrap remain persistent shared owners outside Home.

The Home island owns only:

- Home progress and active-lesson reads;
- next-best-action resolution and presentation;
- lesson creation through the existing authenticated API;
- one-time handoff to `/lesson/active?resume=1`.

It does not import `LexigoPremiumApp`, own session restoration, register the PWA lifecycle or create another review outbox. Browser contracts cover direct entry, Home ↔ Learn/Dictionary/Progress, Back/Forward, standalone PWA relaunch and exactly one network `/api/v1/auth/refresh` bootstrap.

CI #2120/run `30273535972` completed the full required matrix successfully on developer-authored head `660983ec8773186a719c2f6a0f1317fa65723245`. Because successful performance jobs intentionally do not upload their detailed report, controlled run #2122/run `30275645894` added one test-only assertion after the complete report had been written. Artifact `8656783937` (`sha256:796d3b3f2b569d2bbc777ec52664464b6a5514d0b529e35af090c93b32230a69`) captured the exact route inventory on head `dd35a8f3266aa9358f60a6f05abe2076cf404768`. The probe did not change the production graph and was then removed byte-for-byte; `frontend/e2e/route-bundle-budget.spec.ts` returned to blob `304e7c62d3163a59edac3e648246e2aa4ce00660` before final CI.

| Route | Before | After | Reduction | Initial requests |
| --- | ---: | ---: | ---: | ---: |
| `/` | 238,257 bytes | 207,675 bytes | 30,582 bytes (12.8%) | 18 |

The route-specific budget is locked to:

- `baselineJavascriptBytes`: `207675`;
- `maxJavascriptBytes`: `235000`;
- `maxInitialRequests`: `21`;
- `baselineEvidence.sourceRun`: `30275645894`;
- `baselineEvidence.headSha`: `dd35a8f3266aa9358f60a6f05abe2076cf404768`.

The JavaScript ceiling leaves 13.2% bounded headroom and remains below the original 238,257-byte monolithic transfer. The request ceiling remains below the original 24-request release limit. `frontend/lib/bundle-budgets.test.ts` stores the original monolithic constants independently from the now-extracted routes and blocks any Home, Learn, Dictionary, Phrases or Progress ceiling from reaching that original boundary.

## Learn route island

`/learn` is rendered by the dedicated dynamic entry `LexigoLearnApp`. `LexigoBootstrappedApp` remains the sole owner of session restoration, refresh coordination, account runtime and route-entry selection, while `ReviewOutboxRuntime`, Service Worker and appearance bootstrap remain persistent shared owners.

The Learn island owns only:

- catalog metadata, progress and active-lesson reads required by Lesson Composer;
- preview, create, resume and optimistic discard flows;
- source/topic URL state and Lesson Composer presentation;
- one-way handoff to the existing `/lesson/active` product graph.

CI #2194/run `30311583592` completed the full required matrix successfully on developer-authored head `1450986be0e1c63ddce47e9ddb33fc4324bcf9b1`. Controlled run `30312155204` then added one test-only assertion after the complete route report had been written. Artifact `8670855986` (`sha256:e24af0cfe3aa3c71d7a31c28077ca20490d98d2f5d62ba4674fc6f4b0b98f32c`) captured the exact route inventory on probe head `b82c31acfc9bd48ec5b28682a49035226bdef556`. The production graph was unchanged by the probe, and `frontend/e2e/route-bundle-budget.spec.ts` was restored to canonical blob `304e7c62d3163a59edac3e648246e2aa4ce00660` before final CI.

| Route | Before | After | Reduction | Initial requests |
| --- | ---: | ---: | ---: | ---: |
| `/learn` | 238,257 bytes | 210,986 bytes | 27,271 bytes (11.4%) | 20 |

The route-specific budget is locked to:

- `baselineJavascriptBytes`: `210986`;
- `maxJavascriptBytes`: `235000`;
- `maxInitialRequests`: `22`;
- `baselineEvidence.sourceRun`: `30312155204`;
- `baselineEvidence.headSha`: `b82c31acfc9bd48ec5b28682a49035226bdef556`.

The JavaScript ceiling leaves 24,014 bytes (11.4%) of bounded headroom and remains below the original 238,257-byte measured monolith. The request ceiling remains below the original 24-request limit. `frontend/lib/bundle-budgets.test.ts` blocks any Learn baseline or ceiling from returning to the monolithic boundary.

## Phrases route island

`/phrases` and `/phrases/[slug]` are rendered by the dedicated dynamic entry `LexigoPhrasesApp`. `LexigoBootstrappedApp` remains the sole owner of session restoration, refresh coordination, account runtime and route-entry selection. `ReviewOutboxRuntime`, Service Worker and appearance bootstrap remain persistent shared owners.

The Phrases island owns only:

- authenticated phrase catalog and independent phrase-detail reads;
- URL-backed topic, query, sort and page state;
- native History and scroll restoration inside the Phrases route graph;
- presentation of loading, empty, correlated error/retry and guest-preview states;
- one-way handoff to `/learn?source=phrases`.

Functional CI #2258/run `30364447226` completed the full required matrix on head `a7835d85390fc143d50c023d647cf1785ed566bf`. Controlled run `30366489438` then added a test-only assertion after the complete report had been written. Artifact `8691127915` (`sha256:ac33ca9695a7b3bc8db26b4f8bca89c54fa05b0eb0a8145c7b93cf629bc9c589`) captured the exact route inventory on probe head `dc22918ffe99bc8e52116d885ab0baf961762d00`. The production graph was unchanged by the probe, and `frontend/e2e/route-bundle-budget.spec.ts` was restored byte-for-byte to canonical blob `304e7c62d3163a59edac3e648246e2aa4ce00660` before final CI.

| Route | Before | After | Reduction | Initial requests |
| --- | ---: | ---: | ---: | ---: |
| `/phrases` | 238,257 bytes | 226,149 bytes | 12,108 bytes (5.1%) | 19 |

The route-specific budget is locked to:

- `baselineJavascriptBytes`: `226149`;
- `maxJavascriptBytes`: `235000`;
- `maxInitialRequests`: `22`;
- `baselineEvidence.sourceRun`: `30366489438`;
- `baselineEvidence.headSha`: `dc22918ffe99bc8e52116d885ab0baf961762d00`.

The JavaScript ceiling leaves 8,851 bytes (3.9%) of bounded headroom while remaining 3,257 bytes below the original 238,257-byte transfer. The request ceiling remains below the original 24-request release limit. `frontend/lib/bundle-budgets.test.ts` prevents the Phrases baseline or ceiling from returning to the original product graph boundary.

## Active Lesson route island

`/lesson/active` is rendered by the dedicated dynamic entry `LexigoActiveLessonApp`. The island owns active-session restore/resume, study/recall/choice review, optimistic-version resynchronization, answer suggestion, Lesson Result continuation, focused-route focus/announcement and confirmed safe exit. `LexigoBootstrappedApp`, `ReviewOutboxRuntime`, `RoutedLexigoApp` and the Service Worker remain the sole persistent session, offline, immutable-history and PWA owners.

CI #2202/run `30316446027` completed the full required functional matrix successfully on developer-authored head `ffedfbc47b1694afe8288dcb2c68d9034a0f718d`. Controlled CI #2203/run `30316931098` then added one test-only assertion after the complete route report had been written. Artifact `8672549672` (`sha256:a66f6155801715d4d689adb84f82b136e57e5360ef76c193ad77e2db9ea3829a`) captured the exact route inventory on probe head `ce468c054dc57f3dc154a7b8b016f0999b04d90c`. The embedded and standalone route-result arrays were byte-equivalent after canonical JSON sorting. The probe was removed byte-for-byte, restoring `frontend/e2e/route-bundle-budget.spec.ts` to blob `304e7c62d3163a59edac3e648246e2aa4ce00660`.

| Route | Before | After | Reduction | Initial requests |
| --- | ---: | ---: | ---: | ---: |
| `/lesson/active` | 238,257 bytes | 220,225 bytes | 18,032 bytes (7.6%) | 19 |

The route-specific budget is locked to:

- `baselineJavascriptBytes`: `220225`;
- `maxJavascriptBytes`: `235000`;
- `maxInitialRequests`: `22`;
- `baselineEvidence.sourceRun`: `30316931098`;
- `baselineEvidence.headSha`: `ce468c054dc57f3dc154a7b8b016f0999b04d90c`.

The JavaScript ceiling leaves 14,775 bytes (6.7%) of bounded headroom and remains below the original 238,257-byte measured monolith. The request ceiling remains below the original 24-request limit. `frontend/lib/bundle-budgets.test.ts` prevents the Active Lesson baseline or ceiling from returning to the original product graph boundary.

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

## Progress route island

`/progress` is rendered by the dedicated dynamic entry `LexigoProgressApp`. `LexigoBootstrappedApp` remains mounted and is still the sole owner of session restoration, refresh coordination, route-entry loading, account lifecycle and `ReviewOutboxRuntime`.

The Progress island owns only:

- the authenticated Progress read and its loading/error/retry state;
- due-queue and Scenario actions initiated from Progress;
- Progress evidence presentation;
- adoption of an access token returned by the shared authenticated JSON client.

It does not import the monolithic `LexigoPremiumApp`, restore or refresh the session independently, own the review outbox, or register the PWA lifecycle. Source contracts enforce these boundaries. Browser coverage opens `/progress` directly and repeatedly navigates Progress ↔ Home/Learn/Dictionary while requiring exactly one network `/api/v1/auth/refresh` bootstrap request.

CI #2074/run `30252335806` completed successfully on head `03854f0601972d270bb052725548578cf11929e3`, including frontend lint/typecheck/unit/build, all Chromium/WebKit/mobile/PWA groups and the performance gate. A controlled measurement execution on the same production graph, head `96479e0f07eda62cff5176f519e6294e005a451b`, produced exact report artifact `8648042201`; that head differed only by a temporary test-only probe which was removed before the final head.

| Route | Before | After | Reduction | Initial requests |
| --- | ---: | ---: | ---: | ---: |
| `/progress` | 238,257 bytes | 207,502 bytes | 30,755 bytes (12.9%) | 18 |

The route-specific budget is locked to:

- `baselineJavascriptBytes`: `207502`;
- `maxJavascriptBytes`: `240000`;
- `maxInitialRequests`: `21`;
- `baselineEvidence.sourceRun`: `30252335806`;
- `baselineEvidence.headSha`: `03854f0601972d270bb052725548578cf11929e3`.

The JavaScript ceiling gives less than 16% bounded headroom and remains below the original monolithic ceiling. The request ceiling also remains below the original 24-request limit. `frontend/lib/bundle-budgets.test.ts` blocks any change that makes Progress baseline or ceilings equal to or larger than the monolithic product graph.

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
- `performance-global-teardown.ts` owns the combined performance report and compact route log contract.
- `playwright.performance.config.ts` owns the production low-end mobile execution profile.
- `frontend-container.sh` owns host-level shared/exclusive scheduling for frontend workloads.
- `frontend-container.test.sh` owns the concurrency contract for that scheduling.
