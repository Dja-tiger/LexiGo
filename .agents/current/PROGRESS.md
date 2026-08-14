# Current Task Progress

## 2026-08-14 Europe/Moscow

### Verified

- Base `1fae52ab9dda9bc807d60a20cdb8cee594172e0d`; Issue #68; PR #507.
- PR #506 merged the main PWA/Figma parity slice and established canonical Light/Dark semantic colors `#f4f7f5` / `#10211d`, dedicated maskable/monochrome icons, offline CSS parity and service-worker precache.
- `frontend/public/offline.html` remained the one automated metadata mismatch: `<meta name="theme-color" content="#050914" />`.
- `frontend/lib/appearance-preference.ts` remains the runtime appearance owner and defines Dark as `#10211d`.

### Finding

Static offline recovery metadata could still flash the legacy `#050914` before any runtime appearance code is available.

### Root cause

The isolated `offline.html` write was blocked during the previous #506 delivery, so it was intentionally left as a documented residual instead of weakening that PR.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/public/offline.html`
- `frontend/lib/appearance-preference.test.ts`

### Implemented

- Replaced the legacy offline document theme-color with canonical Dark `#10211d`.
- Extended the existing appearance/PWA unit contract to assert the exact `offline.html` meta tag against `APPEARANCE_THEME_COLORS.dark`.

### Checks passed

Pending immutable-head CI for PR #507.

### Residual manual gate

Native installed icon/splash/cold-start behavior on iOS, Android and desktop still requires physical-device/browser validation; Playwright cannot prove native install chrome.

### Current branch head

Resolve from live branch ref after harness finalization.

### Next action

Run PR #507 CI, audit reviews/threads, then squash-merge only on an unchanged green head.