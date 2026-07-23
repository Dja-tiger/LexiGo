# Lesson progression and duplicate-create controls

A completed block is not immediately eligible for the next server-composed lesson with the same source and study mode. The backend excludes every item from the latest matching completed session for 30 minutes. After that window, ordinary due-queue ordering applies again.

Lesson creation is serialized per user with a PostgreSQL transaction advisory lock. A repeated request with the same source, mode, size, topic and explicit item set within 10 seconds returns the existing active session. The frontend also uses an in-flight ref, because React state-based button disabling cannot prevent two synchronous click events before the next render.

Explicit `wordIds` remain authoritative. Automatic continuation exclusion only applies to server-composed queues. If exclusion leaves no candidates, the API returns `lesson_queue_empty`; it never silently replays the completed block.

Operational invariant:

```sql
select user_id, count(*)
from lesson_sessions
where status = 'active'
group by user_id
having count(*) > 1;
```

The query must return no rows. For progression incidents, inspect the latest completed and active sessions together with ordered `lesson_session_items`.
