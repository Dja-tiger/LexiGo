create table product_retention_events (
    id bigserial primary key,
    received_at timestamptz not null default now(),
    app_version text not null,
    event_name text not null,
    action text not null,
    delay_bucket text not null,
    device_class text not null,
    browser_family text not null,
    display_mode text not null,
    constraint product_retention_app_version_check
        check (app_version ~ '^[A-Za-z0-9._-]{1,80}$'),
    constraint product_retention_event_name_check
        check (event_name in (
            'lesson_completed',
            'completion_to_next_action',
            'return_to_next_session'
        )),
    constraint product_retention_action_check
        check (action in (
            'none',
            'review_due',
            'continue_goal',
            'next_lesson',
            'home'
        )),
    constraint product_retention_delay_bucket_check
        check (delay_bucket in (
            'none',
            'under_1m',
            'under_5m',
            'under_30m',
            'under_4h',
            'under_24h',
            'under_72h',
            'later'
        )),
    constraint product_retention_device_class_check
        check (device_class in ('mobile', 'tablet', 'desktop')),
    constraint product_retention_browser_family_check
        check (browser_family in ('chromium', 'webkit', 'firefox', 'other')),
    constraint product_retention_display_mode_check
        check (display_mode in ('browser', 'standalone', 'fullscreen', 'minimal-ui', 'unknown')),
    constraint product_retention_event_semantics_check
        check (
            (
                event_name = 'lesson_completed'
                and action <> 'none'
                and delay_bucket = 'none'
            )
            or (
                event_name = 'completion_to_next_action'
                and action <> 'none'
                and delay_bucket <> 'none'
            )
            or (
                event_name = 'return_to_next_session'
                and action = 'none'
                and delay_bucket <> 'none'
            )
        )
);

create index product_retention_events_received_at_idx
    on product_retention_events (received_at desc);

create index product_retention_events_event_received_idx
    on product_retention_events (event_name, received_at desc);

comment on table product_retention_events is
    'Anonymous aggregate-only lesson retention events. Do not add learner, session, lesson, content, URL, query, referrer, authentication, or free-form copy fields.';
