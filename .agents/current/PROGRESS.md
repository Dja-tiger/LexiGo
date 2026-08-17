# Current Task Progress

## 2026-08-17 Europe/Berlin

### Verified

- Issue #568 remains open under umbrella #205; Draft PR #570 remains the authoritative fail-closed visual audit path.
- Runtime Issue #574 / PR #575 is delivered on `e9314e08cfb517388b8427dcc5ba74df69c861f7`; immutable-head CI #3729, exact-main CI #3730 and exact-SHA Stage/public #3583 are green.
- Reconciliation PR #576 merged as current base `f614c1646f113e1303286ca3cc759a87e6dd74d5`; exact-main Agent Docs CI #3732 is green.
- PR #570 was force-reconstructed as commit `3578718bdcba1a24873ce23999ef7672a22193c5` whose direct parent is exact base `f614c1646f113e1303286ca3cc759a87e6dd74d5`.
- Reconstructed diff contains only `frontend/e2e/route-tablet-parity.spec.ts`, `frontend/playwright.visual.config.ts` and `.agents/current/**`; the independently delivered #575 `home-tablet-progress-visual.spec.ts` remains registered in the current visual config.
- CI #3733 / run `32040684330` ran on exact reconstructed head `3578718bdcba1a24873ce23999ef7672a22193c5`.
- The Visual job reached exactly twenty logical failures: one for each route/theme state. Every failure was the deliberate `REVIEW_REQUIRED` fingerprint gate after pathname, semantic owner, RouteChrome/focused-route ownership, 768×1024 viewport, horizontal geometry, visible-focusable clipping and runtime-error assertions had passed.
- Exact Linux Visual artifact: ID `9291962719`, digest `sha256:aefffe94dc106084f4c18eb5d54d9e1e2ad87a1d8ccf670ac1c818bd5b480033`.
- All twenty exact Linux PNGs were manually reviewed directly from that artifact before any fingerprint write. Home spacing is repaired; prior Learn/Phrases/Profile tablet defects do not recur; Active Lesson and Onboarding remain focused; no new clipping, overflow or composition defect was found.
- Artifact-level stability was verified: each of the twenty logical states has three retained failure records with the same `height` and SHA-256, and each SHA matches PNG bytes whose decoded width/height is exactly the recorded value.

### Reviewed fingerprints

Source for every fingerprint below: run `32040684330`, head `3578718bdcba1a24873ce23999ef7672a22193c5`, artifact `9291962719`.

- Home Light `768×1105`: `08d213c5fa280702abadc675476e8f4197c100ffd9011eb0d5a7f5772bab9d8e`.
- Home Dark `768×1105`: `d2ca7909b3a0f3480f28af24f9d734f0c641cc5f1ebc174108a408cbefb40bbc`.
- Learn Light `768×1990`: `189c3b116e23acb636e1f756e79a15a016aea78cea71a8af6ce38d7832311f08`.
- Learn Dark `768×1990`: `18e6e8da66d811cea71fefdcbd34ed30e6e8a27584aeb54f66eb5c484e6c07c4`.
- Active Lesson Light `768×1024`: `39dbd304a26668f6a11acb774d7e790cab4ba51af2710b0fc42a00631b104998`.
- Active Lesson Dark `768×1024`: `4f02aaef1849bee10c6a3bc71a72dba26ee2cb3615e12030c6eead00281cf935`.
- Progress Light `768×1689`: `41ef29fa337e8d9687d00ff1d69ff8d5689923ff706e5a39d873c9ade6de33c5`.
- Progress Dark `768×1689`: `121d09086cff4b44693bf0351b243f176564010037c5494d8f642f6286675da9`.
- Dictionary Light `768×1760`: `17910a66337422d1765ef1eec28d754e80083f6f3d7f59ea6d60b459ab54d38e`.
- Dictionary Dark `768×1760`: `91bdb446377da58c834ab0a915952b7ad6d038e3e9d980590d75288d6b0cedee`.
- Word Detail Light `768×1663`: `e065b923b788c332735b40370c61734eb5fc4e59bdb98f5ee0a5ee1c7556deb8`.
- Word Detail Dark `768×1663`: `d625844b0762103dc08a910dd994db0d0001ca7466691d779539d32945bf796a`.
- Phrases Light `768×1593`: `16c8efb17d7c599d425266d9c4e5457d9ac2b02756a677e0246c8aaf6fe8643a`.
- Phrases Dark `768×1593`: `c1a0ee9a5e970743b1d7ce149ffe44cfdef13f9cec481a34ddbcf2cc1b345663`.
- Phrase Detail Light `768×1496`: `d1c805baea90c677a320a6a32d9b93eda1e6fa61524bc6410520fc465faa6e78`.
- Phrase Detail Dark `768×1496`: `cfaaaabf676496c04ce033f0bdd99888bcda2c9ed2e7511ab8cf9c6f9ab7703c`.
- Profile Light `768×4229`: `b73fa564476dc1458c5096e02aac76667271df87e5fba8ce58e0f0fa7f111042`.
- Profile Dark `768×4229`: `d3975453cc920c779d363ffe7fd791f1e4fb10e306cf7cead870c8baefc8be6e`.
- Onboarding Light `768×1024`: `b63d5ec40e59cf210db08a2edb5134a529adb62653b8dd751da91472d01f010a`.
- Onboarding Dark `768×1024`: `483efada706044601cd599aea9e7c76c0e71da176578a610740c666bfd620aad`.

### Finding

The reconstructed post-#575 matrix is visually acceptable across all ten routes in Light/Dark. No third runtime repair slice is required before approval.

### Duplicate coverage reconciliation

- Draft PR #569 is structural-only and overlaps #570.
- #570 already owns the stronger route owner, RouteChrome/focused boundary, geometry/focus clipping, runtime-error and exact PNG/SHA evidence contract.
- The one useful explicit assertion from #569 — runtime `prefers-reduced-motion: reduce` — is now included directly in `expectTabletOwnership` before the screenshot gate.
- After the approved-head CI proves that assertion together with the reviewed hashes, #569 has no unique acceptance ownership and may be closed as duplicate rather than merged.

### Changed files

Current PR scope remains limited to:
- `frontend/e2e/route-tablet-parity.spec.ts`
- `frontend/playwright.visual.config.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Checks passed

- #575 immutable-head, exact-main and Stage/public gates are green.
- #576 lightweight PR CI #3731 and exact-main CI #3732 are green.
- #3733 core compile/build succeeded on reconstructed head before the deliberate Visual review gate.
- All twenty #3733 structural tablet states reached only `REVIEW_REQUIRED`.
- Exact artifact and PNG byte/dimension verification completed.
- Manual Light/Dark review completed for all ten routes.

### Checks failed

- CI #3733 is intentionally red because the reviewed hashes were not yet committed when it ran. This failure is the expected fail-closed approval gate, not a product regression.

### Current branch head

Resolve from live branch ref after the separate reviewed-evidence approval commit.

### Next action

Commit only the manually reviewed fingerprints, explicit reduced-motion assertion and this Agent Harness evidence. Verify the diff allow-list, then run a new full immutable-head CI. The Visual job must reproduce all twenty reviewed fingerprints without update mode. After full green CI, audit review threads/comments, close duplicate Draft PR #569 only after final coverage verification, mark #570 Ready, squash-merge with expected head and require exact-main CI. No Stage redeploy is required if the final PR remains test/evidence-only.
