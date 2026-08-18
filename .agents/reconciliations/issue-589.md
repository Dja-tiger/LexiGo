# Issue #589 delivery reconciliation

Verified on 2026-08-18.

## Product delivery

- Parent audit: Issue #587 / Draft PR #588 under visual-parity umbrella #205.
- Issue: #589 — compact Learn heading contrast for explicit Light appearance.
- Product PR: #591.
- Final developer-authored PR head: `f99e8299d9bf2ed192f408c23315f99a4c6042bf`.
- Immutable-head CI: #3767 / run `32094373568` — `success`.
- Squash merge SHA: `fb357e4c322bbae6b016b4be8a7c59cc39094170`.
- Exact-main CI: #3768 / run `32094949165` — `success`.
- Exact-SHA Deploy Stage: #3623 / run `32095579429` — `success`.
- Stage deployed web/API image tag `fb357e4c322bbae6b016b4be8a7c59cc39094170`.
- Public frontend/API smoke passed on the first attempt.
- Public Chromium + iOS WebKit acceptance passed all 12 runtime checks.
- Issue #589 is closed completed.

## Durable runtime contract

The compact Learn heading foreground depends on both viewport and explicit user appearance. At `<=767px`, only `html[data-lexigo-appearance="light"]` uses the semantic dark heading foreground on the transparent Light canvas. Auto/default compact and explicit Dark compact retain the approved fixed `#f4f7f5` foreground on the dark hero. Tablet/desktop dark-hero foreground behavior remains unchanged.

`data-lexigo-resolved-appearance` is intentionally not the ownership boundary because Auto/default compact must preserve its approved dark-hero composition. Source and browser contracts protect this distinction.

## Reviewed visual evidence

- Corrected diagnostic CI: #3763 / run `32093144691`, developer head `928b0186a688545aadcd9b82d84e5940f79f0ab6`.
- Exact Linux artifact: `9309266622`, digest `sha256:1d8f7c5c423a8113d11599df4b647d60bc804e260019907ecebbad50a29c0656`.
- Old explicit-Light Home -> Learn frame: `390x1212`, SHA-256 `95e13c8164fea6ff0ba9ab0ae6032e4d01d4e9108d6fde79c3edef89fdff3169`; manual review proved the heading was effectively absent on the Light hero.
- Approved repaired explicit-Light frame: `390x1212`, SHA-256 `14732c934d4b91a89415174ccd01a9c1a9c4134c9b07c21229401c48bb544425`.
- Auto/default canonical Lesson Composer and explicit Dark fingerprints remained unchanged and reproduced in the final immutable-head Visual gate.

## Reusable lesson

Responsive presentation ownership must follow the effective surface and the explicit appearance owner rather than viewport alone. When a visual baseline has frozen the exact defect being repaired, broad snapshot replacement is prohibited: inspect exact old/new Linux evidence and re-approve only the isolated fingerprint proven to represent the intentional correction.

## Remaining work

Issue #590 owns the separate minimum-width Phrase Detail readable-width defect discovered by the same #587 audit. Draft PR #588 must be reconstructed on top of the repaired runtime after #590 is delivered; its original `320x700` evidence remains diagnostic and must not be accepted as final.

## Harness reset

This reconciliation branch resets `.agents/current/TASK.md`, `.agents/current/PROGRESS.md` and `.agents/current/EXECUTION.md` to the exact canonical template contents before the next product slice starts.

`PROJECT_STATE.md` is not destructively rewritten in this connector-only reconciliation because the live file is large and connector responses are truncated. This dedicated reconciliation record preserves the verified delivery evidence without risking loss of historical project state; a repository-native reconciliation can promote this block into `PROJECT_STATE.md` when byte-preserving full-file access is available.