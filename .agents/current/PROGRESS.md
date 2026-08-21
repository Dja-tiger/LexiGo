# Current Task Progress

## 2026-08-21

### Verified

- Repository: `Dja-tiger/LexiGo`.
- Issue: #647; Draft PR: #648.
- Branch: `fix/issue-647-first-use-desktop-state-hierarchy` from exact `main` `564bc24ab2b7f47e9f8d6e82989cbfd1df51adce`.
- Active OpenPencil source SHA-256 remains `6d73b785aaeb7dda35a53c9c5f16edfc9cbef1092dbce992183538f16505520e`.
- Exact design evidence remains OpenPencil acceptance run `32486519368`, artifact `9448087269`, digest `sha256:6613ec5c98617a0e541d99c71e65b56d0dcc9586160400974b68bc4011afbe13`.
- First repaired immutable CI: run `32490753893` / CI #3964 on head `d2b76106f6a0fdd787201578f60111503f7a9039`: success.

### Finding

Issue #642 exact Linux evidence proved that canonical desktop First Use loading/error states did not match active OpenPencil nodes `n442`, `n456`, `n614`, `n628`. Runtime rendered only a centered state panel while the design uses header → desktop intro → 720×540 state panel hierarchy. Loading also lacked the fifth desktop skeleton row and canonical lower note geometry.

### Root cause

The loading and generic recoverable-error branches retained compact/shared message presentation while the later desktop diagnostic hierarchy had its own intro owner. Generic `.lx-first-use-message` centering therefore remained effective on desktop loading/error states. The first repair CI additionally exposed a stale downstream source contract that required a literal static error class string instead of the semantic `role=alert` plus recoverable-state modifier.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/components/lexigo-onboarding-app.tsx`
- `frontend/app/first-use.css`
- `frontend/components/first-use-route-contract.test.ts`
- `frontend/components/system-state-openpencil-contract.test.ts`

### Checks passed

- PR #648 CI #3964 / run `32490753893` on `d2b76106f6a0fdd787201578f60111503f7a9039`: full success.
- Frontend lint, typecheck, unit, production build and dependency audit: success.
- Backend unit/security and PostgreSQL integration with race detector: success.
- UI shards 1/2 and 2/2: success.
- Accessibility audit, Content Security, Controlled Service Worker, Performance budgets, iOS PWA Dictionary and Lesson completion: success.
- Authoritative Linux Visual regression: success with existing approved baselines unchanged.
- API and Web container builds: success.

### Checks failed

- Earlier CI run `32490479463` failed only `Frontend core quality`: `system-state-openpencil-contract.test.ts` required the retired literal static `className="lx-first-use-panel lx-first-use-message" role="alert"`. Classified as stale downstream source contract; corrected without changing runtime behavior.
- One repository write attempt was rejected with HTTP 404 because `create_file` was mis-selected while preparing the task-local docs commit and targeted a deliberately nonexistent branch/path. No ref or repository path changed. Recovery verification confirmed `main` still at `564bc24ab2b7f47e9f8d6e82989cbfd1df51adce`, PR head still `d2b76106f6a0fdd787201578f60111503f7a9039`, and `.agents/current/PROGRESS.md.tmp-never` absent from `main`; the exact `create_blob` schema was then reloaded before resuming writes.

### Current branch head

- Before this task-local docs commit: `d2b76106f6a0fdd787201578f60111503f7a9039`.
- Resolve the final developer-authored head from the live PR after the docs commit.

### Next action

Create the final task-local docs commit, require a fresh full immutable-head CI on that exact head, audit PR diff/reviews/threads and `main` drift, then mark #648 Ready and squash-merge with expected-head protection. Because this is a runtime repair, validate exact-main CI and Stage/public runtime before reconstructing #645 for fail-closed loading/error fingerprint evidence.
