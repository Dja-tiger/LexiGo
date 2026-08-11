# Current Task Progress

## 2026-08-11 10:00 Europe/Moscow

### Verified

- Live repository `main`: `c675cde343c582349b78c74cb86dc2bd07237fc0`.
- Issue #66 is open; no competing open PR owns #66.
- PRs #157/#159 already delivered glossary/topic/status terminology; remaining issue comment explicitly requires final empty/error/success and CTA review.
- Existing `AsyncStatePanel` owns all loading/empty/error/success presentation but hard-codes state eyebrows and retry labels locally.
- Existing route boundaries use `Повторить` consistently but 404 uses `Открыть главную` while root error uses `На главную`.
- Lesson-source copy is duplicated across Home/Learn/Active Lesson/compatibility fallback.

### Finding

- Same `LessonSource` has different user-facing names: Home uses `travel → Путешествия`, `phrases → Фразы`, while Learn/Active Lesson use `travel → Для путешествий`, `phrases → Технические фразы`.
- `Academic Technical English` is an intentional learning collection title with Russian explanatory copy and must remain course-facing content, not be globally rewritten.
- Existing async-state E2E already proves slow/error/offline/timeout/empty/retry semantics; this slice needs ownership/consistency evidence rather than a redesign.

### Root cause

The original interface-copy contract centralized glossary/topic/catalog terms but did not own lesson-source names or generic system-state/action labels. Later route-island extraction left local label tables/functions that drifted independently.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`

### Checks passed

- Agent Harness pre-flight completed.
- Product base branch created from exact verified `main` SHA.
- Scope audit completed against Issue #66 comments, `interface-copy`, async-state contracts and primary lesson owners.

### Checks failed

- None yet.

### Current branch head

Resolve from live `feat/issue-66-system-copy-review` branch ref after this write.

### Next action

Initialize execution memory, implement canonical copy ownership, add regression contracts, then publish a Draft PR and run immutable-head product CI.
