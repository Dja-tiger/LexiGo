# LexiGo Project State

## Verification

- Last verified: 2026-08-17 Europe/Berlin.
- Repository: `Dja-tiger/LexiGo`.
- Latest runtime-bearing `main`: `e9314e08cfb517388b8427dcc5ba74df69c861f7` from runtime PR #575.
- Latest deployed runtime/Stage SHA: `e9314e08cfb517388b8427dcc5ba74df69c861f7`.
- PR #575 final developer-authored head `37c209d5ceadeb153db17f0cc4a815536a5b6605` passed full immutable-head CI #3729 / run `32024776340`; one unrelated pre-existing new-tab UI flake was classified from diagnostics and passed a controlled same-head job retry without code changes.
- PR #575 squash merge: `e9314e08cfb517388b8427dcc5ba74df69c861f7`.
- Exact-main runtime CI #3730 / run `32026831779` passed completely on the same SHA, including backend integration/unit/security, frontend core, both UI shards, Visual regression, accessibility, performance, CSP/service-worker and both container builds.
- Deploy Stage #3583 / run `32027587186` passed on the same exact SHA. Deployment used image tag `e9314e08cfb517388b8427dcc5ba74df69c861f7`; public frontend/API smoke returned HTTP 200 and public Chromium/iOS WebKit verification passed 12/12.
- Issue #574 is closed completed. The runtime repair is presentation-only for authenticated Home progress label/value separation in the `761px–1023px` interval and does not change progress semantics, API/state/session/history/navigation or design-source ownership.
- First Use canonical parity/provenance PR #564 final developer-authored head `cc4818365de1c170a5c72ac99c274e8cad10dc77` passed full immutable-head CI #3697 / run `31977516977`.
- PR #564 squash merge: `399a9b1df9104318d64106346ab797a6d3e437e0`.
- Exact-main evidence CI #3698 / run `31978069651` passed completely on `399a9b1df9104318d64106346ab797a6d3e437e0`, including both UI shards, Visual regression, accessibility, performance, CSP/service-worker, backend and container builds.
- Issue #563 is closed completed. PR #564 is test/evidence-only, so it did not require a Stage redeploy after merge.
- Parent Issue #18 remains open in live GitHub and requires a separate acceptance audit; completion is not inferred from previously delivered child slices.
- Issue #568 remains open. Draft PR #570 is the authoritative evidence-bearing 768×1024 Light/Dark audit path and must be reconstructed again on delivered runtime `e9314e08cfb517388b8427dcc5ba74df69c861f7` before any consolidated fingerprints can be approved.
- Draft PR #569 remains a parallel structural-only tablet matrix. Reconcile/close the duplicate path only after confirming it contributes no unique acceptance coverage; do not merge competing tablet evidence owners.
- Live GitHub and live source are authoritative for current branch heads, open work, ownership, review state and CI. This file records immutable delivery SHAs rather than a self-referential `current main` value.

## Delivery contract

- One PR contains one atomic product/tooling/reconciliation slice.
- Product changes require repository-owned frontend/backend/browser/accessibility/performance/container gates selected by scope.
- Product delivery requires immutable-head PR CI, clean review audit, expected-head squash merge, exact-main validation and Stage/public validation when runtime changed.
- Pure Agent Docs changes use the fail-closed lightweight classifier; public README/architecture synchronization is not classified as pure Agent Docs and receives normal documentation CI.
- Design-source/tooling changes require deterministic source identities, immutable-head design acceptance, clean review audit and exact-main design validation.
- A controlled same-head CI retry may classify an unrelated pre-existing browser flake, but product code must not be changed without a reproduced product defect.
- Linux visual hashes are approval records: inspect the exact Linux artifact first, then commit only reviewed fingerprints.
- If an evidence-only audit exposes a runtime defect, repair the runtime in a separate atomic PR, validate/deploy it, then reconstruct the evidence branch on the corrected runtime base instead of restoring stale fingerprints.

## Production ownership foundations

