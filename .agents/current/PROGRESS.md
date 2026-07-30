# Current Task Progress

## 2026-07-30 19:20 Europe/Berlin

### Verified

- Live `main` is `dbb7d04c083cc266ab3f9247564a7b293e32d272` after docs reconciliation PR #312.
- No active product PR is open.
- PR #311 proves `/` is forced onto the Home graph and renders `LexigoHomeApp` before `LexigoPremiumApp`.
- Exact product SHA `8ce61297d4c0ade5cb687a42ca11047b836c85c3` remains successfully deployed on stage with public smoke and 12/12 browser checks.
- `LexigoPremiumApp` still contains one bounded legacy `renderHome` function and one Home dispatch branch.

### Finding

The removable family is presentation-only: `renderHome`, `navigation.view === "home" ? renderHome()`, Home next-action markup, Home progress panel and Home paths. Shared progress resources, active lesson, lesson start/resume, auth, navigation and fallback functions have non-Home consumers and must remain.

### Root cause

Home moved to its dedicated route island before the legacy compatibility presentation was deleted.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`

### Checks passed

- Live main/open-PR/stage verification.
- Exact source reads for Home route ownership, legacy presentation and final compatibility dispatch.

### Checks failed

- Local public Git clone was unavailable because the sandbox could not resolve `github.com`; no repository state changed.

### Current branch head

Resolve after current-memory writes.

### Next action

Apply the bounded runtime deletion, convert the Home source contract to absence/preservation assertions, update compatibility documentation, then run targeted checks and open a Draft PR.