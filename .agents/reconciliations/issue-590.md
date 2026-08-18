# Issue #590 delivery reconciliation

Verified: 2026-08-18

## Product delivery
- Parent audit: Issue #587 / PR #588; umbrella #205.
- Product issue: #590.
- Product PR: #594.
- Final developer head: `67b4952a1acd18a45afb33ff581776b289e04b72`.
- Immutable-head CI: #3774 / run `32110051147`, success on attempt 2 after one evidence-classified unrelated native Chromium middle-click/new-tab flake in existing `app-router-routes.spec.ts`.
- The new #590 source/browser contracts passed on both attempts; no product code changed for the retry.
- Squash merge/main runtime SHA: `86a27e1ae91e344906137fd885dd4733cac68aec`.
- Exact-main CI: #3775 / run `32117543037`, success.
- Stage: run `32118426411`, exact image SHA `86a27e1ae91e344906137fd885dd4733cac68aec`, deploy/public smoke/public browser all success.
- Issue #590 closed.

## Durable runtime contract
- At `<=359px`, route-scoped `.lx-phrase-detail-layout { padding: 0; }` wins over shared `.lx-detail-card` padding without modifying the shared owner.
- 320px retains the route-owned 16px outer gutter, with no duplicate 30px layout inset and no horizontal overflow.
- 390px+ retains the shared 30px detail-card inset and canonical composition.
- `premium-ui.css`, the canonical phrases stylesheet and visual baseline files remain unchanged.

## Regression evidence
- The source ownership contract protects breakpoint/import/specificity/property isolation.
- The browser cascade-order contract proves identical 320/390 geometry across stylesheet orders.
- Existing canonical Phrase Detail visual fingerprints reproduced unchanged.

## Reusable lesson
- For a narrow route-only correction, neutralize the shared legacy property with a more-specific route owner only at the required breakpoint, and prove cascade-order independence.
- Classify unrelated browser flakes from exact artifacts before the single allowed same-head retry; do not mutate product code or baseline files to make CI green.

## Remaining work
- Reconstruct #588 on corrected `main`.
- Re-run all 20 320×700 Light/Dark route states, manually review exact Linux evidence, then approve content-addressed fingerprints only if structurally and visually valid.

## Harness reset
- `.agents/current/TASK.md`, `PROGRESS.md`, and `EXECUTION.md` are reset byte-for-byte to their canonical templates in this PR.