- `LexigoBootstrappedApp` owns session restoration, refresh coordination, account runtime and dynamic route-entry selection.
- Guest `/` is owned by `LexigoGuestHomeApp`; it does not request or fabricate authenticated progress/account/scheduler state.
- Authenticated `/` is owned by `LexigoHomeApp`.
- Authenticated `/onboarding` is owned by `LexigoOnboardingApp`; the canonical App Router route is `frontend/app/onboarding/page.tsx`.
- `LexigoLearnApp` owns `/learn`; `LexigoActiveLessonApp` owns `/lesson/active`.
- `LexigoDictionaryApp` owns `/dictionary` and `/words/[id]`; `LexigoPhrasesApp` owns `/phrases` and `/phrases/[slug]`.
- `LexigoProgressApp` owns `/progress`; authenticated `LexigoProfileApp` owns the Profile summary/preferences surface.
- `LexigoScenarioCatalogApp` and `LexigoScenarioApp` own `/scenarios` and `/scenarios/[slug]`.
- `RouteChrome` remains the sole owner of ordinary primary route navigation outside focused routes; Guest Home and onboarding suppress ordinary route chrome through their scoped First Use contract.
- `ReviewOutboxRuntime` owns the durable review queue and global connectivity actions.
- `LexigoPremiumApp` remains a narrow compatibility fallback; it does not own the extracted Guest Home, Onboarding, Phrases or Active Lesson routes.
- Guest catalog content and authenticated scheduler/progress state remain separate security boundaries.

## First Use runtime

- Issue #201 / PR #558 established the First Use route/state contract and was delivered on merge `50f7256c8ce6a11a772030c2d2d170e6edf82a2a`, exact-main CI #3668 and Stage #3519.
- Guest Home is truthful and independent of authenticated progress/account APIs.
- `Настроить первый урок` uses the existing authentication flow with strict internal `return_to=/onboarding`; arbitrary external/unknown return targets remain rejected.
- `/onboarding` is a real App Router route and does not mount a client island over the Next not-found subtree.
- Existing backend #18 onboarding contract remains `status/start/mark/complete/skip` with server states `not_started / in_progress / completed / skipped`.
- Diagnostic marks remain `known / unsure / new`; answer/reveal data appears only after successful mark mutation.
- `in_progress` resumes after reload/direct entry from server status; no local browser storage source of truth was added.
- Skip and complete remain distinct transitions and return safely into the learning flow.
- Loading, API error, retry and recovery states remain covered.
- First Use routes run as focused route owners without ordinary route chrome.
- Accessibility source fixes include Light contrast, real progressbar semantics and removal of the competing server 404 DOM subtree; axe rules/severity are not weakened.
- Browser-history protection waits for the destination semantic owner before Back/Forward rather than treating pathname change alone as completion.

## First Use desktop parity repair / Issue #565

- The route-level parity audit reproduced a real desktop diagnostic presentation defect: compact-oriented progress/title/nested-card composition was reused on desktop instead of the approved intro + single diagnostic surface hierarchy.
- Issue #565 / PR #566 fixed only the authenticated desktop diagnostic presentation.
- Desktop now uses the approved step/title/body intro and one diagnostic surface without duplicated interactive controls.
- The progressbar remains semantically available while its desktop visual track is removed from the design surface.
- Server-owned `DiagnosticPrompt.topic` remains truthful dynamic content; the OpenPencil demo sentence is not fabricated because the API has no sentence field.
- Compact/mobile presentation, onboarding mutations and session/history/storage ownership remain unchanged.
- PR #566 passed final CI #3692, exact-main CI #3693 and exact-SHA Stage #3545.

## First Use canonical OpenPencil parity / Issue #563

- PR #564 binds each First Use visual baseline to an active OpenPencil screen-map key, exact node, route and canonical viewport.
- Compact canonical evidence remains 390×844; desktop canonical design evidence is 1440×900. 1440×1024 remains a separate responsive/runtime audit viewport and is not mislabeled as the OpenPencil parity frame.
- Diagnostic Resume canonical evidence locally selects `Не уверен` before capture without fabricating server state.
- Exact Linux review artifact before final hash approval: artifact ID `9271382750`, digest `sha256:0ffef81c3306dc08a2c11fe7b1e042d8f5b6a8b241039a5094514b088a40f3cc`.
- Reviewed canonical desktop fingerprints:
  - Guest Home Light / `n321`: `1675a56bf2a31716b6ce7c8dc52bffed9f42190e9743ae88a7c411b59046da79`.
  - Guest Home Dark / `n493`: `a60bd586f61bf9ecc71bc9f28e8e549593361d2ae3badb8b60faa73c37050063`.
  - Diagnostic Resume Light / `n378`: `4da3f3589f396a164a05677dfe545167c1647521afde6b206048d7cd4142eae2`.
  - Diagnostic Resume Dark / `n550`: `abe2f9c7c180accf73bb6e7771845a85610a89cdee42e170d12787acc4c62e80`.
- Final immutable-head CI #3697 reproduced the manually approved hashes; exact-main CI #3698 also passed Visual regression.
- Intentional runtime-truth differences are not hidden by fixtures: authenticated runtime does not render guest login; server-owned topic is shown instead of unavailable demo sentence content; accessibility-safe runtime tokens are not changed by an evidence PR.

