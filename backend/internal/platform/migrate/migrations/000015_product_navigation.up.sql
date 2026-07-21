-- Stores coarse navigation transitions only. This table intentionally has no
-- user identifier, session identifier, IP address, raw URL, query string,
-- referrer, free-form label, search text, email, cookie, or raw User-Agent.
create table product_navigation_events (
    id bigint generated always as identity primary key,
    occurred_at timestamptz not null default now(),
    app_version varchar(80) not null,
    from_route varchar(32) not null,
    to_route varchar(32) not null,
    intent varchar(40) not null,
    is_backtrack boolean not null,
    device_class varchar(16) not null,
    browser_family varchar(16) not null,
    display_mode varchar(16) not null,
    constraint product_navigation_events_app_version_check
        check (app_version ~ '^[A-Za-z0-9._-]{1,80}$'),
    constraint product_navigation_events_from_route_check
        check (from_route in (
            '/', '/learn', '/dictionary', '/phrases', '/progress', '/profile',
            '/lesson', '/word', '/phrase', '/privacy', '/terms', '/legal', '/not-found'
        )),
    constraint product_navigation_events_to_route_check
        check (to_route in (
            '/', '/learn', '/dictionary', '/phrases', '/progress', '/profile',
            '/lesson', '/word', '/phrase', '/privacy', '/terms', '/legal', '/not-found'
        )),
    constraint product_navigation_events_route_change_check
        check (from_route <> to_route),
    constraint product_navigation_events_intent_check
        check (intent in (
            'primary_navigation', 'home_next_action', 'home_configure_lesson',
            'home_find_material', 'catalog_switch', 'catalog_open_detail',
            'catalog_configure_lesson', 'lesson_start', 'lesson_exit',
            'authentication', 'browser_history', 'in_app_navigation'
        )),
    constraint product_navigation_events_device_class_check
        check (device_class in ('mobile', 'tablet', 'desktop')),
    constraint product_navigation_events_browser_family_check
        check (browser_family in ('chromium', 'webkit', 'firefox', 'other')),
    constraint product_navigation_events_display_mode_check
        check (display_mode in ('browser', 'standalone', 'fullscreen', 'minimal-ui', 'unknown'))
);

create index product_navigation_events_occurred_at_idx
    on product_navigation_events (occurred_at);

-- Supports transition funnels and direct comparison of immediate returns.
create index product_navigation_events_analysis_idx
    on product_navigation_events (
        occurred_at desc,
        app_version,
        from_route,
        to_route,
        intent,
        is_backtrack,
        device_class,
        browser_family,
        display_mode
    );

create view product_navigation_daily as
select
    occurred_at::date as event_date,
    app_version,
    from_route,
    to_route,
    intent,
    is_backtrack,
    device_class,
    browser_family,
    display_mode,
    count(*)::bigint as transition_count
from product_navigation_events
group by
    occurred_at::date,
    app_version,
    from_route,
    to_route,
    intent,
    is_backtrack,
    device_class,
    browser_family,
    display_mode;
