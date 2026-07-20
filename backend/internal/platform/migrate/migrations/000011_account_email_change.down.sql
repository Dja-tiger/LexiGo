delete from account_audit_events
where event_type = 'email_changed';

alter table account_audit_events
    drop constraint account_audit_events_type_check;

alter table account_audit_events
    add constraint account_audit_events_type_check check (
        event_type in (
            'password_changed',
            'other_sessions_revoked'
        )
    );

drop table account_email_change_tokens;
