# Current Task Progress

## 2026-08-23 15:48 +03:00

### Verified runtime contract

- Draft PR #664 remains the only active development slice for Issue #651 on `feat/issue-651-process-aware-home`.
- Base `main` is still exactly `6d8c8dbc3b25f5fd428c18cb18b151402984ec72`.
- Automatic process ownership is mutually exclusive:
  - Study owns only new candidates;
  - Review owns due non-new candidates;
  - Remediation owns not-due non-new candidates with persisted weakness/error evidence.
- `POST /api/v1/lessons/preview` accepts optional `sessionKind`, validates the same vocabulary as create, echoes explicit intent, and preserves omission for the manual `/learn` composer.
- Authenticated Home loads independent Study / Review / Remediation previews and derives backlog counts from `availableWords + availablePhrases`.
- Automatic Home blocks are fixed at 15 items and create the exact selected `sessionKind`, compatible `studyMode` and `lessonSize: "15"`.
- Recommendation priority is active lesson > Review > Remediation > Study > manual fallback, while secondary controls keep every available automatic process selectable.
- Parent Issue #651 remains open; this slice does not change scheduler formulas, FSRS, manual composer sizes or long-term scoring.

### Immutable CI findings and repairs

- CI #4032 / run `32635302334` on source head `77ca1ea56e23b058eeb2786524617797aaa18d47` proved backend/core gates green and isolated deterministic Home-only visual drift caused by the new process controls.
- CI #4035 on head `bf0e82f653ed56df08c372664d6b5469ce7466bd` reduced non-visual failures to two stale downstream test owners:
  - `account-hydration.spec.ts` expected a redundant Home `/progress` re-read although account-owned progress remained hydrated;
  - `connectivity-touch-targets.spec.ts` used a global offline-copy locator that became ambiguous after Home gained contextual offline copy.
- The account test now asserts the actual ownership contract: Phrases retry does not rehydrate unrelated progress/active state; returning Home reuses account progress and remounts only the Home active-session owner.
- The connectivity test now scopes its text/action assertions to the existing complementary landmark `Состояние подключения и синхронизации`; no production connectivity owner changed.

### Reviewed visual evidence

Exact Linux artifact #9492248013 from CI #4032 was manually reviewed for the Home states required by Issue #651:

- 320×700 Light/Dark;
- 390 compact;
- 768×1024 Light/Dark;
- 1440×1024 Light/Dark;
- true 200% browser zoom Light/Dark;
- desktop offline dark with the existing system-state overlay.

The new Review / Remediation / Study controls remain readable and focusable without horizontal overflow, clipping or overlap. The expected vertical growth at true 200% zoom is caused by the two additional contextual controls rather than hidden overflow.

Home-only evidence promotion is now recorded in:

- `frontend/e2e/home-tablet-progress-visual.spec.ts`;
- `frontend/e2e/route-tablet-parity.spec.ts` — exactly six Home Light/Dark fingerprints across 320/768/1440 changed; PR patch confirms all non-Home entries are untouched;
- `frontend/e2e/route-browser-zoom-parity.spec.ts` — Home true-200% fingerprints now use exact reviewed 720×710 evidence;
- `frontend/e2e/visual-regression.spec.ts` — Home 390/768/1440 uses strict content-addressed fingerprints instead of updating binary snapshots blindly;
- `frontend/e2e/system-states-visual.spec.ts` — the original OpenPencil SHA and renderer-equivalent evidence remain intact, with the #651 Home product-state fingerprint tracked separately as `reviewedProductStateSha256`.

### Current branch state

- Last runtime/test/visual head before harness reconciliation: `9308831a78265e5c28b1eedea73a2e88175a5e8f`.
- PR #664 was mergeable and still Draft at that head.
- `main` remained exactly `6d8c8dbc3b25f5fd428c18cb18b151402984ec72` after every write/read-back check.
- CI #4042 / run `32640268308` started on `9308831a78265e5c28b1eedea73a2e88175a5e8f`; it is superseded by this harness reconciliation and is not the final merge gate.

### Remaining delivery gates

1. Run full immutable CI on the final docs-reconciled exact head and require every backend, integration, frontend, UI, visual, accessibility, performance, CSP/PWA and container job to pass.
2. Audit PR comments, reviews and unresolved review threads.
3. Update the PR body to describe the implemented scope and reviewed Home-only visual promotion accurately.
4. Convert PR #664 from Draft to Ready only after the exact-head gates are green.
5. Squash-merge with expected-head protection.
6. Verify the resulting exact `main` SHA through main CI plus exact-SHA Stage/public smoke/browser validation.
7. Perform the separate post-merge Agent Docs reconciliation only after runtime Stage evidence is green.
8. Keep parent Issue #651 open for the remaining architecture slices.
