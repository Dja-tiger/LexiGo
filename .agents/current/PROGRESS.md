# Current Task Progress

## 2026-08-11 16:00 Europe/Moscow

### Verified

- Live repository: `Dja-tiger/LexiGo`.
- `main` SHA before Issue #71 branch and before the first harness write: `b1e238000803936e694b032564be0ed6fc97d1b7`.
- Branch `feat/issue-71-feedback-taxonomy` was created from the exact live `main` SHA and read back successfully.
- Issue #71 is open, has no competing open PR, and its acceptance criteria are automatable without a Figma or physical-device completion gate.
- #78 is implementation-complete but still requires a separate authorized Production deploy; #68 and physical-device issues cannot be honestly closed autonomously.
- Existing feedback is fragmented across `lx-session-notice`, speech-local live feedback, calendar inline status, route announcements and other specialized status owners.
- `RoutedLexigoApp` is the persistent route-shell owner above route islands; `LexigoBootstrappedApp` owns session/account runtime.
- `system-states.css` is the shared system-state presentation owner; `mobile-pwa-fixes.css` remains session/PWA shell presentation and must not become a second generic feedback owner.

### Finding

Issue #71 is an ownership/taxonomy problem, not an absence-of-components problem. Route announcements, content AsyncStatePanel states, review-outbox connectivity and focused-lesson exit guidance have distinct semantics and should not be forced into a toast queue. Cross-route action feedback from account/session success, speech non-blocking failures and calendar actions is the appropriate shared-feedback scope.

### Root cause

Feedback producers evolved independently with local `role=status`/`role=alert` markup, local state and inconsistent dismissal/timing. This permits overwrite/double-announcement risks and leaves no single contract for transient queueing or safe-area placement.

### Changed files

- `.agents/current/TASK.md` initialized for Issue #71.
- `.agents/current/PROGRESS.md` initialized by this commit.

### Checks passed

- Mandatory Agent Harness and architecture documents read.
- Live Issue/comments/open-PR audit complete.
- Repository-wide `aria-live` / `role=status` / session/speech/calendar owner discovery complete.
- `TASK.md` read-back SHA verified after write.
- `main` remained unchanged at `b1e238000803936e694b032564be0ed6fc97d1b7` after the first write.

### Checks failed

- None yet. Product implementation has not started.

### Current branch head

Resolve from live branch ref after this write.

### Next action

Read back this progress record, confirm `main` is unchanged, initialize `EXECUTION.md`, then inspect the exact CSS/test collection owners before creating the shared feedback model and persistent feedback center.