## Confirmed First Use delivery lessons

- A persistent client route predicate does not create a valid Next App Router route. A focused client island needs its canonical `app/**/page.tsx`; otherwise client content can render over a not-found subtree, producing duplicate landmarks and pointer interception.
- Global role assertions must be scoped to the owning product surface when the framework legitimately owns route-announcer semantics.
- Browser history tests must wait for the destination semantic owner, not only the pathname.
- Evidence-only parity work must not become hidden redesign: functional defects are split into separate runtime Issues/PRs, then evidence is reconstructed on the repaired base.
- Canonical viewport changes require fresh deterministic Linux evidence even when an older runtime fingerprint was already reviewed.

## Tablet 768×1024 runtime repair / Issue #571

- Issue #568 / Draft PR #570 first ran the consolidated 10-route Light/Dark tablet audit on head `8b656e7c05fac830a343ec1bf88aea9be0bfe148`.
- CI #3704 / run `31979268275` produced exact Linux visual artifact `9271989171`, digest `sha256:2e6dd3d9f51fcd7e787865b8f61e7b9f27373ad841e85fd327f663a51d6f0aae`.
- All 20 audit states passed route owner/navigation/overflow/runtime-error contracts before the intentional review hash gate; manual review blocked `/learn`, `/phrases` and `/profile` in both themes as genuine runtime defects.
- Learn root cause: desktop outer `1fr + 360px` composer survived at 768 while the fixed tablet rail reduced effective content width.
- Phrases root cause: fixed `250px + 1fr` catalog workspace survived at 768 and squeezed result cards.
- Profile root cause: route-specific centered `.lx-main-content` margin overrode the shared RouteChrome tablet rail offset.
- Issue #571 / PR #572 repaired only those presentation ownership failures. Backend/API/state, route components, OpenPencil/Figma sources and RouteChrome breakpoint topology were not changed.
- Reviewed Learn replacement evidence came from CI #3707 / run `31980303255`, artifact `9272219823`, digest `sha256:b734f7374bbde5ebc0f04d3a88b04930a575119228b0cbcade28e82969f65575`: `768×1990`, SHA-256 `9fcb944e8be1cdd3ef56e52e28dc233e86acec3b6d9c383f4b1de723860b51b4`.
- Reviewed Phrases/Profile evidence came from CI #3711 / run `31980866589`, artifact `9272371938`, digest `sha256:a8b6a2b92af4048608084c9563e719c1334d3d6f64b103d23b8cf41901941897`:
  - Phrases Light `768×1593`: `16c8efb17d7c599d425266d9c4e5457d9ac2b02756a677e0246c8aaf6fe8643`.
  - Phrases Dark `768×1593`: `c1a0ee9a5e970743b1d7ce149ffe44cfdef13f9cec481a34ddbcf2cc1b345663`.
  - Profile Light `768×4229`: `b73fa564476dc1458c5096e02aac76667271df87e5fba8ce58e0f0fa7f111042`.
  - Profile Dark `768×4229`: `d3975453cc920c779d363ffe7fd791f1e4fb10e306cf7cead870c8baefc8be6e`.
- Final immutable-head CI #3714 / run `31981364030` passed on head `5d16da5bcc282442540f6f4c04c3c697ba63a285` with all reviewed fingerprints.
- PR #572 squash merge `7ae4e2607e1434023be12c793875756f383b446f`; exact-main CI #3715 / run `31981958042` and exact-SHA Stage #3567 / run `31982483549` both passed.
- The full #568 acceptance was not closed by this repair; the next reconstruction subsequently exposed the independent Home spacing defect delivered by #574/#575.

## Tablet Home progress spacing repair / Issue #574

- Reconstructed #568 / Draft PR #570 on post-#572 reconciliation base `580300373bfad88eed5bbaf7b024d004837058fa` exposed a real authenticated Home defect at `768×1024`: progress label/value siblings visually concatenated because compact row flex ownership ended at 760px.
- Issue #574 / PR #575 added only Home-scoped `761px–1023px` row layout ownership plus a strict content-addressed Home medium regression; Home markup, progress data/API/state, compact behavior, desktop behavior and design source were unchanged.
- First immutable CI #3727 / run `32006161343` found one stale synthetic 760px fixture that omitted compact selector `.lx-home-next-action`; commit `495c7681a8c2e85ee6b5c454e40b84006faadeb0` repaired only that fixture and did not alter runtime CSS.
- CI #3728 / run `32006920077` on exact head `495c7681a8c2e85ee6b5c454e40b84006faadeb0` passed the boundary contract and failed Visual only at the deliberate `REVIEW_REQUIRED` hashes.
- Exact manually reviewed Linux Visual artifact: `9280469563`, digest `sha256:abac6b119734b77795ec3d0838afb092405dc9f12568ac892e213288df233847`.
- Reviewed Home strict fingerprints:
  - Light `768×1105`: `08d213c5fa280702abadc675476e8f4197c100ffd9011eb0d5a7f5772bab9d8e`.
  - Dark `768×1105`: `d2ca7909b3a0f3480f28af24f9d734f0c641cc5f1ebc174108a408cbefb40bbc`.
