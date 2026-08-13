# Current Task

## Identity

- Issue: #68
- Branch: `feat/issue-68-pwa-manifest-icons`
- Base SHA: `9bf6f26899fbdf937f5612c08da7bab64e38af69`
- Head SHA: resolve from live branch ref
- PR: #504

## Objective

Align PWA manifest, launch colors and icon-purpose semantics with the repository-owned Figma/appearance palette.

## Scope

Manifest colors; dedicated maskable/monochrome icons; offline recovery CSS; service-worker precache; appearance-owner contract tests.

## Non-goals

No Figma canvas edits, route redesign, broad CSS cleanup, backend changes, orientation lock or device-signoff claim. The `offline.html` theme-color metadata is not claimed because connector safety blocked that isolated write twice.

## Allowed paths

`.agents/current/*`, `frontend/public/manifest.webmanifest`, `frontend/public/icons/icon-maskable.svg`, `frontend/public/icons/icon-monochrome.svg`, `frontend/public/sw.js`, `frontend/public/offline.css`, `frontend/lib/appearance-preference.test.ts`.

## Prohibited paths

`backend/**`, `frontend/app/globals.css`, `frontend/app/layout.tsx`, route UI/CSS, visual baselines, migrations/OpenAPI, `.github/workflows/**`, Figma canvas.

## Runtime owners

Manifest owns install metadata; `appearance-preference.ts` remains runtime theme-color owner; `sw.js` owns offline precache; `offline.css` owns recovery presentation.

## Documentation owners

Issue #68 and `.agents/current/*`.

## Invariants

Keep Apple 180px and raster 192/512 `any` fallbacks; no orientation lock; maskable mark stays inside the 40% safe zone; runtime appearance bootstrap unchanged.

## Acceptance criteria

Canonical Dark canvas `#10211d` replaces legacy manifest and visible offline recovery colors; icon purposes use distinct assets; specialized assets are precached; unit/build/PWA CI passes; device install/cold-start remains manual.

## Required checks

Frontend lint/typecheck/unit/build plus CI-selected PWA/SW/browser/a11y/visual/performance gates and clean review audit.

## Risks

Specialized icon support varies, so raster fallbacks remain. Playwright cannot prove native installed splash behavior. Offline document meta theme-color remains a known residual mismatch until the blocked write can be performed safely.

## Rollback

Revert the Issue #68 squash merge.
