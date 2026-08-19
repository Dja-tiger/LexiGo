# Issue #601 delivery reconciliation

Verified on 2026-08-19.

## Product delivery

- Parent visual-parity umbrella: Issue #205.
- Issue: #601 — consolidated true browser-owned 200% zoom matrix for ten canonical routes.
- Product PR: #602.
- Final developer-authored PR head: `301c68ac2e9fe16494e6ed07dfabfb378bc09e02`.
- Final PR tree: `470afd15c1485d6aae8a631577dcfd638600137f`.
- Immutable-head CI: #3848 / run `32227193079` — `success`.
- Squash merge / delivered `main`: `0c296858fa6ed72ed011784e866676eac432c3ce`.
- Delivered main tree: `470afd15c1485d6aae8a631577dcfd638600137f`, byte-identical to the fully validated final PR tree.
- Issue #601 is closed completed.
- No Stage redeploy is required: the delivered slice changes only tests/evidence/Agent Docs and contains no runtime-bearing frontend, backend, deploy, workflow or design-source mutation.

## Exact-main CI observability

The repository CI workflow is configured for both `pull_request` and `push` to `main`, so the squash merge is eligible for an exact-main push run. The connected GitHub `fetch_commit_workflow_runs` wrapper intentionally returns only pull-request-triggered runs and therefore cannot enumerate the push-triggered run for merge SHA `0c296858fa6ed72ed011784e866676eac432c3ce`.

No run ID or success state is invented here. The exact delivered main tree SHA `470afd15c1485d6aae8a631577dcfd638600137f` is identical to the final developer-head tree that passed full immutable-head CI #3848 / run `32227193079`, including backend integration/security, frontend core, Accessibility, Visual regression, iOS PWA Dictionary, Controlled Service Worker, Lesson Completion, Content Security, Performance Budgets, both UI shards, Dictionary smoke, frontend quality aggregation and both container builds. A later repository-native reconciliation may append the exact push-run ID when an Actions run-list surface is available.

## Corrected browser-zoom evidence

- Evidence-producing head before fingerprint approval: `d04e2bacbb0d5f3ad2b7bc83dd1a251f481e8b20`.
- Diagnostic CI: #3845 / run `32224361667`.
- Exact Linux Visual artifact: `9355233690`.
- Artifact digest: `sha256:3106254cdd3923dc97d7e58cd0d4edf7e6a868f80c78a6a6f55e238a95f763af`.
- Source viewport: `1440×900`.
- True browser-owned zoom factor: `2.0`.
- Effective CSS layout width: exactly `720px`.
- Authoritative capture owner: CDP `Page.getLayoutMetrics` + `Page.captureScreenshot`, with CSS→DIP conversion through `cssVisualViewport.zoom` and output normalization using `scale: 1 / zoom`.
- All 20 route/theme PNGs were manually inspected before approval and their exact width/height/SHA-256 fingerprints were pinned with immutable run/head provenance.
- The final Visual gate on CI #3848 reproduced the approved fingerprints without `REVIEW_REQUIRED`, tolerance widening, snapshot-update mode or disabled assertions.

## Durable audit contract

The consolidated owner covers Home, Learn, Active Lesson, Progress, Dictionary, Word Detail, Phrases, Phrase Detail, Profile and Onboarding in explicit Light and Dark. It proves the real browser zoom factor with CDP/DOM metrics, exact `720px` reflow, canonical route ownership, exact ordinary/focused RouteChrome ownership, document/main/route/global/interactive/text-range containment, keyboard-visible focus evidence, reduced motion and clean runtime-error capture.

The consolidated 1440×900 owner is intentionally collected only by `visual-desktop`. `visual-compact` and `visual-medium` exclude it because their project-level viewports are not the canonical source geometry for this contract; the source-level collection test protects that boundary fail-closed.

## Historical defect reconciliation

- Issue #604 (Active Lesson clipping) is closed `not_planned`.
- Issue #605 (Onboarding clipping) is closed `not_planned`.
- Both reports were based on historical Playwright `fullPage` browser-zoom captures whose coordinate contract was invalidated by Issue #603.
- Corrected CDP full-width evidence does not reproduce either focused-route clipping defect, and the structural containment/runtime assertions pass before capture. No runtime repair is warranted from the obsolete evidence.

## Remaining #205 work

Issue #601 closes only the consolidated 200% browser-zoom/reflow dimension. Remaining umbrella work must be selected from live GitHub state and may include consolidated reduced-motion sign-off, consolidated keyboard/focus sign-off, applicable system-state evidence, and route-history/manual Stage reconciliation unless existing executable coverage proves a dimension complete.

## Harness reset

This reconciliation branch resets `.agents/current/TASK.md`, `.agents/current/PROGRESS.md` and `.agents/current/EXECUTION.md` byte-for-byte to the canonical template contents before the next product slice starts.

`PROJECT_STATE.md` is intentionally not destructively rewritten through a truncated connector response. This dedicated reconciliation record preserves verified delivery evidence without risking loss of historical state; repository-native tooling can promote it into `PROJECT_STATE.md` when byte-preserving full-file access is available.
