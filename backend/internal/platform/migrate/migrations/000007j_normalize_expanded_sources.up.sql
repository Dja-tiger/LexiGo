update words
set source = 'lexigo-daily-life-v1', updated_at = now()
where source = 'lexigo-daily-life-v2';

update words
set source = 'lexigo-travel-v1', updated_at = now()
where source = 'lexigo-travel-v2';

update words
set source = 'lexigo-data-engineering-v1', updated_at = now()
where source = 'lexigo-data-engineering-v2';

update words
set source = 'lexigo-backend-v1', updated_at = now()
where source = 'lexigo-backend-v2';

update words
set source = 'lexigo-technical-phrases-v1', updated_at = now()
where source = 'lexigo-themed-phrases-v2';