- Retry captures reproduced the same dimensions and hashes; manual review confirmed visible label/value separation and no horizontal clipping/overflow or unrelated Home visual regression.
- The legacy fuzzy `home-visual-medium-linux.png` still contains the old localized defect and was intentionally not replaced because its broad pixel-diff tolerance did not emit an exact replacement actual. The new strict content-addressed contract is the #574 approval owner.
- Final developer head `37c209d5ceadeb153db17f0cc4a815536a5b6605` passed full immutable CI #3729 / run `32024776340` after a controlled same-head retry classified an unrelated pre-existing new-tab test flake.
- PR #575 squash merge `e9314e08cfb517388b8427dcc5ba74df69c861f7`; exact-main CI #3730 / run `32026831779` passed.
- Exact-SHA Stage #3583 / run `32027587186` deployed web/API images tagged `e9314e08cfb517388b8427dcc5ba74df69c861f7`, public smoke passed and public Chromium/iOS WebKit verification passed 12/12.
- Issue #568 remains open. PR #570 must now be reconstructed on `e9314e08…`, recapture all 20 Light/Dark states and receive direct Linux PNG review before any consolidated hash approval.

## AI-native design source-of-truth status

- ZSeven OpenPencil v0.8.2 remains the day-to-day AI-first design editor; native Figma is retained as archived provenance/reference.
- Active design path: `design/openpencil/LexiGo Design System.op`.
- Reviewed active SHA-256: `6d73b785aaeb7dda35a53c9c5f16edfc9cbef1092dbce992183538f16505520e`; reviewed size `6,937,300` bytes.
- Active token/provenance path: `design/openpencil/LexiGo Design Tokens.json`, SHA-256 `e603d86f3d4ef470c39fd72c31433e6a124bb9371da6f333567cd3aa796ae05c`.
- Canonical imported/OpenPencil-native production mapping: `docs/figma/openpencil-screen-map.json`.
- PR #556 delivered the approved 40-state First Use design matrix before runtime implementation.
- Runtime PRs #558/#566/#572/#575 did not modify backend schema, OpenPencil/Figma sources or deploy topology.

## Completed executable route/design milestones

- Home parity: Issue #522 / PR #523.
- Learn Composer parity: Issue #525 / PR #526.
- Active Lesson parity: Issue #528 / PR #529.
- Progress parity: Issue #515 / PR #517.
- Dictionary parity: Issue #531 / PR #532.
- Word Detail parity: Issue #533 / PR #535.
- Phrases catalog/detail parity: Issues #536/#540 / PRs #538/#541.
- Profile parity: Issue #542 / PR #543.
- System State Dictionary Empty renderer-equivalent: Issue #545 / PR #546.
- Native Figma archive: Issue #487 / PR #547.
- Deterministic ZSeven import: Issue #550 / PR #551.
- OpenPencil active source promotion: Issue #552 / PR #553.
- Optional standalone OpenPencil fallback: Issue #554 / PR #555.
- First Use design gate: Issue #201 / PR #556.
- First Use runtime: Issue #201 / PR #558 / merge `50f7256c8ce6a11a772030c2d2d170e6edf82a2a` / exact-main CI #3668 / Stage #3519.
- First Use post-merge reconciliation: PR #559 / merge `b33eb3697527276ad2a3aa4b3ac52d47f71b0bab` / exact-main reconciliation CI #3671.
- Issue #18 selection-reason transparency: PR #561 / merge `faa62cc2ea023d8e52aecc5d97c8cabe97748daf` / exact-main CI #3678 / exact-SHA Stage/public browser success.
- First Use desktop parity repair: Issue #565 / PR #566 / merge `263fe7457d741d184885810a779ee7d3b79593ab` / PR CI #3692 / exact-main CI #3693 / Stage #3545.
- First Use canonical route-level parity/provenance: Issue #563 / PR #564 / merge `399a9b1df9104318d64106346ab797a6d3e437e0` / PR CI #3697 / exact-main CI #3698.
- Tablet Learn/Phrases/Profile runtime repair: Issue #571 / PR #572 / merge `7ae4e2607e1434023be12c793875756f383b446f` / PR CI #3714 / exact-main CI #3715 / Stage #3567.
- Tablet Home progress spacing repair: Issue #574 / PR #575 / merge `e9314e08cfb517388b8427dcc5ba74df69c861f7` / PR CI #3729 / exact-main CI #3730 / Stage #3583.

