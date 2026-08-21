# Canonical Lesson Result

Issue: #194  
Implementation PR: #209

## Active design source

OpenPencil is the active production source of truth for Lesson Result.

- editable repository source: `design/openpencil/LexiGo Design System.op`;
- canonical route/state manifest: `docs/figma/openpencil-production-handoff.json` → `lesson.result`;
- active matrix frame: `fig_2745` — `Lesson Result / Production Matrix` on `14 — Active Lesson Screens`.

Canonical OpenPencil frames:

| State | Mobile | Desktop | Historical Figma provenance |
| --- | --- | --- | --- |
| Complete | `fig_3072` — `Mobile / Result / Complete` | `fig_2910` — `Desktop / Result / Complete` | `217:5`, `217:10` |
| Daily Goal | `fig_3042` — `Mobile / Result / Daily Goal` | `fig_2869` — `Desktop / Result / Daily Goal` | `217:6`, `217:11` |
| Next Block | `fig_3011` — `Mobile / Result / Next Block` | `fig_2828` — `Desktop / Result / Next Block` | `217:7`, `217:12` |
| Due Review | `fig_2981` — `Mobile / Result / Due Review` | `fig_2787` — `Desktop / Result / Due Review` | `217:8`, `217:13` |
| Sync Pending / Dark | `fig_2951` — `Mobile / Result / Sync Pending / Dark` | `fig_2746` — `Desktop / Result / Sync Pending / Dark` | `217:9`, `217:14` |

The former Figma file key and `217:*` IDs are retained only as historical provenance for already-delivered work. They are not an active dependency, are not required for future validation, and must not block OpenPencil maintenance.

## Runtime ownership

`LessonResultPresentation` owns only the result presentation and interaction hierarchy. The active lesson route owner remains responsible for authenticated lesson lifecycle, review persistence, progress refresh, distinct next-lesson creation, route navigation, and recovery state.

The result distinguishes objective recall evidence from recognition and passive activity, restores after reload/history without resubmitting a review, prevents reopening the completed lesson through the continuation action, and presents one primary action for each result state.

## Delivery and validation contract

PR #209 closed Issue #194 with canonical complete, daily-goal, next-block, due-review and sync-pending states. The current OpenPencil handoff preserves the same hierarchy and geometry; this maintenance does not change runtime behavior or visual baselines.

The required implementation gate remains lint, typecheck, unit tests, production build, dependency audit, browser projects, accessibility, visual regression, performance budgets and container builds. Reload, browser-history restoration, duplicate-submit prevention, focus ownership and retry behavior remain mandatory executable contracts.

Canonical E2E contracts target visible semantic controls and the actual continuation CTA accessible name rather than removed implementation IDs or state copy. Cross-browser Recall submission additionally confirms focus, the controlled input value and the enabled primary action before submit.

Committed Linux baselines remain unchanged:

- `lesson-result-next-compact-visual-compact-linux.png`;
- `lesson-result-due-desktop-visual-desktop-linux.png`;
- `lesson-result-daily-goal-dark-desktop-visual-desktop-linux.png`.

These filenames are part of the visual contract. Renaming a state, viewport project or snapshot is a deliberate baseline migration and must not be performed as incidental test repair.
