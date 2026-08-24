# LexiGo Project State

## Verification

- Last verified: 2026-08-24 Europe/Berlin.
- Repository: `Dja-tiger/LexiGo`.
- Current verified `main`: `8b5478abf7cb8fd434f07acd038a1f6ff05ecbd9`.
- No open pull requests existed when this reconciliation slice started.
- Live GitHub and live source are authoritative for refs, Issues, PRs, CI, deployment and ownership. Historical delivery details remain in Git history and linked Issues/PRs.

## Latest completed runtime deliveries

### Issue #651 / PR #673 — process-aware progress analytics

- Issue #651 is **closed / completed**.
- Stage 6b consumes the immutable `review_events.session_kind` / `selection_reason` attribution delivered by Stage 6a instead of reconstructing Study / Review / Remediation from `answer_mode`.
- Progress exposes process evidence for `newLearned`, `dueReviewed`, `remediationReviewed`, `reviewBacklog`, `lapses` and Review retention while preserving legacy/null-attribution compatibility boundaries.
- Explicit Study activity cannot inflate Review retention/process lapse evidence; future-scheduled non-new items do not inflate Review backlog.
- Final developer head: `b1875396fc65a6c056a277be29d0cd1d97d8a084`.
- Full immutable-head CI #4115 / run `32702815388`: **success**.
- PR #673 squash merge: `db6a6480b06526a21819a2b93abc3fa832139d08`.

### Issue #650 / PR #674 — answer input remains editable after reveal

- Issue #650 is **closed / completed**.
- Recall answer reveal no longer makes the native answer input read-only. The learner can explicitly tap/click the textbox after reveal, regain focus and enter/edit text.
- Immutability remains intentional while review persistence is in flight, after a rating is persisted and while an offline review is queued.
- Regression protection is fail-closed: the browser owner is explicitly collected by `test:e2e:lesson`, and a source contract protects both the runtime condition and CI collection wiring.
- Final developer head: `37f3ffb8491bb55b285838d2edd45a993051dd26`.
- Full immutable-head CI #4119 / run `32713808811`: **success**, including frontend core, lesson E2E, both UI shards, accessibility, security, performance, visual regression and API/web container builds.
- PR #674 squash merge/current runtime main: `8b5478abf7cb8fd434f07acd038a1f6ff05ecbd9`.

## Stage / deployment

- Deployment status Issue #12 currently reports Stage **success** on exact image SHA `8b5478abf7cb8fd434f07acd038a1f6ff05ecbd9`.
- Stage run `32716003877`: deploy **success**, public smoke **success**, public browser **success**.
- The capacity preflight executed on the PostgreSQL-volume filesystem with ample free bytes/inodes; persistent volumes and running service containers were not deleted.
- PostgreSQL, Redis, API and web all became healthy on the intended image.

### Issue #659 — Stage PostgreSQL storage incident

- Issue #659 is **closed / completed**.
- Immutable diagnostics from PR #660 proved the historical PostgreSQL startup failure was host storage exhaustion: `postmaster.pid: No space left on device`; it was not an application-image regression or OOM.
- PR #661 added a bounded fail-closed capacity preflight/recovery path that distinguishes free bytes/inodes, preserves named persistent volumes and required deploy/rollback images, and avoids broad destructive prune/reset behavior.
- Current Stage/public evidence above proves the repaired deployment path is operating successfully on the latest runtime SHA.

## Design source of truth

- Active production design/handoff source: repository-owned OpenPencil, not Figma Cloud.
- Active document: `design/openpencil/LexiGo Design System.op`.
- Active tokens: `design/openpencil/LexiGo Design Tokens.json`.
- Route/state mapping: `docs/figma/openpencil-screen-map.json` plus `docs/figma/openpencil-production-handoff.json`.
- Historical Figma node IDs are archival provenance only unless a task explicitly proves otherwise from current repository contracts.

## Production ownership foundations

- `LexigoBootstrappedApp` owns session restoration, refresh coordination, account runtime and route-entry selection.
- Guest `/` is owned by `LexigoGuestHomeApp`; authenticated `/` by `LexigoHomeApp`.
- `LexigoOnboardingApp` owns `/onboarding`.
- `LexigoLearnApp` owns `/learn`; `LexigoActiveLessonApp` owns `/lesson/active`.
- `LexigoDictionaryApp` owns `/dictionary` and `/words/[id]`.
- `LexigoPhrasesApp` owns `/phrases` and `/phrases/[slug]`.
- `LexigoProgressApp` owns `/progress`; authenticated Profile is owned by `LexigoProfileApp`.
- `LexigoScenarioCatalogApp` / `LexigoScenarioApp` own scenario routes.
- `RouteChrome` owns ordinary primary route navigation outside focused routes.
- `ReviewOutboxRuntime` owns durable review queue/connectivity behavior.
- `LexigoPremiumApp` remains a narrow compatibility fallback; extracted canonical routes must not be reassigned to it.

## Open automated work verified at reconciliation

- Issue #641 is open High-priority automated QA work under parent #205. Its verified gap is executable system-state visual provenance: existing approved state fingerprints must be bound fail-closed to the active OpenPencil screen-map keys/nodes/routes/viewports instead of treating historical Figma IDs as the active source of truth.
- Issue #205 remains the visual-parity umbrella; do not repeat already delivered route/tablet/desktop/history work. Select only genuinely unproven dimensions from live evidence.
- Issue #654 remains Low-priority product-delight polish and is intentionally behind core learning/reliability/accessibility/parity work.
- Issue #12 remains the operational deployment-status tracker and is not a normal product backlog item.

## Delivery contract

- One PR contains one atomic product, tooling or reconciliation slice.
- Product changes require immutable-head PR CI, clean review audit, expected-head squash merge, exact-main validation and Stage/public validation when runtime changes.
- Pure Agent Docs reconciliation uses the fail-closed lightweight classifier and must not trigger a runtime Stage deployment.
- Design work uses OpenPencil production identities and repository-owned mapping; historical Figma provenance is reference-only.
- Controlled same-head reruns may classify proven infrastructure/browser flakes; product code is not changed without a reproduced product defect.
- Evidence-only audits do not silently redesign runtime. A reproduced product defect receives its own atomic Issue/PR.

## Next selection rule

After `.agents/current/**` is reset by the reconciliation PR, re-read live GitHub before creating another branch. Prefer the highest-priority automated engineering slice with an executable acceptance contract; at this verification point #641 is the next suitable High-priority candidate. If a new PR appears, finish/reconcile that PR first unless the user explicitly directs parallel work.
