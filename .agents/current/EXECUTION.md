# Current Task Execution

## Task

- Branch: fix/first-use-desktop-parity
- Base SHA: ad404b84cd26f063fa189abac3fd4a8ca10ab4e6
- Head SHA: resolve from live branch ref
- PR: #566

## Skills used

### GitHub repository engineering

Purpose:

Safely isolate Issue #565 from the ongoing #563 parity audit, preserve branch/main invariants and deliver one atomic desktop First Use runtime presentation repair.

Instruction source:

- `AGENTS.md`
- `.agents/AGENTS.md`
- `.agents/AGENTS.base.md`
- applicable specialized `.agents/AGENTS.*` rules
- `.agents/SKILLS.md`
- `docs/agent-harness.md`
- connected GitHub plugin skill

Version or verification date:

2026-08-17 live repository verification.

Inputs:

- Issue #563 / Draft PR #564 exact CI and Linux artifact evidence.
- Issue #201 and PR #558 delivered First Use contract.
- Active OpenPencil source and screen map.
- Live `main` and Stage status.
- PR #566 CI #3687/#3688 results and exact Linux visual artifact.

Files inspected:

- `frontend/components/lexigo-onboarding-app.tsx`
- `frontend/lib/onboarding.ts`
- `frontend/app/first-use.css`
- `frontend/components/first-use-route-contract.test.ts`
- `frontend/e2e/first-use-visual.spec.ts`
- `design/openpencil/LexiGo Design System.op` (read-only)
- `docs/figma/openpencil-screen-map.json` (read-only)
- repository Agent Harness sources

Actions performed:

- Classified #564 visual failure as a reproduced runtime desktop presentation defect after correcting the audit fixture state.
- Created separate Issue #565 because #563 forbids folding functional runtime repair into the parity/provenance audit PR.
- Created `fix/first-use-desktop-parity` from exact `main` and Draft PR #566.
- Defined allowed/prohibited paths and state/API/accessibility invariants before runtime writes.
- Implemented a `min-width: 720px` desktop diagnostic presentation boundary while leaving compact/mobile base behavior intact.
- Added the desktop step/title/body intro and converted the runtime diagnostic UI to one visual surface without duplicating interactive controls.
- Kept the diagnostic progressbar semantic but visually hidden on desktop.
- Preserved server-owned `topic`; explicitly refused to hardcode the OpenPencil demo sentence because the API does not provide it.
- Strengthened `first-use-route-contract.test.ts` to fail closed if the desktop hierarchy regresses or demo fixture content leaks into runtime.
- Diagnosed CI #3687 source-contract failure as a test assertion mismatch, corrected only the assertion and did not change runtime behavior.
- Let CI #3688 produce new Linux screenshots with the old fingerprints still active.
- Manually compared Linux Light/Dark Resume PNGs to OpenPencil `n378/n550` before approving any hash.
- Approved only the two changed Resume legacy fingerprints; Guest/compact/unrelated fingerprints remained untouched.

Commands or procedures:

Connector-first live GitHub inspection, exact-head CI/job/log/artifact analysis, OpenPencil source/mapping inspection, source-contract inspection, branch-isolated GitHub writes, artifact download/extraction and manual PNG review.

Artifacts produced:

- Issue #565.
- Draft PR #566.
- CI #3688 visual artifact ID `9270548108`, digest `sha256:47025250f8aaeb6eb2c49fb530d58d31d6b64a2c7f73bf834519bc6361e22342`.
- Reviewed Resume Light fingerprint `320524d4c4fe03f5bd086bac871957854f31f08f3b4e7a00d05071a1a627e466`.
- Reviewed Resume Dark fingerprint `6827f78bb2f4beb3304b0b939ebaa5a19d4577c9f68fd406525ba4b67525b545`.
- Current task evidence in `.agents/current/**`.

Result:

The desktop diagnostic structural defect is repaired in the feature branch without backend/API/design/state-machine changes. The reviewed Linux runtime now follows the approved intro + single-surface hierarchy. Remaining differences are deliberate data/auth/fixture boundaries, not hidden through snapshot updates.

Failures:

- CI #3687: newly added source contract asserted an incomplete exact `className`; lint/typecheck were green. Fixed the test assertion to include the existing `lx-first-use-kicker` class.
- CI #3688: Visual regression failed only the two expected changed Resume hashes while unrelated visual evidence remained stable. This was the intended fail-closed review gate and supplied the exact Linux PNGs/hashes.

Root cause:

Desktop diagnostic presentation reused the compact single-panel/nested-card layout instead of the approved desktop intro + single diagnostic surface hierarchy. The original deterministic runtime hashes did not prove canonical route-level OpenPencil structural parity.

Fallback:

Revert the #565 presentation slice only. Do not change onboarding API/state semantics, weaken the source contract, copy design-only demo data into production, or mass-update visual baselines.

Limitations:

- Production API exposes `topic` but not the OpenPencil demo example sentence, so exact content parity intentionally uses truthful server data.
- PR #566 legacy visual fixture remains 1440×1024 and pre-selection; the separate #564 audit owns canonical 1440×900 provenance and the corrected locally selected `Не уверен` Resume state.
- The design fixture shows guest `Войти`; authenticated runtime intentionally keeps authenticated header semantics.

Reusable lesson:

When a responsive runtime shares one state owner across compact and desktop but design composition differs materially, preserve interaction/state ownership and isolate only the presentation hierarchy at an explicit breakpoint. Content-addressed visual tests must fail closed first; approve only exact Linux artifacts after manual comparison and only for the states actually changed.
