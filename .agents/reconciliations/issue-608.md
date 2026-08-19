# Issue #608 delivery reconciliation

Verified on 2026-08-19.

## Product delivery

- Parent visual/accessibility parity umbrella: Issue #205.
- Issue: #608 — consolidated keyboard/focus matrix for ten canonical routes.
- Product PR: #609.
- Final developer-authored PR head: `161a6f18b99239355160c4a9c316ae2988df90c1`.
- Final PR tree: `3e766266790c70aac16e7807c7e195435db3991f`.
- Immutable-head CI: #3855 / run `32244412833`, attempt 1 — `success`.
- Squash merge / delivered `main`: `7b067478d9bdbb8706d110a52cf6ecc341c16730`.
- Delivered main tree: `3e766266790c70aac16e7807c7e195435db3991f`, byte-identical to the fully validated final PR tree.
- Issue #608 is closed completed.
- No Stage redeploy is required: the delivered slice changes only tests/evidence/Agent Docs and contains no runtime-bearing frontend, backend, deploy, workflow or design-source mutation.

## Exact-main CI observability

The repository CI workflow is configured for both `pull_request` and `push` to `main`, so the squash merge is eligible for an exact-main push run. The connected GitHub `fetch_commit_workflow_runs` wrapper intentionally returns only pull-request-triggered runs and therefore cannot enumerate the push-triggered run for merge SHA `7b067478d9bdbb8706d110a52cf6ecc341c16730`.

No run ID or success state is invented here. The exact delivered main tree SHA `3e766266790c70aac16e7807c7e195435db3991f` is identical to the final developer-head tree that passed full immutable-head CI #3855 / run `32244412833`, including backend integration/security, frontend core, Accessibility, Visual regression, iOS PWA Dictionary, Controlled Service Worker, Lesson Completion, Content Security, Performance Budgets, both UI shards, Dictionary smoke, frontend quality aggregation and both container builds.

## Keyboard/focus contract delivered

The consolidated owner covers Home, Learn, Active Lesson, Progress, Dictionary, Word Detail, Phrases, Phrase Detail, Profile and Onboarding across explicit compact `390×844` and desktop `1440×1024` viewports in Light and Dark.

It proves real sequential `Tab` / `Shift+Tab` reachability rather than `.focus()`-only evidence, rendered/enabled/non-inert/non-`aria-hidden` ownership, `:focus-visible`, painted focus indication, inline focus-ring containment, clipping-ancestor safety, RouteChrome obstruction safety, positive-tabindex absence, ordinary/focused RouteChrome ownership and clean runtime-error capture. Structured JSON focus traces are attached by the Playwright owner.

The consolidated traversal is intentionally deterministic in desktop Chromium while the existing specialized cross-browser keyboard/axe owners remain authoritative for engine/platform diversity.

## Diagnostic CI reconciliation

Diagnostic CI #3853 / run `32229895571` on head `7edea4fc3095408537ff8a6a4acb4714532079ef` passed the new Issue #608 Accessibility owner but initially failed only a pre-existing Issue #74 calendar reminder 320px / 200% reflow case in iOS WebKit.

Artifact `frontend-playwright-report-ui-2`, ID `9357114659`, digest `sha256:c3747f03658c5ae474a81425a02f9c36fd6b359ddf66752a8cdf80de8b9b9d2a`, proved the closed reminder preview already had `display:none` with zero geometry. The trace instead showed the hosting Home route changing from loading/`aria-busy` state to final progress/streak content during the whole-document overflow evaluation. A same-head rerun passed without code changes, and the fresh final CI #3855 passed UI shard 2 on its first attempt.

This timing-dependent test-synchronization defect is tracked separately by Issue #610. Its acceptance contract explicitly forbids widening the existing horizontal-overflow tolerance or hiding a genuine runtime defect.

## Review and merge evidence

- Final compare against `main@2412dce6a0cbb71c9a781829c09416e531efc502`: `behind_by=0`.
- Final diff: exactly six allowed test/evidence/Agent Harness paths; no runtime-bearing files.
- Review submissions before merge: none.
- Inline review threads before merge: none.
- PR #609 was promoted from Draft only after final immutable-head CI success.
- Squash merge used expected-head protection for `161a6f18b99239355160c4a9c316ae2988df90c1`.

## Remaining work

- Issue #610: stabilize the existing 320px / 200% calendar reflow gate against the Home async transition without weakening geometry assertions.
- Umbrella #205 retains any still-open dimensions such as consolidated reduced-motion/system-state evidence, route-history/manual Stage reconciliation and physical-device sign-off unless live executable coverage proves them complete.
- Physical-device/system assistive-technology sign-off remains manual Issue #461.

## Harness reset

This reconciliation branch resets `.agents/current/TASK.md`, `.agents/current/PROGRESS.md` and `.agents/current/EXECUTION.md` byte-for-byte to the canonical template contents before the next product slice starts.

`PROJECT_STATE.md` is intentionally not destructively rewritten through a potentially truncated connector response. This dedicated reconciliation record preserves verified delivery evidence without risking loss of historical state; repository-native tooling can promote it into `PROJECT_STATE.md` when byte-preserving full-file access is available.
