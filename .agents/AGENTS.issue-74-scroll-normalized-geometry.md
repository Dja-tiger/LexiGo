# Issue #74 — scroll-normalized interaction geometry

## Scope

This rule applies to browser acceptance that compares geometry for two or more controls inside a scrollable owner, including dialogs, bottom sheets, route panels and nested overflow containers.

## Confirmed failure

On 2026-08-08, PR #446 CI #3075 / run `31277262935` failed `Frontend E2E (UI tests (shard 2/2))` on both Android Chromium and iOS WebKit, including their CI retries.

The calendar reminder acceptance first proved each weekday target independently, calling `scrollIntoView({ block: "center" })` before measuring it. It then stored the viewport-relative `getBoundingClientRect()` result for later pairwise overlap checks.

The Playwright trace showed the mobile `.lx-calendar-modal` scroll position changing while those samples were collected, including a move from `scrollTop=265` to `scrollTop=314`. The test then compared an earlier weekday rectangle with a later rectangle from a different viewport coordinate frame and reported a false overlap between weekday targets 0 and 4.

Production target geometry was not the root cause: the same run passed every individual 48px minimum and perimeter hit-ownership assertion before the pairwise comparison, and the authoritative accessibility job passed the live target scenario.

## Mandatory rules

1. Never compare viewport-relative rectangles that were sampled across separate scroll states.
2. Per-control actionability or perimeter checks may scroll each target into view, but cross-target overlap/order assertions must then re-sample all candidates in one browser evaluation without intervening scrolling, or normalize every sample into one stable owner/document coordinate system.
3. A scrollable dialog, sheet or nested overflow owner is part of the geometry contract. Record its changing scroll state when classifying an apparent overlap.
4. Do not enlarge gaps, shrink hit slop or weaken overlap thresholds until a common-coordinate measurement still proves a production collision.
5. Do not replace real hit testing with synthetic geometry-only acceptance. Minimum size and perimeter ownership remain independently required.
6. When a CI artifact proves a coordinate-frame defect in the acceptance itself, repair the test owner and rerun the full immutable-head matrix; do not change production CSS solely to satisfy stale coordinates.

## Regression gate

For `frontend/e2e/calendar-reminder-touch-targets.spec.ts`:

- each live preview/close/weekday control is still measured individually for 44px fine / 48px coarse minimum and real perimeter ownership;
- all seven weekday effective rectangles are re-sampled together through one `evaluateAll` call after the individual checks;
- pairwise non-overlap is asserted only on that common-frame snapshot;
- Android Chromium and iOS WebKit must pass without retry-dependent behavior;
- authoritative UI and accessibility collections must both continue to collect the test.

## Reusable lesson

Geometry is meaningful only inside a shared coordinate frame. Scrolling a nested owner between `getBoundingClientRect()` samples changes viewport coordinates even when the product layout itself is unchanged.
