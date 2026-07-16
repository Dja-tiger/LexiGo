create table user_learning_preferences (
    user_id uuid primary key references users(id) on delete cascade,
    daily_goal integer not null default 30,
    updated_at timestamptz not null default now(),
    constraint user_learning_preferences_daily_goal_chk check (daily_goal between 5 and 200)
);

alter table review_events
    add column rating text,
    add column answer_mode text,
    add column correct boolean;

alter table review_events
    add constraint review_events_rating_chk
        check (rating is null or rating in ('again', 'almost', 'known')),
    add constraint review_events_answer_mode_chk
        check (answer_mode is null or answer_mode in ('recall', 'choice'));

create index review_events_user_word_time_idx
    on review_events (user_id, word_id, reviewed_at desc);
