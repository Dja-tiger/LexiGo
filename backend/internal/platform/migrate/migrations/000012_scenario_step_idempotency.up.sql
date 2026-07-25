alter table scenario_attempt_steps
    add column request_hash bytea not null,
    add column review_response jsonb;

alter table scenario_attempt_steps
    add constraint scenario_attempt_steps_request_hash_length_chk
        check (octet_length(request_hash) = 32);

alter table scenario_attempt_steps
    drop constraint scenario_attempt_steps_review_chk;

alter table scenario_attempt_steps
    add constraint scenario_attempt_steps_review_chk check (
        (
            status = 'processing'
            and review_event_id is null
            and review_response is null
            and accepted_at is null
        )
        or (
            status = 'accepted'
            and review_event_id is not null
            and review_response is not null
            and accepted_at is not null
        )
    );
