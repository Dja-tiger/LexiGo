# Performance observability and release budgets

## Goals

LexiGo collects enough field data to detect performance regressions without creating a user-tracking system. The implementation separates two controls:

1. **RUM** measures real Core Web Vitals and coarse runtime timings in production.
2. **CI budgets** run a reproducible low-end Android profile and block regressions before merge.

## Privacy contract

`post /api/v1/performance/rum` is public because guest sessions also affect release quality. The endpoint is same-origin protected, limited to 120 requests per minute per source address, accepts at most 32 KiB, and stores at most 16 samples per report. Its limiter is fail-closed: when Redis is unavailable, telemetry returns `503` instead of creating an unbounded PostgreSQL write path. Authentication and account endpoints retain their existing fail-open policy so a Redis incident does not block core account operations.

The payload contains only:

- sanitized application build identifier;
- normalized route from a fixed allow-list;
- coarse device class: `mobile`, `tablet`, or `desktop`;
- coarse browser engine family;
- display mode: browser or PWA mode;
- allow-listed metric name, numeric value, rating, and navigation type.

The database schema intentionally has no user ID, email, IP address, raw URL, query string, referrer, cookie, session ID, metric ID, or raw User-Agent column. Unknown JSON fields are rejected. Dynamic routes are normalized, for example `/word/101` becomes `/word`.

The browser reporter does not run when Global Privacy Control or Do Not Track is enabled. Production sampling defaults to `0.1` and is stable for the current browser tab through `sessionStorage`. Configure another bounded value from `0` through `1` with `NEXT_PUBLIC_RUM_SAMPLE_RATE` at frontend build time.

## Collected metrics

Core Web Vitals and supporting navigation metrics:

- `LCP`, `INP`, `CLS`;
- `FCP`, `TTFB`;
- `NEXT_HYDRATION`, `NEXT_ROUTE_CHANGE`, `NEXT_RENDER`.

Runtime diagnostics:

- long-task count, total duration, and maximum duration;
- total and maximum duration of long-task observer callbacks;
- action-to-next-paint timings for lesson start and answer rating.

Reports are batched and sent with `fetch(..., { keepalive: true, credentials: "omit" })`. Session cookies and authorization headers are not sent, including during page exit. The fail-closed `503` and `Retry-After` behavior is documented here and covered by backend tests.

## p75 production queries

Migration `000012_performance_rum.up.sql` creates the base RUM schema. Migration `000013_performance_rum_retention.up.sql` extends `performance_core_web_vitals_daily_p75` with `is_representative`. Each Core Web Vital is aggregated independently by:

- date;
- application version;
- normalized route;
- device class;
- browser family;
- display mode.

Release targets at p75:

| Metric | Target |
|---|---:|
| LCP | `<= 2500 ms` |
| INP | `<= 200 ms` |
| CLS | `<= 0.1` |

Example dashboard query:

```sql
select
    sample_date,
    app_version,
    route,
    device_class,
    browser_family,
    display_mode,
    metric_name,
    sample_count,
    p75_value,
    is_representative
from performance_core_web_vitals_daily_p75
where sample_date >= current_date - 7
order by sample_date desc, app_version, route, metric_name;
```

A production alert must include `is_representative = true`. The fixed threshold is 75 samples for one complete segment. Low-volume segments remain visible on dashboards but cannot page or block a release.

## Raw-sample retention

Raw `performance_samples` are retained for 30 days by default. The API starts one cleanup worker per replica, but a PostgreSQL session-level advisory lock permits only one replica to delete at a time. Each run uses the `sampled_at` index, deletes the oldest rows in bounded batches with `for update skip locked`, and stops after a configured maximum number of batches. A large backlog is therefore drained across multiple scheduled runs instead of one long transaction.

Runtime configuration:

