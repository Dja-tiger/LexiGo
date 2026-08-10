alter table user_learning_preferences
    add column onboarding_state text not null default 'not_started',
    add column onboarding_started_at timestamptz,
    add column onboarding_completed_at timestamptz,
    add column onboarding_skipped_at timestamptz,
    add constraint user_learning_preferences_onboarding_state_chk check (
        onboarding_state in ('not_started', 'in_progress', 'completed', 'skipped')
    );

create table onboarding_diagnostic_items (
    user_id uuid not null references users(id) on delete cascade,
    position integer not null,
    word_id bigint not null references words(id) on delete cascade,
    self_mark text,
    marked_at timestamptz,
    created_at timestamptz not null default now(),
    primary key (user_id, position),
    unique (user_id, word_id),
    constraint onboarding_diagnostic_position_chk check (position >= 0 and position < 30),
    constraint onboarding_diagnostic_self_mark_chk check (
        self_mark is null or self_mark in ('known', 'unsure', 'new')
    ),
    constraint onboarding_diagnostic_marked_at_chk check (
        (self_mark is null and marked_at is null)
        or (self_mark is not null and marked_at is not null)
    )
);

comment on column user_learning_preferences.onboarding_state is
    'Server-owned cross-device diagnostic onboarding state. UI presentation remains owned by the canonical First Use design slice.';
comment on column onboarding_diagnostic_items.self_mark is
    'Pre-answer learner self-mark. It is deliberately separate from objective correctness and review_events.';
