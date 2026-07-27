# Current Task Progress

## 2026-07-28 02:35 Europe/Moscow

### Verified

- live `main`: `0bc5203da2487e947b860ce67a69cf04121cc3c8`;
- no open PR and no parallel branch for the new slice;
- Issue #254 and PRs #255/#256 are complete;
- stage remains healthy on product image `9c7a2a46a974a2fd3b16f2de95d8e6f7694584b8`, run `30313824186`;
- Phrases Issue #199 is blocked because canonical Figma node IDs are absent;
- Active Lesson production design and browser contracts are approved under Issues #193/#194;
- Issue #257 was created and branch `agent/issue-257-active-lesson-route-island` was based on exact live `main`.

### Finding

`/lesson/active` still falls through to `LexigoPremiumApp`, so cold entry loads the compatibility graph that also owns Phrases and legacy route state. The presentation, fixture matrix, Linux baselines and route budget harness already exist; the missing boundary is an independent controller/entry.

### Root cause

Active Lesson presentation was modernized before the route-island program. Its controller, API mutations, completion snapshot and navigation state remain embedded in the original monolithic application graph.

### Changed files

- `.agents/current/TASK.md` — exact contract, scope, invariants, checks, risks and rollback.
- `.agents/current/PROGRESS.md` — verified task-selection and pre-flight facts.
- `.agents/current/EXECUTION.md` — initial reproducible procedures and evidence.

### Checks passed

- mandatory Agent Harness and GitHub plugin instructions read from final `main`;
- live main/PR/Issue/branch/CI/stage reconciliation completed;
- Phrases design blocker and Active Lesson approved Figma sources revalidated;
- repository-wide Active Lesson owner/consumer/test search completed;
- isolated issue and branch created from exact main.

### Checks failed

- none.

### Current branch head

Pre-commit head: `0bc5203da2487e947b860ce67a69cf04121cc3c8`.

### Next action

Build the minimal typed Active Lesson controller/entry from existing production contracts, add route ownership source protection and run focused unit/build/browser validation before opening the Draft PR.

## 2026-07-28 02:56 Europe/Moscow

### Verified

- Draft PR #258 exists on `agent/issue-257-active-lesson-route-island`;
- `/lesson/active` now selects a dedicated dynamically imported authenticated entry;
- the new entry does not import `LexigoPremiumApp`, session restoration, refresh, review outbox, Service Worker or IndexedDB owners;
- backend review payload, optimistic lesson version, resynchronization, answer suggestion, completion snapshot, distinct-next and daily-goal contracts remain represented;
- the approved `ActiveLessonPresentation` and `LessonResultPresentation` remain the presentation owners;
- Active Lesson ownership survives transient Next pathname changes during Browser Back and is released only by an explicit route handoff;
- confirmed safe exit replaces the protected Active Lesson history entry, so later Back returns to `/learn` instead of reopening the protected session.

### Finding

The first browser matrix exposed two integration regressions after controller extraction:

1. Next observed the test-created `/learn` history entry before Browser Back and unmounted the exact-path island before the persistent shell could deliver safe exit.
2. Desktop WebKit could apply the presentation feedback focus after the controller's single animation-frame focus on `Дальше`.

The first adjacent navigation regression then showed that the protected Active Lesson entry must be replaced, not followed by a pushed Home entry, when safe exit is confirmed.

### Root cause

Route selection initially treated the mutable `usePathname()` value as both the lazy-entry selector and the semantic owner. History preparation can change that value without completing an approved lesson exit. Focus ordering also crossed controller and presentation commits, while safe exit used ordinary push navigation instead of the compatibility graph's existing replace behavior.

### Changed files

- `frontend/components/lexigo-active-lesson-app.tsx` — independent controller for active-session restore, review, resync, suggestion, completion, result continuation and safe exit.
- `frontend/components/lexigo-bootstrapped-app.tsx` — dynamic Active Lesson entry plus retained semantic ownership until explicit handoff.
- `frontend/components/routed-lexigo-app.tsx` — mounted-owner history guard independent of mutable DOM/path timing.
- `frontend/components/active-lesson-route-island-source.test.ts` — island ownership and invariant contract.
- `frontend/components/learn-route-island-source.test.ts` — retained safe-exit source contract.
- `frontend/components/production-app-entry.test.ts` — audited production root allowlist and dedicated entry ownership.

### Checks passed

- ESLint: zero errors; three pre-existing warnings outside the new entry.
- TypeScript: passed.
- unit/source tests: 69 files, 440 tests passed.
- production build: passed.
- Agent Harness and `git diff --check`: passed.
- Active Lesson matrix: 32 passed, 4 intentional platform skips across desktop Chromium/WebKit and Android/iOS profiles.
- Lesson Result, offline outbox, app-router, account hydration and adaptive navigation regression set: 44 passed, 13 intentional project skips before the one history finding.
- focused post-fix adaptive history loop: 1 passed.

### Checks failed and resolved

- initial Active Lesson matrix: Browser Back failed in all four profiles; resolved by retaining the semantic Active Lesson owner until an explicit route-graph handoff.
- initial desktop WebKit Choice flow: `Дальше` lost focus; resolved by focusing after the presentation feedback commit across two animation frames.
- initial adjacent adaptive-navigation loop: Back reopened `/lesson/active`; resolved by using replace navigation for confirmed `lesson_exit` and clearing retained ownership for every non-lesson handoff.

### Current branch head

`bafae974213e89ea35774360f013a2e5447d1313` is still the pushed pre-flight head. Functional changes are validated locally and uncommitted.

### Next action

Commit and push the functional head, run authoritative full CI, then perform controlled Linux cold-route measurement before setting the permanent `/lesson/active` budget.