Canonical appearance invariants remain Light `#f4f7f5` and Dark `#10211d`.

## Current state

- Latest deployed runtime is PR #575 on merge SHA `e9314e08cfb517388b8427dcc5ba74df69c861f7`; exact-main CI #3730 and exact-SHA Stage/public validation #3583 are green on that exact SHA.
- The latest completed evidence-only route parity merge remains PR #564 on `399a9b1df9104318d64106346ab797a6d3e437e0`; its canonical First Use evidence remains valid because #575 changed only authenticated Home medium progress-row CSS/test ownership.
- Route-specific Figma/OpenPencil parity child slices are delivered for Home, Learn, Active Lesson, Progress, Dictionary, Word Detail, Phrases, Profile and First Use.
- Parent Issue #18 remains open and requires a separate acceptance audit before any closure decision.
- Live umbrella #205 remains open. The active automated gap is Issue #568: reconstruct the consolidated medium/tablet 768×1024 Light/Dark matrix on corrected runtime `e9314e08…` and approve all 20 states only after exact Linux review.
- Draft PR #570 carries the authoritative fail-closed visual audit path but its current head `7f6efef0d3832e095900b571708f7788760d76e5` predates #575 and must be reconstructed rather than merged with stale fingerprints.
- Draft PR #569 remains a parallel structural-only matrix; resolve duplication before any merge so #205 has one authoritative consolidated tablet evidence path.
- Remaining #205 acceptance after tablet includes minimum supported mobile width, desktop runtime 1440×1024, 200% text zoom/reflow, reduced motion, keyboard-only, loading/empty/error/offline where applicable, direct entry/reload/Back-Forward, final Stage/browser and manual audit evidence.
- #203 remains optional historical/native-Figma synchronization because OpenPencil is the active production design source and native Figma is archival provenance.
- #65/#461 physical-device reduced-motion/accessibility sign-off remains separate from automated design-parity work.
- No runtime/backend/API/design/deploy change is part of the current Agent Docs reconciliation slice.
- After this reconciliation resets `.agents/current/**`, the next atomic design-focused task is Issue #568 / Draft PR #570 reconstruction on `e9314e08…`; do not claim umbrella #205 completion prematurely.

## Remaining roadmap

- #568/#570 under #205: reconstruct the 10-route 768×1024 Light/Dark audit on `e9314e08…`, rerun exact Linux visual evidence, manually review all 20 states, approve only reviewed fingerprints, full immutable-head CI, merge and exact-main CI. Reconcile/close duplicate structural PR #569 only after confirming it contributes no unique acceptance coverage.
- #205 after tablet: continue the final consolidated matrix with minimum mobile, 1440×1024 runtime, 200% zoom/reflow, keyboard, reduced motion, system states and history/direct-entry evidence.
- #18: audit remaining parent acceptance criteria; do not infer completion from child slices.
- #203: optional historical/native-Figma Screen Map/archive synchronization when access is available.
- #508: physical iOS/iPadOS, Android and desktop PWA install/icon/splash/cold-start sign-off.
- #25: continue user-facing pronunciation/custom-vocabulary presentation only from verified design evidence.
- #78: complete remaining CSP/security-header enforcement through authorized staged rollout.
- #65/#461: reduced-motion and physical-device accessibility sign-off remain separate.
- #133: moderated usability validation after core routes and final visual parity are ready.
- #70: continue compatibility cleanup only with route reachability, bundle, browser and Linux visual evidence.

## Evidence corrections retained

- Issue #485 / PR #486 delivered authenticated backend custom vocabulary, not browser-local vocabulary. Merge: `53e16a00e2bbe70921c1c5220923faee1f63bc37`.
- Issue #489 / PR #494 delivered authenticated backend glossary portability, not browser-local codecs. Merge: `0d536a79a216043acb37e1f628c081cab16d24d9`.
- Issue #497 / PR #498 delivered the local recorder platform. Merge: `810fa59a748477f8723a19dee03e61517282df30`.