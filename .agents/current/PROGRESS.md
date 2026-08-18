# Current Task Progress

## 2026-08-18 13:28 +03:00

### Verified

- Live base is `main@f1cfa074ffe25db6e253b60b6b3c5970ba8dda03`; no pre-existing #593 branch/PR existed.
- `appearance-preference.ts` already resolves Auto correctly and updates `data-lexigo-resolved-appearance` at bootstrap and on media-query changes.
- `appearance.css` now keeps explicit token overrides on `data-lexigo-appearance`, but applies document canvas/form presentation from `data-lexigo-resolved-appearance`.
- The existing Profile account/security compatibility palette is mirrored in the existing `appearance.css` theme owner under resolved Light, without modifying `profile.css` or account APIs.
- Profile dark-only avatar/primary-button compatibility selectors now follow resolved Dark.
- New source ownership contract verifies preference-vs-resolved separation and blocking UI routing.
- New `profile-auto-theme.spec.ts` runs only in `ios-webkit` at 430×932 and checks direct entry, reload, Home→Profile navigation, Back/Forward, live system Light↔Dark changes, computed `html/body` canvas, semantic tokens, account/security paint and horizontal overflow.
- The new Light screenshot remains intentionally fail-closed as `REVIEW_REQUIRED` until exact Linux WebKit evidence is manually reviewed.
- `test:e2e:ui` includes the new regression exactly once; no workflow edit is required.
- Current diff is exactly seven allow-listed files and was `behind_by=0` before Draft PR creation.
- Draft PR #597 is open.

### Finding

The implementation can stay inside the existing appearance theme owner: no component, `profile.css`, global legacy canvas, design-source or workflow changes are required.

### Root cause

Rendered presentation consumed the stored preference attribute on document/Profile compatibility owners even though Auto requires the resolved appearance attribute.

### Changed files

- `frontend/app/appearance.css`
- `frontend/components/profile-theme-ownership.test.ts`
- `frontend/e2e/profile-auto-theme.spec.ts`
- `frontend/package.json`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Checks passed

- Live main/branch/PR preflight.
- Source ownership/read-back inspection.
- Scope compare: seven allow-listed files, no canonical Profile baseline edits, `behind_by=0` before PR.

### Checks failed

None classified yet. The first final-head diagnostic is expected to fail only at the deliberate 430×932 Light `REVIEW_REQUIRED` screenshot gate after all functional/computed-style assertions pass.

### Current branch head

Resolve from live PR after current-task documentation synchronization.

### Next action

Freeze the synchronized Draft head, run full CI, classify any failure. If the only failure is the deliberate WebKit evidence gate, download the exact artifact, manually review it and approve only that content-addressed fingerprint before rerunning immutable-head CI.
