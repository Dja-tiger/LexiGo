alter table answer_suggestions
    add column version bigint not null default 1,
    add column decided_at timestamptz,
    add column decided_by uuid,
    add column decision_reason text,
    add column decision_comment text,
    add constraint answer_suggestions_version_positive_chk check (version > 0),
    add constraint answer_suggestions_decision_reason_chk check (
        decision_reason is null
        or decision_reason in (
            'valid_variant',
            'incorrect',
            'duplicate',
            'unsafe',
            'irrelevant',
            'insufficient_context'
        )
    ),
    add constraint answer_suggestions_decision_comment_length_chk check (
        decision_comment is null or char_length(decision_comment) <= 1000
    ),
    add constraint answer_suggestions_decision_state_chk check (
        (
            status = 'pending'
            and decided_at is null
            and decided_by is null
            and decision_reason is null
            and decision_comment is null
        )
        or (
            status in ('accepted', 'rejected')
            and decided_at is not null
            and decided_by is not null
            and decision_reason is not null
        )
    );

create table answer_suggestion_audit (
    id bigint generated always as identity primary key,
    suggestion_id bigint not null references answer_suggestions(id) on delete cascade,
    actor_user_id uuid not null,
    action text not null,
    reason text not null,
    comment text,
    previous_version bigint not null,
    resulting_version bigint not null,
    previous_accepted_answers text[] not null,
    resulting_accepted_answers text[] not null,
    created_at timestamptz not null default now(),
    constraint answer_suggestion_audit_action_chk
        check (action in ('accepted', 'rejected')),
    constraint answer_suggestion_audit_reason_chk
        check (reason in (
            'valid_variant',
            'incorrect',
            'duplicate',
            'unsafe',
            'irrelevant',
            'insufficient_context'
        )),
    constraint answer_suggestion_audit_comment_length_chk
        check (comment is null or char_length(comment) <= 1000),
    constraint answer_suggestion_audit_versions_chk
        check (previous_version > 0 and resulting_version = previous_version + 1)
);

create index answer_suggestion_audit_suggestion_time_idx
    on answer_suggestion_audit (suggestion_id, created_at, id);

create index answer_suggestions_terminal_retention_idx
    on answer_suggestions (decided_at, id)
    where status in ('accepted', 'rejected');

comment on column answer_suggestions.version is
    'Monotonic optimistic-lock version for one terminal moderation decision.';
comment on column answer_suggestions.decided_by is
    'Stable moderator user UUID snapshot. It intentionally has no FK so account deletion cannot erase or block the bounded audit record.';
comment on table answer_suggestion_audit is
    'Immutable moderation decision evidence. Rows are removed only with their bounded-retention suggestion owner.';
