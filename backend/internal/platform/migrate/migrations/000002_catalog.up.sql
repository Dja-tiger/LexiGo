alter table words
    add column note text not null default '';

create or replace function enroll_default_words_for_user()
returns trigger
language plpgsql
as $$
begin
    insert into user_words (user_id, word_id)
    select new.id, words.id
    from words
    where words.source = 'hakui-technical-english-2020'
    on conflict (user_id, word_id) do nothing;

    return new;
end;
$$;

create trigger users_enroll_default_words_after_insert
after insert on users
for each row
execute function enroll_default_words_for_user();