| Variable | Default | Safety bound |
|---|---:|---:|
| `RUM_RETENTION_ENABLED` | `true` | boolean |
| `RUM_RETENTION_TTL` | `720h` | at least `24h` |
| `RUM_RETENTION_CLEANUP_INTERVAL` | `1h` | at least `1m` |
| `RUM_RETENTION_BATCH_SIZE` | `5000` | `100..50000` |
| `RUM_RETENTION_MAX_BATCHES` | `20` | `1..100` |

At the defaults, one run deletes no more than 100,000 rows. Successful runs emit `RUM retention cleanup completed` with `deleted_rows`, `batches`, `limit_reached`, and duration. Lock contention is logged at debug level. Database failures are logged as `RUM retention cleanup failed`.

The ingest handler emits structured `performance report rejected` events for malformed or invalid reports and `performance report storage failed` for PostgreSQL write failures. Rate-limit and Redis fail-closed responses remain visible through the existing HTTP access logs as `429` and `503` for `/api/v1/performance/rum`.

Operational size and ingest query:

```sql
select
    observed_at,
    total_samples,
    samples_last_24h,
    oldest_sample_at,
    newest_sample_at,
    table_bytes,
    index_bytes,
    total_bytes
from performance_rum_operational_status;
```

Daily accepted-sample rate:

```sql
select
    sample_date,
    sample_count,
    app_versions,
    first_sample_at,
    last_sample_at
from performance_rum_ingest_daily
where sample_date >= current_date - 14
order by sample_date desc;
```

### Retention change and rollback runbook

1. Check `performance_rum_operational_status`, daily ingest, PostgreSQL capacity, and recent cleanup logs.
2. Change only one retention variable per rollout. Keep batch and maximum-batch limits within the validated bounds.
3. Deploy to stage and confirm that account, lesson, and RUM integration tests remain green.
4. In production, verify `deleted_rows`, query latency, table size, and `/api/v1/performance/rum` error rate after the first cleanup.
5. To stop deletion immediately, set `RUM_RETENTION_ENABLED=false` and restart API replicas. In-flight statements are cancelled during graceful shutdown.
6. To preserve more future data, increase `RUM_RETENTION_TTL`. Increasing the TTL cannot restore rows already deleted.
7. Restore deleted raw samples only from a PostgreSQL backup and only after disabling the worker. Validate the restored time range before re-enabling cleanup.

Cleanup is idempotent: rerunning it with the same cutoff finds no already-deleted rows. The worker does not modify account, lesson, catalog, review, or aggregate source data.

## CI mobile profile

`npm run test:e2e:performance` starts the production Next.js build and profiles Home, Dictionary, and an active Lesson in isolated cold browser contexts.

The profile uses:

- Chromium with a Pixel-class mobile viewport;
- four-times CPU throttling;
- simulated 3G latency and throughput;
- deterministic backend fixtures;
- Service Worker disabled to measure the application rather than a pre-warmed cache.

The gate writes `test-results/performance-budget-report.json`. CI uploads it for 30 days even when a budget fails. The JSON report is the review artifact for every release-budget decision.

Initial budgets:

| Signal | Budget |
|---|---:|
| Initial requests per cold route | `<= 50` |
| Initial JavaScript per cold route | `<= 700000 bytes` |
| Initial CSS per cold route | `<= 180000 bytes` |
| Lab LCP under the throttled profile | `<= 5000 ms` |
| CLS | `<= 0.1` |
| Total long-task time | `<= 1000 ms` |
| Longest task | `<= 300 ms` |
| Action to next paint | `<= 350 ms` |

These lab limits are not substitutes for the field p75 targets. They are deterministic regression limits for the current architecture. Tighten them only after measuring a stable baseline across several CI runs; never raise a limit merely to make a regression green.

## Baseline review

When the performance gate fails:

1. Download `performance-budget-<commit>` and the Playwright diagnostics.
2. Compare every route against the previous successful report.
3. Identify whether the regression is transfer size, rendering, layout shift, long tasks, or action latency.
4. Profile the responsible component or dependency.
5. Fix the regression and rerun the complete frontend gate.

Changes to budgets require an explicit explanation in the pull request, the measured before/after values, and confirmation that the field p75 targets remain unchanged.
