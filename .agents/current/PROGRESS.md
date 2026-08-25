# Current Task Progress

## 2026-08-25 Europe/Berlin

### Verified

- #688 merged with expected immutable head `d7dd1bf3f247a4ea84ca0d9d47bb2df039e96e63` to exact `main` SHA `e4bf0279f01e0ec4504e99581a3d7e1dc62b4a90`.
- PR-head CI #4170 / run `32865890130` was fully green.
- First exact-main CI #4171 / run `32873693448` failed only because `Frontend E2E (UI tests (shard 2/2))` failed; aggregate frontend quality then failed and container/Stage were correctly not started.
- Exact-main Visual regression, Accessibility, Performance, Content Security, iOS PWA, Controlled Service Worker, Dictionary smoke, Lesson completion, backend and UI shard 1 all passed on the same merge SHA.
- Failed artifact `frontend-playwright-report-ui-2` contains both Light and Dark `application-error-boundary-appearance.spec.ts` failures on `ios-webkit`, including Playwright retries.
- Trace snapshots prove the fixture exists immediately after its `page.evaluate()` insertion but is already absent before the subsequent visibility assertion begins; the normal Home DOM has been restored.
- No duplicate open Issue or open PR existed before Issue #689 / its branch was created.
- Branch `fix/issue-689-error-boundary-hydration-race` was created from exact failed-main SHA `e4bf0279f01e0ec4504e99581a3d7e1dc62b4a90`.
- `main` remained `e4bf0279f01e0ec4504e99581a3d7e1dc62b4a90` after the hotfix code write.

### Finding

The semantic CSS implementation is not the failing owner. The new Playwright fixture replaced the React-owned body after `domcontentloaded`, then attempted to inspect it in a later browser task. On WebKit, pending React/Next hydration can complete between those tasks and reconcile the body back to the real Home tree, deleting the synthetic fixture before the assertion.

### Root cause

`domcontentloaded` establishes document parsing/resource timing, not React hydration completion. The test split fixture insertion and style evidence across separate browser tasks while mutating the framework-owned body. That introduced a scheduler race which PR-head CI happened not to expose but exact-main WebKit reproduced on both Light and Dark including retry.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `frontend/e2e/application-error-boundary-appearance.spec.ts`

### Checks passed

- Failed exact-main Playwright artifact and trace inspected directly; no blind rerun was used for diagnosis.
- New harness keeps the fixture connected to the live runtime document, appends it without replacing the React tree, reads all computed-style/token evidence in the same `page.evaluate()` task, and removes it in `finally` before React can interleave.
- All original Light/Dark semantic equality assertions remain unchanged.
- A post-capture assertion verifies the fixture does not persist in the application DOM.
- Updated test file read-back blob is `a4e41ee5ae7d7c879947c018bcdaa9a3e8a359cf`.
- `main` drift check after the runtime-test write remained exact `e4bf0279f01e0ec4504e99581a3d7e1dc62b4a90`.

### Checks failed

- Historical first exact-main CI #4171 / run `32873693448`: UI shard 2 failure due to the reproduced hydration race. This failure is authoritative evidence and remains part of delivery history.
- No hotfix PR CI has run yet.

### Current branch head

Resolve from live branch ref after the remaining Agent Harness execution update.

### Next action

Record execution evidence, read back all changed paths and compare branch scope against exact `main`; then open a Draft PR for #689 and run full immutable-head CI. Merge only if both UI shards and all other required gates are green on the final developer-authored head.
