# Current Task

## Identity

- Issue: #68
- Branch: `fix/issue-68-offline-theme-color`
- Base SHA: `1fae52ab9dda9bc807d60a20cdb8cee594172e0d`
- Head SHA: resolve from live branch ref
- PR: TBD

## Objective

Close the remaining automated PWA appearance mismatch after PR #506 by aligning the static offline document theme-color metadata with the canonical appearance owner.

## Scope

Update `frontend/public/offline.html` theme-color from the legacy launch color to canonical Dark `#10211d`; extend the existing appearance/PWA contract test so the mismatch cannot regress; record execution evidence.

## Non-goals

No route redesign, no Figma canvas edits, no manifest/icon/service-worker changes, no runtime appearance logic changes, no native-device install sign-off claim.

## Allowed paths

`.agents/current/*`, `frontend/public/offline.html`, `frontend/lib/appearance-preference.test.ts`.

## Prohibited paths

`backend/**`, `.github/workflows/**`, `frontend/app/**`, other `frontend/public/**`, visual baselines, migrations/OpenAPI, Figma canvas.

## Runtime owners

`appearance-preference.ts` owns Light/Dark semantic theme colors; `offline.html` owns the static recovery document metadata before runtime application code is available.

## Invariants

Canonical Light/Dark remain `#f4f7f5` / `#10211d`; no orientation lock; no change to offline recovery copy or actions.

## Acceptance criteria

`offline.html` metadata equals `APPEARANCE_THEME_COLORS.dark`; existing manifest/icon/offline CSS contracts remain green; frontend unit/build and repository CI pass.

## Required checks

Frontend lint/typecheck/unit/build plus repository-selected CI and clean review audit.

## Residual manual gate

Native iOS/Android/desktop install and cold-start appearance still require real-device validation.

## Rollback

Revert the Issue #68 follow-up squash merge.