# Current Task Progress

## 2026-07-30 21:40 Europe/Berlin

### Verified

- Live `main` remains `dbb7d04c083cc266ab3f9247564a7b293e32d272`.
- Draft PR #313 targets `main` from `refactor/issue-70-remove-home-compatibility`.
- PR #311 proves `/` is forced onto the Home graph and renders `LexigoHomeApp` before `LexigoPremiumApp`.
- Exact product SHA `8ce61297d4c0ade5cb687a42ca11047b836c85c3` remains successfully deployed on stage with public smoke and 12/12 browser checks.
- CI #2419 / run `30568316390` completed successfully on runtime/test head `7ec5c30f37e80067ae577555c17aa9175415a4d1`.

### Finding

The bounded deletion is complete: legacy Home presentation and Home-only dependencies are absent, while shared progress, active lesson, lesson start/resume, auth, navigation and fallback owners remain.

### Root cause

Home moved to its dedicated route island before the legacy compatibility presentation was deleted.

### Changed files

- `frontend/components/lexigo-premium-app.tsx`
- `frontend/components/home-route-island-source.test.ts`
- `frontend/docs/compatibility-cleanup.md`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Checks passed

- Exact source and impact-map audit.
- Home absence/preservation source contract.
- CI #2419: classifier, backend unit/security, backend integration, frontend lint, TypeScript, unit tests, production build, dependency audit, complete browser matrix, accessibility, iOS PWA, performance budgets and container checks.
- Final diff contains no temporary workflow file.

### Checks failed

- Local public Git clone remains unavailable because the sandbox cannot resolve `github.com`; connector and GitHub Actions paths were used instead.
- Two temporary transport workflow attempts stopped safely before repository writes when assertions did not match. The successful asserted patch removed its own workflow in the same commit.

### Current branch head

`713b4ec7ac9953b6836bfc93f57772ff4a7c7e1f`

### Next action

Run full authoritative CI on this final documentation head. If green, perform review audit, mark PR #313 Ready, expected-head squash merge, then exact-SHA stage/public validation before reconciliation.
