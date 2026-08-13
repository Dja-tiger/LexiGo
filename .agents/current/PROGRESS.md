# Current Task Progress

## 2026-08-14 Europe/Moscow

### Verified

- Base `9bf6f26899fbdf937f5612c08da7bab64e38af69`; Issue #68; delivery PR #506.
- Historical PR #504 supplied the original frontend evidence before the secure rebase.
- Original audit found legacy manifest colors `#080b12` / `#111827`, raster icons reused as `any maskable`, and offline recovery `#050914`.
- Runtime/Figma semantic canvas remains `#f4f7f5` Light / `#10211d` Dark.
- Historical #504 frontend core and complete browser/PWA matrix passed on head `92eef63c136100c7510e401fca39be7827796894`.
- That CI exposed a pre-existing Go 1.26.5 standard-library vulnerability gate; prerequisite PR #505 upgraded Go to 1.26.6, passed `govulncheck` plus full CI, and merged as `9bf6f26899fbdf937f5612c08da7bab64e38af69`.

### Finding

PWA install/launch metadata is stale relative to the semantic appearance owner; icon purposes need dedicated assets.

### Root cause

PWA metadata predates the Adaptive Knowledge Coach appearance/token migration.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/public/manifest.webmanifest`
- `frontend/public/icons/icon-maskable.svg`
- `frontend/public/icons/icon-monochrome.svg`
- `frontend/public/offline.css`
- `frontend/public/sw.js`
- `frontend/lib/appearance-preference.test.ts`

### Checks passed

Historical #504 frontend lint/typecheck/unit/build, iOS PWA, controlled SW, UI shards, visual, accessibility, performance, content-security, lesson and smoke gates. Security prerequisite #505 passed Go 1.26.6 `govulncheck`, backend integration and both container builds.

### Checks failed

Historical #504 backend security failed only on the now-fixed Go 1.26.5 standard library. `offline.html` meta theme-color remains unchanged because the connector blocked that isolated write twice before GitHub.

### Current branch head

Resolve from live branch ref after harness finalization.

### Next action

Run fresh immutable-head CI on PR #506 and merge only after the complete matrix and review audit are green.
