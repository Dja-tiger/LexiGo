do $$
declare
    expanded_word_count integer;
    expanded_phrase_count integer;
begin
    select count(*)::integer into expanded_word_count
    from words
    where source in ('lexigo-daily-life-v2', 'lexigo-travel-v2', 'lexigo-data-engineering-v2', 'lexigo-backend-v2');

    select count(*)::integer into expanded_phrase_count
    from words
    where source = 'lexigo-themed-phrases-v2';

    if expanded_word_count <> 100 or expanded_phrase_count <> 100 then
        raise exception 'expanded catalog has % words and % phrases; expected 100 and 100', expanded_word_count, expanded_phrase_count;
    end if;
end
$$;

insert into user_words (user_id, word_id)
select users.id, words.id
from users
cross join words
where words.source in (
    'lexigo-daily-life-v2', 'lexigo-travel-v2', 'lexigo-data-engineering-v2',
    'lexigo-backend-v2', 'lexigo-themed-phrases-v2'
)
on conflict (user_id, word_id) do nothing;
