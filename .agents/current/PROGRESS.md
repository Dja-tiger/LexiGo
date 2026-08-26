# Current Task Progress

## 2026-08-27 00:09 +03

### Verified

- Repository: `Dja-tiger/LexiGo`.
- Issue #698 remains open under parent #205; Draft PR #699 is the active and only runtime slice.
- `main` is `f3c161af7cf4fe91dbb2f05441f848963b80e30f`; PR #699 head before this correction is `62d080fdf7fd770abc7ef62cf2bba705e45f5191`, based on that exact main SHA.
- Immutable CI #4204 / run `32975715681` produced dedicated Playwright artifacts on that exact head: UI1 `9609746306`, UI2 `9609770848`, Visual `9609733739`.
- UI1 and UI2 reproduce the same account-email test defect: `page.getByRole("alert", { name: "" })` resolves both the confirmation error notice and Next.js `#__next-route-announcer__`, causing strict-mode failure in Chromium, WebKit, Android Chromium and iOS WebKit.
- UI1 also recorded one unrelated `lesson-result.spec.ts` WebKit timeout on a disabled `Сверить ответ` button. It is not used as justification for a branch change; recurrence on the next immutable head will be classified from its own artifact before any action.
- Visual evidence intentionally failed closed only because all four fingerprints were still `pending-linux-review-*`.
- Reviewed exact Linux actuals from Visual artifact `9609733739` are stable across retry copies and have expected dimensions:
  - compact-light, 390×844: `3bdd149366e5268774d6fd2d04abd85192458e0db9c1e2e0b799928802c3a79b`;
  - compact-dark, 390×844: `f6f7d17e727d97f7641e9ff7aefb8cd7a58ed33aaf8ab41c9625af70c2b2989c`;
  - desktop-light, 1440×1024: `cdf34ac9b167b2b4750baf088e0abde390c3fd3410fd882ff6d49e0a5a7843bf`;
  - desktop-dark, 1440×1024: `4d817b7d917a490c8aa3d22d4092ab8bdb509db1db139782def9019872f5db66`.
- Manual review confirms Light/Dark palette ownership changes while confirmation/profile geometry, copy, controls and responsive composition remain stable; no canonical PNG baseline replacement is required.

### Finding

The production semantic CSS change is not implicated by the failed UI shards. The blocking account-email failure is a stale/ambiguous Playwright locator introduced by the new appearance proof, while the Visual job is the designed fail-closed review gate awaiting content-addressed Linux approval.

### Root cause

- UI: an unscoped role-only `alert` locator assumed the confirmation notice was the only alert in the document, but Next.js owns a second route-announcer alert.
- Visual: four reviewed fingerprint allow-lists were intentionally initialized with pending markers until the first immutable Linux artifact could be inspected.

### Changed files

Planned correction on the next branch head:

- `frontend/e2e/account-email-change.spec.ts`: scope the Light error assertion to `.lx-email-confirmation-card .lx-account-notice.error`, matching the already-correct Dark assertion and semantic owner.
- `frontend/e2e/profile-email-confirmation-visual.spec.ts`: replace only the four `pending-linux-review-*` values with the reviewed SHA-256 fingerprints above.
- `.agents/current/PROGRESS.md` and `.agents/current/EXECUTION.md`: record immutable CI/artifact provenance and failure classification.

### Checks passed

- Runtime semantic computed-style evidence reached the expected confirmation state in all failing UI projects before locator resolution failed.
- Visual actuals were downloaded from exact-head run `32975715681`, matched by SHA-256 to report attachments, inspected manually, and verified at 390×844 / 1440×1024.
- `main` remained `f3c161af7cf4fe91dbb2f05441f848963b80e30f` during diagnosis.

### Checks failed

- CI #4204: UI shard 1, UI shard 2 and Visual regression.
- UI1/UI2 account-email root cause is classified and corrected test-side; Visual failure is expected review gating.
- One unrelated UI1 Lesson Result WebKit timeout remains observation-only unless it reproduces on the corrected immutable head.

### Current branch head

- Before correction: `62d080fdf7fd770abc7ef62cf2bba705e45f5191`.
- Next head: resolve from the Git Data commit created from this exact parent.

### Next action

Create one fast-forward branch commit containing only the scoped locator correction, four reviewed Linux fingerprints and this Agent Harness evidence; read all changed paths/ref back, verify the diff against unchanged main, then require a new full immutable-head CI without blind retries.
