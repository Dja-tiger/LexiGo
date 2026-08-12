-- Issue #73 retention evidence is deliberately tied to authenticated lesson
-- ownership. Anonymous navigation telemetry remains a separate privacy-safe
-- aggregate and is not reused as cross-session learner identity.
create unique index lesson_sessions_user_id_id_unique
    on lesson_sessions (user_id, id);

create index lesson_sessions_user_created_at_idx
    on lesson_sessions (user_id, created_at, id);

create table lesson_result_actions (
    id bigint generated always as identity primary key,
    user_id uuid not null,
    lesson_id uuid not null,
    recommended_action varchar(24) not null,
    selected_action varchar(24) not null,
    occurred_at timestamptz not null default now(),
    constraint lesson_result_actions_lesson_owner_fk
        foreign key (user_id, lesson_id)
        references lesson_sessions (user_id, id)
        on delete cascade,
    constraint lesson_result_actions_recommended_action_check
        check (recommended_action in ('next_lesson', 'due_review', 'home', 'none')),
    constraint lesson_result_actions_selected_action_check
        check (selected_action in ('next_lesson', 'due_review', 'home', 'progress', 'stay')),
    constraint lesson_result_actions_first_action_unique
        unique (user_id, lesson_id)
);

create index lesson_result_actions_user_occurred_at_idx
    on lesson_result_actions (user_id, occurred_at desc, lesson_id);

-- One row per completed lesson is the analytics denominator. The first Result
-- action is optional because a learner can close the app without choosing a
-- CTA. The next lesson session is likewise optional and can occur in a later
-- browser/app session.
create view lesson_result_retention as
select
    completed.id as lesson_id,
    completed.user_id,
    completed.completed_at,
    action.recommended_action,
    action.selected_action,
    action.occurred_at as result_action_at,
    case
        when action.occurred_at >= completed.completed_at
        then floor(extract(epoch from action.occurred_at - completed.completed_at))::bigint
        else null
    end as completion_to_action_seconds,
    next_session.id as next_lesson_id,
    next_session.created_at as next_session_at,
    case
        when next_session.created_at >= completed.completed_at
        then floor(extract(epoch from next_session.created_at - completed.completed_at))::bigint
        else null
    end as return_to_next_session_seconds,
    case
        when action.id is null then null
        else action.selected_action = action.recommended_action
    end as selected_recommended_action
from lesson_sessions as completed
left join lesson_result_actions as action
    on action.user_id = completed.user_id
   and action.lesson_id = completed.id
left join lateral (
    select
        candidate.id,
        candidate.created_at
    from lesson_sessions as candidate
    where candidate.user_id = completed.user_id
      and candidate.id <> completed.id
      and candidate.created_at > completed.completed_at
    order by candidate.created_at, candidate.id
    limit 1
) as next_session on true
where completed.status = 'completed'
  and completed.completed_at is not null;
