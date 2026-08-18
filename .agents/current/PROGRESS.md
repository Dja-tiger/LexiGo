# Current Task Progress

## 2026-08-18 Europe/Moscow

### Verified

- live base `main`: `7482d0ed52f9f5835b6a94fc4a7818ee1936d4aa`;
- Issue #590 is open and owned by Draft PR #594;
- only competing open PR is Draft audit #588 on the older diagnostic base;
- Stage remains healthy on runtime SHA `fb357e4c322bbae6b016b4be8a7c59cc39094170`;
- Issue #589 runtime repair and post-merge reconciliation are complete;
- `phrases.css` already reduces outer Phrase Detail padding to 16px per side at `max-width: 359px` but leaves the shared `.lx-detail-card` 30px padding active;
- live `premium-ui.css` contains the exact legacy fallback `.lx-detail-card { border-radius: 28px; padding: 30px; }`;
- `phrases-grid-cascade.spec.ts` already proves Phrases CSS ownership under three stylesheet orders and is collected by authoritative UI/responsive commands;
- `phrases-css-ownership.test.ts` already provides selector-specificity/source ownership helpers.

### Finding

The minimum-width defect is an ownership leak from the shared legacy `.lx-detail-card` fallback into Phrase Detail. A dedicated focused CSS layer is safer than rewriting the large canonical `phrases.css` and follows existing repository patterns such as tablet/touch-target route layers.

### Root cause

The Phrase Detail layout element carries both `lx-detail-card` and `lx-phrase-detail-layout`. At 320px, route outer padding leaves 288px available, but the shared 30px layout padding consumes another 60px before the phrase card's own content padding. The phrase-specific responsive owner never neutralized that fallback.

### Changed files

- `frontend/app/phrase-detail-min-width.css` — new focused `<=359px` route owner;
- `frontend/app/layout.tsx` — registers that owner exactly once after Phrase Detail touch-target CSS;
- `frontend/components/phrases-css-ownership.test.ts` — protects import boundary, breakpoint, property and selector specificity;
- `frontend/e2e/phrases-grid-cascade.spec.ts` — proves 320px/390px detail geometry under three stylesheet orders;
- `.agents/current/TASK.md`;
- `.agents/current/PROGRESS.md`;
- `.agents/current/EXECUTION.md`.

### Implementation

- new rule:
  `.lx-app[data-route-client-island="phrases"] .lx-phrase-detail-layout { padding: 0; }` only inside `@media (max-width: 359px)`;
- selector specificity is `[0,3,0]`, stronger than legacy `.lx-detail-card` `[0,1,0]`, so it wins even when the shared stylesheet is loaded after it;
- 390px receives no focused override and therefore keeps the existing 30px legacy inset;
- focused browser contract now injects four relevant stylesheets in three orders and checks:
  - 320px: route padding 16px, layout padding 0, main width equals layout width, no horizontal overflow;
  - 390px: route padding 24px, layout padding 30px, main width equals layout width minus 60px, no horizontal overflow;
- existing catalog grid cascade assertions remain intact.

### Checks passed

- exact main, Issue #590, open PRs and Stage state verified;
- current Agent Harness was reset to canonical templates by merged PR #592 before branch creation;
- branch created directly from exact main;
- focused CSS file read back exactly as written;
- `layout.tsx` read back with one focused import in the expected Phrases/detail import block;
- live shared fallback was re-read and exact 30px property confirmed;
- branch compare is `behind_by=0` and contains exactly seven allow-listed files;
- `phrases.css`, `premium-ui.css`, `phrases-visual.spec.ts`, backend, workflows and design sources are unchanged;
- Draft PR #594 created from the exact branch/base with the same seven-file scope.

### Checks failed

None yet. Targeted source/browser checks execute through PR CI because the connector-only environment has no repository-native local package runner/checkout.

### Current branch head

Resolve from live branch ref after every write. PR-bound harness writes are the final planned branch changes before immutable-head validation.

### Next action

Bind PR #594 in execution evidence, then freeze the developer-authored head and inspect full immutable-head CI. Any canonical 390px Visual mismatch must be reviewed from exact Linux evidence before considering a baseline change; the expected result is no 390px fingerprint change.
