# Current Task Progress

## 2026-07-27 19:25 Europe/Berlin

### Verified

- live `main` before branch creation: `eeab812c6785ae9a92aee948ecb63729ab850932`;
- no parallel product PR was open;
- stage runtime remains product image `dc59c8cc0906e8fe3f2ec787c87aecb0a4b23754` from run `30279520923`;
- parent Issue #115 remains open and identifies Learn, Phrases and Active Lesson as the remaining compatibility routes;
- Issue #254 was created for the atomic Learn route-island slice;
- branch `agent/issue-254-learn-route-island` was created from exact live `main`.

### Finding

`/learn` is currently rendered by `LexigoPremiumApp`. Lesson Composer state is interleaved with Phrases, auth compatibility, catalog browsing and Active Lesson state. A wrapper-only dynamic import would not reduce the route graph and would violate the independent-entry acceptance criterion.

### Root cause

The original compatibility graph predates route-specific client entries. Learn preview/create/resume/discard behavior and presentation still share one component-level state machine with unrelated routes.

### Changed files

- `.agents/current/TASK.md` — exact scope, owners, invariants, checks, risks and rollback.
- `.agents/current/PROGRESS.md` — this factual task log.

### Checks passed

- mandatory Agent Harness pre-flight completed;
- Issue #254 acceptance matrix created;
- branch base and changed task file read back by exact ref/blob.

### Checks failed

- none.

### Current branch head

Resolve from live branch ref after this commit.

### Next action

Extract the minimum typed Learn-owned controller/presentation boundary, add bootstrap route-graph ownership and source contracts, then run targeted CI before opening the Draft PR.

## 2026-07-28 01:39 Europe/Moscow

### Verified

- live `main` remains `eeab812c6785ae9a92aee948ecb63729ab850932`;
- Draft PR #255 remains the only open PR and points to branch `agent/issue-254-learn-route-island`;
- pre-fix PR head is `6040a2680d61209d8ca527db0f00dfbd3ca73db2`;
- CI #2193, run `30309200166`, passed frontend core, backend unit/security, backend integration, accessibility, dictionary smoke, CSP, visual, performance, controlled Service Worker and iOS PWA jobs;
- CI #2193 failed Lesson completion and UI shards 1/2 because Browser Back did not open the Active Lesson safe-exit dialog;
- stage still serves immutable product image `dc59c8cc0906e8fe3f2ec787c87aecb0a4b23754` from run `30279520923`.

### Finding

Two deterministic browser-history shapes must be protected while Active Lesson owns the screen:

1. a direct Back target whose immutable history target is Learn;
2. an adjacent framework-created Active Lesson entry left by the organic `/learn` → `/lesson/active?resume=1` handoff.

In the first shape, Next can retain stale `usePathname()` state after the shell restores the exact URL. In the second shape, always pushing another protected entry leaves a stale Active Lesson entry behind after confirmed save-and-exit.

### Root cause

The safe-exit delivery effect depended on `usePathname()` after an intercepted `popstate`, even though Next had already consumed the attempted destination. The history repair also treated every target as a lower route and used `pushState`, so it did not collapse a duplicate focused-route entry.

### Changed files

- `frontend/components/routed-lexigo-app.tsx` — protect every history traversal while the semantic Active Lesson owner is mounted; restore the captured exact URL/framework state; replace duplicate lesson entries, push over lower-route entries, and deliver safe exit after the owner is stable across a paint.
- `frontend/components/learn-route-island-source.test.ts` — lock immutable-state branching, semantic-owner scheduling and prohibited history/synthetic-event behavior.
- `.agents/current/TASK.md`, `.agents/current/PROGRESS.md`, `.agents/current/EXECUTION.md`, `.agents/AGENTS.progress-pr214.md` — record the live failure category and reproducible evidence.

### Checks passed

- `npm ci --no-audit --no-fund` with Next.js `16.2.11`;
- `npm run lint` — 0 errors, 3 pre-existing warnings outside the changed route-shell files;
- `npm run typecheck`;
- `npm test` — 68 files, 434/434 tests;
- `npm test -- components/learn-route-island-source.test.ts` — 6/6;
- `npm run build`;
- `active-lesson-figma.spec.ts` Browser Back contract — desktop Chromium, desktop WebKit, Android Chromium and iOS WebKit, 4/4;
- `adaptive-navigation.spec.ts` focused-lesson history contract — dialog, confirmed exit and subsequent Back to `/learn`;
- `git diff --check`.

### Checks failed and resolved

- the first local browser rerun used the previous `.next` output and therefore reproduced the old failure; rebuilding the changed application made the test authoritative;
- broadening the semantic guard initially exposed a stale duplicate Active Lesson entry after confirmed exit; immutable `event.state` now selects `replaceState` for a lesson target and `pushState` for a lower-route target.

### Current branch head

Pre-commit head: `6040a2680d61209d8ca527db0f00dfbd3ca73db2`. Resolve the new immutable head after committing this evidence and fix.

### Next action

Run the local frontend quality gate, publish the developer-authored fix head, and require a new full CI before beginning controlled `/learn` cold-route measurement.
