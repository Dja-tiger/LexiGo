-- RUM raw samples have a bounded application-level retention policy. The API
-- worker deletes rows older than the configured TTL in small indexed batches.
-- These views expose the database-side signals required by dashboards and
-- operational checks without granting direct write access to telemetry tables.

create or replace view performance_core_web_vitals_daily_p75 as
with aggregated as (
    select
        sampled_at::date as sample_date,
        app_version,
        route,
        device_class,
        browser_family,
        display_mode,
        metric_name,
        count(*)::bigint as sample_count,
        percentile_cont(0.75) within group (order by metric_value) as p75_value
    from performance_samples
    where metric_name in ('CLS', 'LCP', 'INP')
    group by
        sampled_at::date,
        app_version,
        route,
        device_class,
        browser_family,
        display_mode,
        metric_name
)
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
    sample_count >= 75 as is_representative
from aggregated;

comment on view performance_core_web_vitals_daily_p75 is
    'Daily p75 Core Web Vitals. is_representative requires at least 75 samples and must gate alerts.';

create view performance_rum_ingest_daily as
select
    sampled_at::date as sample_date,
    count(*)::bigint as sample_count,
    count(distinct app_version)::bigint as app_versions,
    min(sampled_at) as first_sample_at,
    max(sampled_at) as last_sample_at
from performance_samples
group by sampled_at::date;

comment on view performance_rum_ingest_daily is
    'Accepted RUM samples by UTC database date for ingest-rate monitoring.';

create view performance_rum_operational_status as
select
    now() as observed_at,
    count(*)::bigint as total_samples,
    count(*) filter (where sampled_at >= now() - interval '24 hours')::bigint as samples_last_24h,
    min(sampled_at) as oldest_sample_at,
    max(sampled_at) as newest_sample_at,
    pg_relation_size('performance_samples')::bigint as table_bytes,
    pg_indexes_size('performance_samples')::bigint as index_bytes,
    pg_total_relation_size('performance_samples')::bigint as total_bytes
from performance_samples;

comment on view performance_rum_operational_status is
    'Current RUM row volume, age range, and PostgreSQL table/index size.';
