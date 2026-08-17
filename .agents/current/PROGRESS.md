# Current Task Progress

## 2026-08-17 Europe/Berlin

### Verified

- Live `main` at branch creation: `157c645731604fb39488068397472994b2ea67d1`.
- Issue #571 created from exact Linux evidence produced by #568 / Draft PR #570.
- Audit head `8b656e7c05fac830a343ec1bf88aea9be0bfe148`, CI #3704 / run `31979268275`, visual artifact `9271989171`, digest `sha256:2e6dd3d9f51fcd7e787865b8f61e7b9f27373ad841e85fd327f663a51d6f0aae`.
- All 20 tablet audit states passed pathname/owner/navigation/overflow/runtime-error checks before the intentional `REVIEW_REQUIRED` hash gate.
- Manual review classified seven routes as visually coherent and reproduced real defects in `/learn`, `/phrases`, `/profile` in both Light and Dark.
- Learn root cause: desktop outer `1fr + 360px` composer survived at 768 because the one-column bridge ended at 767 while RouteChrome tablet rail starts at 720.
- Phrases root cause: fixed `250px + 1fr` catalog workspace survived at 768; single-column catalog layout started only below 768.
- Profile root cause: route-navigation tablet rail offset was overridden by route-specific `.lx-profile-app .lx-main-content { margin: 0 auto }` in the actual cascade.
- Draft PR #572 is the isolated runtime repair; no backend/API/component/design/RouteChrome-topology change is in scope.
- CI #3707 / run `31980303255` on head `1cefd8f730848b11159e07a26c468ac3e96d76c2` passed frontend core, backend, both UI shards and the new computed-cascade contracts. Visual regression failed only the expected existing Learn medium fingerprint.
- CI #3707 visual artifact `9272219823`, digest `sha256:b734f7374bbde5ebc0f04d3a88b04930a575119228b0cbcade28e82969f65575`, produced reviewed Learn medium actual `768×1990`, sha256 `9fcb944e8be1cdd3ef56e52e28dc233e86acec3b6d9c383f4b1de723860b51b4`.
- Exact Learn PNG was manually reviewed: the prior 6154px collapsed column is gone; the composer is one readable tablet column, controls and CTA are clear of the rail, and compact/desktop visual fingerprints remained unchanged. The reviewed Learn fingerprint is committed with CI #3707 provenance.
- A targeted `tablet-layout-visual.spec.ts` was added for Phrases/Profile because the legacy visual suite did not own medium baselines for those routes.
- CI #3711 / run `31980866589` on head `f9f7bace7835d53d71a5ec971b163cfd3eec0fd0` passed the reviewed Learn medium baseline and failed exactly four intended `REVIEW_REQUIRED` tablet captures: Phrases Light/Dark and Profile Light/Dark.
- CI #3711 visual artifact `9272371938`, digest `sha256:a8b6a2b92af4048608084c9563e719c1334d3d6f64b103d23b8cf41901941897`, was downloaded and inspected directly.
- Reviewed Phrases Light: `768×1593`, sha256 `16c8efb17d7c599d425266d9c4e5457d9ac2b02756a677e0246c8aaf6fe8643`.
- Reviewed Phrases Dark: `768×1593`, sha256 `c1a0ee9a5e970743b1d7ce149ffe44cfdef13f9cec481a34ddbcf2cc1b345663`.
- Reviewed Profile Light: `768×4229`, sha256 `b73fa564476dc1458c5096e02aac76667271df87e5fba8ce58e0f0fa7f111042`.
- Reviewed Profile Dark: `768×4229`, sha256 `d3975453cc920c779d363ffe7fd791f1e4fb10e306cf7cead870c8baefc8be6e`.
- Manual review confirmed Phrases filters remain visible above full-width readable result cards in both themes; Profile heading/cards start completely to the right of the tablet rail in both themes. No new visual defect was accepted by hash replacement.
- All four Phrases/Profile fingerprints are now committed with exact CI #3711 head/run provenance.

### Finding

The three defects were production CSS ownership failures at the existing 720–1099px RouteChrome tablet interval, not OpenPencil source defects. Route-local presentation bridges now preserve feature semantics while fitting the shell-owned rail.

### Changed files

- `frontend/app/adaptive-lesson-composer.css`
- `frontend/app/phrases-tablet-layout.css`
- `frontend/app/profile-tablet-layout.css`
- `frontend/app/layout.tsx`
- `frontend/e2e/adaptive-layout-cascade.spec.ts`
- `frontend/e2e/visual-regression.spec.ts`
- `frontend/e2e/tablet-layout-visual.spec.ts`
- `frontend/playwright.visual.config.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Checks passed

- #3707 lint/typecheck/unit/build/dependency audit.
- #3707 backend unit/security/integration.
- #3707 UI shards 1/2 and 2/2, including the new Learn/Phrases/Profile cascade contracts.
- #3707 accessibility, iOS PWA, service worker, content-security, dictionary, performance and other browser gates that completed.
- Manual exact Linux Learn medium review before fingerprint approval.
- #3711 exact targeted visual classification: Learn reviewed fingerprint passed; only four new Phrases/Profile review sentinels failed.
- Manual exact Linux Phrases/Profile Light/Dark review before fingerprint approval.

### Checks failed by design

- #3707 Visual regression: exactly the old broken Learn medium fingerprint, used as fail-closed evidence before manual approval.
- #3711 Visual regression: exactly four `REVIEW_REQUIRED` Phrases/Profile Light/Dark captures, used as fail-closed evidence before manual approval.

### Current branch head

Resolve from live branch ref after the evidence/progress commits.

### Next action

Run one full immutable-head CI with all five reviewed tablet fingerprints committed. Do not change repository files after that run begins unless a real gate failure is diagnosed; any new commit requires a fresh immutable-head full CI.