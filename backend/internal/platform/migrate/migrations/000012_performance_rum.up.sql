-- Stores only coarse, allow-listed performance dimensions.
-- The table intentionally has no user identifier, IP address, request URL,
-- query string, referrer, email, cookie value, or raw User-Agent column.
create table performance_samples (
    id bigint generated always as identity primary key,
    sampled_at timestamptz not null default now(),
    app_version varchar(80) not null,
    route varchar(32) not null,
    device_class varchar(16) not null,
    browser_family varchar(16) not null,
    display_mode varchar(16) not null,
    metric_name varchar(32) not null,
    metric_value double precision not null,
    metric_rating varchar(20) not null,
    navigation_type varchar(24) not null,
    constraint performance_samples_app_version_check
        check (app_version ~ '^[A-Za-z0-9._-]{1,80}$'),
    constraint performance_samples_route_check
        check (route in (
            '/', '/learn', '/dictionary', '/phrases', '/progress', '/profile',
            '/lesson', '/word', '/phrase', '/privacy', '/terms', '/legal', '/not-found'
        )),
    constraint performance_samples_device_class_check
        check (device_class in ('mobile', 'tablet', 'desktop')),
    constraint performance_samples_browser_family_check
        check (browser_family in ('chromium', 'webkit', 'firefox', 'other')),
    constraint performance_samples_display_mode_check
        check (display_mode in ('browser', 'standalone', 'fullscreen', 'minimal-ui', 'unknown')),
    constraint performance_samples_metric_name_check
        check (metric_name in (
            'CLS', 'LCP', 'INP', 'FCP', 'TTFB',
            'NEXT_HYDRATION', 'NEXT_ROUTE_CHANGE', 'NEXT_RENDER',
            'LONG_TASK_COUNT', 'LONG_TASK_TOTAL', 'LONG_TASK_MAX',
            'OBSERVER_CALLBACK_TOTAL', 'OBSERVER_CALLBACK_MAX',
            'ACTION_START_LESSON', 'ACTION_REVIEW_ANSWER'
        )),
    constraint performance_samples_metric_value_check
        check (metric_value >= 0 and metric_value < 'Infinity'::double precision),
    constraint performance_samples_metric_rating_check
        check (metric_rating in ('good', 'needs-improvement', 'poor', 'unknown')),
    constraint performance_samples_navigation_type_check
        check (navigation_type in (
            'navigate', 'reload', 'back-forward', 'back-forward-cache',
            'prerender', 'restore', 'unknown'
        ))
);

-- Supports retention cleanup and time-window analysis without scanning the table.
create index performance_samples_sampled_at_idx
    on performance_samples (sampled_at);

-- Supports release and route comparisons for the Core Web Vitals dashboard.
create index performance_samples_analysis_idx
    on performance_samples (
        metric_name,
        sampled_at desc,
        app_version,
        route,
        device_class,
        browser_family,
        display_mode
    );

-- Canonical p75 aggregation used by release monitoring. Core Web Vitals are
-- evaluated separately per route, release, device class, browser, and PWA mode.
create view performance_core_web_vitals_daily_p75 as
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
    metric_name;
