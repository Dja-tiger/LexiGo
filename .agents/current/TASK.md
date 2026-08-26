# Current Task

## Identity

- Issue: #695
- Branch: fix/issue-695-calendar-dialog-semantic-palette
- Base SHA: 259a3e3b13e8db59e3c729621542dea57362fd13
- Head SHA: resolve from live branch ref
- PR: pending

## Objective

Complete the missed #583/#599 Calendar-flow visual acceptance by replacing the opened reminder dialog's fixed legacy dark palette with the current Foundation semantic Light/Dark appearance ownership, without redesigning geometry or changing Calendar behavior.

## Scope

- Semanticize the existing Calendar dialog/backdrop/form/weekdays/preview/provider/privacy/status paint in `frontend/app/calendar-reminders.css`.
- Preserve existing dialog geometry, responsive bottom-sheet behavior, copy and interaction semantics.
- Add fail-closed source ownership protection and blocking computed-style Light/Dark browser evidence.
- Preserve axe, keyboard/focus, touch, PWA and Calendar delivery contracts.
- Regenerate only the three authoritative Calendar dialog Linux visual baselines after manual actual review.
- Use the existing snapshot-update workflow only as a temporary branch-scoped binary maintenance mechanism if needed; restore it byte-for-byte before final immutable-head CI.

## Non-goals

- Reminder trigger/430px geometry already delivered by #583/#599.
- Dictionary, Phrases or Learn redesign/layout changes.
- Calendar copy, settings, persistence, ICS/Google/Apple behavior changes.
- Backend/API/schema/deploy changes.
- New OpenPencil screen creation solely for a Foundation palette consolidation.
- Blind snapshot updates, tolerance widening, browser skips or accessibility weakening.

## Allowed paths

- `frontend/app/calendar-reminders.css`
- `frontend/components/calendar-reminder-semantic-css-ownership.test.ts`
- `frontend/e2e/calendar-dialog-appearance.spec.ts`
- `frontend/package.json` only to route the new blocking browser proof through existing UI CI
- `frontend/e2e/visual-regression.spec.ts-snapshots/calendar-dialog-visual-compact-linux.png`
- `frontend/e2e/visual-regression.spec.ts-snapshots/calendar-dialog-visual-medium-linux.png`
- `frontend/e2e/visual-regression.spec.ts-snapshots/calendar-dialog-visual-desktop-linux.png`
- `.github/workflows/update-visual-snapshots.yml` only temporarily for allow-listed Linux binary generation; final diff must match `main` byte-for-byte
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- backend/**
- api/**
- deploy/**
- database/migrations
- design/openpencil/**
- unrelated route/component CSS
- unrelated visual baselines
- direct writes to `main`

## Runtime owners

- `frontend/app/calendar-reminders.css` — opened Calendar reminder presentation.
- `frontend/components/calendar-reminder-integration.tsx` — dialog/form/Google/Apple behavior; read-only unless evidence proves a semantic owner change is unavoidable.
- `frontend/app/design-tokens.css` and `frontend/app/appearance.css` — canonical semantic Light/Dark palette; read-only.

## Documentation owners

- `.agents/current/**` during the slice.
- Issue #695 / PR metadata for immutable CI and visual evidence.

## Invariants

- Dialog DOM, accessible names, form values and Calendar behavior remain unchanged.
- Compact/medium/desktop geometry and safe-area behavior remain unchanged.
- Existing focus lifecycle, Escape/close, touch-target and reduced-motion contracts remain unchanged.
- Select controls follow resolved application color scheme instead of forcing dark.
- Semantic appearance derives only from existing `--ak-color-*` / `--ak-elevation-*` ownership.
- Only the three Calendar dialog visual baselines may change.
- Temporary workflow changes never remain in the final developer-authored head.

## Acceptance criteria

- Explicit Light and Dark opened Calendar dialogs resolve semantic canvas/surface/text/muted/primary/subtle/status paint from current tokens.
- Legacy fixed navy/blue dialog palette and forced dark select scheme are absent from the Calendar presentation owner.
- Computed foreground/background/border pairs are asserted in both Light and Dark.
- Existing axe, keyboard/focus, touch-target, PWA Calendar and functionality suites remain green.
- Compact bottom sheet and medium/desktop dialog retain geometry and no horizontal overflow.
- Three Linux Calendar actuals are manually reviewed before baseline approval; unrelated visual hashes remain unchanged.
- Full immutable-head CI green, clean review/thread audit, expected-head squash merge, exact-main CI and exact-SHA Stage/public validation.

## Required checks

- Source ownership contract.
- Frontend lint/typecheck/unit/build/dependency audit.
- Targeted Calendar appearance E2E in Chromium/WebKit as applicable.
- Existing Calendar accessibility, keyboard/focus, touch and Apple PWA suites.
- Authoritative Linux Visual regression, first fail-closed actual review then normal comparison.
- Full required CI on the final developer-authored head.

## Risks

- Global Calendar CSS is reachable from many non-focused routes; a palette change can affect Profile/Progress visual surfaces when the dialog is opened.
- Native form controls can serialize colors differently across engines; assertions must compare semantic computed values, not browser-specific decorative internals.
- Baseline generation produces binary changes; provenance and exact path allow-list are mandatory.

## Rollback

Revert the Issue #695 runtime squash merge and retain the previous three Calendar visual baselines until a corrected semantic owner is validated.