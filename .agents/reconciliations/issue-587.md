# Issue #587 delivery reconciliation

Verified: 2026-08-18

## Audit delivery

- Umbrella: #205.
- Audit issue: #587.
- Audit PR: #588.
- Fresh reconstruction base: `f920fee4891426fce819c9cb2fb506599b3bc1fc`.
- Diagnostic head: `092a578bcf04e3ab7d4bcb98038535797058b011`.
- Diagnostic CI: #3778 / run `32119608484`.
- Authoritative Visual artifact: #9318281585, digest `sha256:6066e9fc393afe1f1052cdf836d63a645df2e1f3b65d10972e9ab7da9094ac20`.
- All 20 320×700 Light/Dark states were manually reviewed after #589 and #590; initial/retry captures were byte-stable.
- Final developer head: `dd906ea6e7a52af094511da639504cb69ef18740`.
- Immutable-head CI: #3781 / run `32122062743`, success.
- Squash merge / main SHA: `d20b28ec3e4e0b94c650ed2dd0d8e3af747d9432`.
- Exact-main CI: run `32123078733`, success.
- Stage: run `32124009866`, exact image SHA `d20b28ec3e4e0b94c650ed2dd0d8e3af747d9432`; deploy, public smoke and public browser all succeeded; public browser matrix passed 12/12 Chromium+iOS WebKit tests.
- Issue #587 closed through the merged audit PR.

## Durable audit contract

- Ten canonical routes are covered at the minimum-supported 320×700 viewport in explicit Light and Dark.
- Before visual fingerprint comparison, the audit requires canonical route ownership, reduced motion, no legacy compatibility route owner, no horizontal overflow, no clipped route/main owner, no partially clipped rendered focusable controls and no runtime errors.
- Reviewed exact Linux fingerprints retain diagnostic source-run and source-head provenance.
- Existing 768×1024 and 1440×1024 route-parity contracts remain unchanged.

## Findings resolved before approval

- #589 fixed compact Learn explicit-Light heading contrast.
- #590 fixed minimum-width Phrase Detail duplicate inset ownership and readable width.
- The audit stayed fail-closed until both runtime defects were delivered and Stage-verified, then was reconstructed on corrected `main` before fingerprint approval.

## Reusable lesson

- Do not approve a responsive visual baseline while the audit still exposes a product defect.
- Deliver defects atomically, reconstruct the audit on corrected `main`, require structural/runtime assertions before exact PNG review, require byte-stable retries, and require final immutable-head reproduction.
- Scope classification must follow the actual workflow contract: because this audit changes `frontend/e2e/route-tablet-parity.spec.ts`, `agent_docs_only=false`, so the merged audit correctly required an exact-SHA Stage/public gate even though it did not alter application runtime code.

## Remaining work

- Continue umbrella #205.
- Current high-priority follow-up candidates include #593 (Profile Auto/system-Light theme ownership at 430px) and #583 (compact Reminder + Dictionary/Phrases geometry).

## Harness reset

- `.agents/current/TASK.md`, `.agents/current/PROGRESS.md`, and `.agents/current/EXECUTION.md` are reset byte-for-byte to the canonical empty-task forms in this reconciliation PR.
