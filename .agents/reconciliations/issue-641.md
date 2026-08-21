# Issue #641 shared system-state delivery reconciliation

Verified on 2026-08-21.

## Product delivery

- Umbrella visual-parity audit: Issue #205.
- Audit owner: Issue #641 — shared loading / empty / error / offline OpenPencil provenance.
- Issue #641 remains **open** because the audit discovered a separate First Use loading/error visual-evidence gap tracked by Issue #642.
- Product PR: #643 — `test(openpencil): bind system-state baselines to active source`.
- Final developer-authored PR head: `c08759bcc8be8c2138c566327e8b4d52afeb3cd5`.
- Immutable-head CI: #3956 / run `32473916412` — `success`.
- Squash merge / delivered `main`: `7e8e4be4b90d2c30d234ed5b9c7753cbc5451a01`.
- Delivered main tree: `9e301658bd7eed66322d0ce00f3399e768b7b281`.
- Exact-main CI: run `32476922424` — `success` on the exact merge SHA.
- The live deployment workflow classified this non-Agent-Docs test/evidence merge as deployable and automatically ran Stage; exact-SHA Stage run `32477776759` completed `success`, including deploy, public smoke and 12/12 public Chromium/iOS WebKit browser checks. This deployment was an operational consequence of the current workflow classification, not a runtime change requirement of PR #643.

## Delivered shared-state OpenPencil contract

PR #643 preserved all five previously approved exact Linux visual fingerprints and renderer-equivalent allow-lists while replacing active-Figma provenance semantics with repository-owned OpenPencil provenance:

- Home Loading: `state.home.loading.dark` → `fig_4258`, route `/`, 390×844; legacy Figma `79:69` remains archival provenance only.
- Dictionary Empty: `state.dictionary.empty.light` → `fig_4234`, route `/dictionary`, 390×844; legacy `79:93` archival only.
- Shared Error: `state.error.dark` → `fig_4222`, shared route ownership, 390×844; legacy `79:117` archival only.
- Desktop Offline: `state.offline.desktop.dark` → `fig_4104`, shared route ownership, 1440×1024; legacy `79:194` archival only.
- Active Lesson Recall Offline: `lesson.mobile.recall.offline` → `fig_3193`, route `/lesson/active`, 390×844; legacy `75:57` archival only.

`frontend/e2e/system-states-visual.spec.ts` now loads the active OpenPencil screen map in the authoritative Linux visual environment, fails closed on key/node/route/viewport drift, records an OpenPencil annotation and preserves the exact approved SHA contract. `frontend/components/system-state-openpencil-contract.test.ts` protects source wording, immutable fingerprint declarations, collection ownership and the separation of the First Use gap.

No runtime React/CSS, backend/API, design source, visual snapshot, dependency or workflow files changed in the delivered PR.

## First Use gap discovered by the audit

The audit proved that `/onboarding` has real reachable loading and recoverable-error runtime states and that the active OpenPencil source contains explicit canonical nodes for all mobile/desktop Light/Dark variants, but the existing authoritative `frontend/e2e/first-use-visual.spec.ts` does not yet approve those eight states.

That missing evidence is tracked by Issue #642 and must be delivered before Issue #641 can be closed as the final applicable system-state dimension under #205. PR #643 deliberately did not fabricate coverage or accept unknown hashes.

## Validation and failure classification

Two deterministic CI failures were corrected without weakening product or visual contracts:

- CI #3949 / run `32473173511`: the first Vitest source contract attempted to read `docs/figma/openpencil-screen-map.json` from the isolated frontend workspace, where repository docs are not copied.
- CI #3952 / run `32473507422`: the same filesystem-boundary assumption remained after an incomplete path fallback.
- Final architecture moved actual screen-map resolution into the Playwright visual owner, whose container mounts repository docs at `/repository/docs`; the Vitest source contract verifies code ownership/provenance without pretending the isolated frontend workspace contains repository docs.

The final immutable head then passed full CI #3956 without retry-based acceptance or assertion weakening.

## Delivery-process recovery

Task setup also recorded two incorrectly routed `create_pull_request(main→main)` calls while intending to create Issue #641. GitHub rejected both with HTTP 422 before repository mutation. Writes were stopped, protected `main` was re-read, the exact `create_issue` schema was loaded, and the task continued correctly.

A later stale-blob update attempt for `system-states-visual.spec.ts` was rejected by GitHub before mutation. The branch file was re-read and its live content was preserved rather than overwritten from stale state.

These failures reinforce the repository rule to match the exact tool schema before every write and to treat rejected writes as a reason to revalidate branch/main state.

## Remaining #205 work

- Issue #642: add exact Linux runtime visual evidence for eight First Use loading/error OpenPencil states.
- Issue #641 remains open until #642 is delivered and the applicability matrix is reconciled.
- Other #205 dimensions must continue to be selected from live GitHub rather than duplicated from already delivered children.

## Harness reset

This reconciliation branch resets `.agents/current/TASK.md`, `.agents/current/PROGRESS.md` and `.agents/current/EXECUTION.md` byte-for-byte to the canonical templates before Issue #642 starts.

`PROJECT_STATE.md` is intentionally not destructively rewritten through a potentially truncated full-file connector response. This dedicated reconciliation record preserves exact delivery evidence without risking loss of historical repository state.
