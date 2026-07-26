# Current Task Progress

## 2026-07-26 12:05 Europe/Berlin

### Verified

- Live `main` remains `6f9bcd196af1f876500d2b6f700e5e7fdfb685aa`; Draft PR #233 is isolated in `feat/issue-197-dictionary-catalog` and remains mergeable.
- Issue #197 and its E2E guidance were read in full. The approved Figma source is Mobile Light `78:54` and Desktop Light `78:193`; Dark is derived from semantic tokens and requires separate Linux evidence.
- `/dictionary` retains the dedicated `LexigoDictionaryApp` route island, authenticated server filtering/sorting/pagination, canonical URL state, Back/Forward restoration, exact `/words/[id]` navigation and route-level bundle ownership.
- The catalog now implements the approved heading, search, quick filters, desktop filter rail, vertical result rows/cards and a single pagination owner. The catalog-level Lesson Composer CTA is removed.
- Current `ResourceStatus`, validated `CatalogPageInfo`, keyed remote-detail state, server page/order ownership and navigation intents from live `main` are preserved.
- Word Detail remains outside redesign scope and is protected by a narrow compatibility stylesheet.

### Validation evidence

- CI #1907 (`30196047727`) proved frontend core, backend, both UI shards, accessibility, performance, iOS/PWA and Dictionary smoke. Its only failure was the expected stale Dictionary visual snapshot contract.
- Light Linux actuals from CI #1907 were manually reviewed against Figma and accepted at `390 × 1064`, `768 × 1616` and `1440 × 1624`.
- CI #1908 (`30196904679`) exposed a nondeterministic raw PNG difference limited to 28 antialiased pixels in the profile glyph. The visible catalog RGBA content was unchanged.
- The Dictionary visual contract now masks only the profile button and uses content-addressed full-page screenshots for compact Light, compact Dark, medium Light and desktop Light.
- CI #1909 (`30197233623`) produced deterministic hashes across retries:
  - compact Light: `fd61da13cbfb4378e17c5337e95632e95a33a944a5bbed1f64741124a8cea32b`;
  - compact Dark: `b3f5349c94660fa041ac62d96f0e2f1f7683dfdbccf3792933eeb8a3892a3e27`;
  - medium Light: `a0e187ffe7dedf4fefc29b4ae8f4ecf7ca859b66de178395c7b928647c19b80f`;
  - desktop Light: `eb4bf1143a93bedaf6186deca7f88154db1b1c2c46018b0dd4f3a6bfe63899bd`.
- All four CI #1909 actuals were inspected manually. Dark contrast, status chips, navigation, result cards and footer remain correct.

### Finding and root cause

- The initial implementation checkpoint reconstructed `dictionary-catalog.tsx` from an obsolete component shape. CI #1889 caught the immediate lint symptoms, while review identified the larger architectural regression. The obsolete checkpoint is revoked.
- A later visual calibration showed raw screenshot SHA instability in the profile glyph. The failure was not a product UI delta; it was a platform-sensitive antialiasing boundary. Masking the non-product profile glyph makes the Dictionary content contract stable without relaxing visual coverage of the catalog.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/components/dictionary-catalog.tsx`
- `frontend/components/dictionary-catalog.test.tsx`
- `frontend/app/dictionary-catalog.css`
- `frontend/app/dictionary-detail-compatibility.css`
- `frontend/app/layout.tsx`
- focused Dictionary browser, history, accessibility, PWA, ownership, performance and visual contracts

### Checks passed

- Live repository, PR, Issue, main and stage pre-flight.
- Figma node and semantic-variable inspection.
- Frontend lint, typecheck, unit tests, production build and dependency audit.
- Backend unit/security and integration gates.
- Dictionary UI, history, Back/Forward, PWA, accessibility, keyboard, performance and ownership contracts.
- Manual Linux Light and compact Dark visual review.
- Deterministic retry verification for all promoted Dictionary visual hashes.

### Checks failed and disposition

- CI #1889: obsolete component reconstruction; revoked and corrected.
- CI #1907: stale binary Dictionary snapshots; replaced by content-addressed evidence.
- CI #1908: provisional Dark baseline plus profile-glyph antialias instability; isolated and corrected.
- CI #1909: expected calibration failure because all four content-addressed hashes were intentionally set to `pending-linux-calibration`; actuals are now approved for promotion.

### Current branch head

- `b13a09739849eef853a8e6c65f295f4358764b6d` before this documentation update.

### Next action

Promote the four approved CI #1909 hashes in `frontend/e2e/visual-regression.spec.ts`. The resulting immutable head must pass the complete CI matrix before PR #233 is marked Ready and squash-merged. Then validate the exact squash SHA on stage, close Issue #197 and perform a separate post-merge Agent Harness reconciliation PR.
