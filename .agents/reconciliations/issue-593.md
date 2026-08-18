# Issue #593 delivery reconciliation

Verified: 2026-08-18

## Delivery

- Umbrella: #205.
- Issue: #593.
- Runtime PR: #597.
- Runtime delivery base: `f1cfa074ffe25db6e253b60b6b3c5970ba8dda03`.
- Reviewed evidence head: `03832a62e2bfe064cabce6dc81fe333e8af6dd80`.
- Diagnostic evidence CI: #3796 / run `32141138160`.
- Authoritative Linux WebKit artifact: #9326247705, digest `sha256:4d1c7ec484dc40c066316c0b9d8e87a2a6c2f115ce00adb55419323aac6faecc`.
- Reviewed Auto/system-Light evidence: 430×932, screenshot SHA-256 `2f0740a996c7198811e66dd77a8d5a845d4ca285d9a6f4350ae74e3635c98b35`.
- Final developer head: `d6addcde4985910319f01e7dd5df4daa2d7a690c`.
- Immutable-head CI: #3803 / run `32143278581`, success.
- Squash merge / main SHA: `db6a29e43ca1c1c6544ffe15186b195071d8982c`.
- Exact-main CI: run `32144523741`, success.
- Stage: run `32145590759`, exact image SHA `db6a29e43ca1c1c6544ffe15186b195071d8982c`; deploy, public smoke and public browser all succeeded; public browser matrix passed 12/12 Chromium+iOS WebKit tests.
- Issue #593 closed through PR #597.

## Durable contract

- Stored appearance (`data-lexigo-appearance`) and rendered appearance (`data-lexigo-resolved-appearance`) remain distinct ownership domains.
- Explicit Light/Dark document canvas ownership remains global; resolved Auto canvas ownership is scoped to `/profile`.
- Legacy Profile account/security compatibility paint follows resolved Light/Dark without broad global palette ownership or account/API changes.
- Profile legal-footer text follows the resolved-Light semantic contrast token.
- The dedicated 430×932 `ios-webkit` Auto regression covers direct entry, reload, Home→Profile navigation, Back/Forward, live system Light↔Dark changes, semantic tokens, computed document/account paint, runtime errors and horizontal overflow.
- Existing canonical route/Profile visual baselines remain unchanged.
- The approved 430×932 Light evidence is fail-closed by exact dimensions and SHA-256 and retains source-run/source-head provenance.

## Findings resolved during delivery

- A non-unique compatibility-class locator was replaced with the uniquely named semantic `Пароль и активные устройства` region.
- Semantically equivalent `#fff` / `#ffffff` CSS token serialization is normalized in the browser proof without weakening token assertions.
- An intermediate resolved-Auto canvas selector was narrowed from global ownership to `/profile`, removing unrelated canonical visual drift.
- Auto/system-Light legal-footer contrast ownership was corrected after accessibility CI exposed the mismatch.
- Approved-fingerprint sentinel handling was made type-safe after TS2367 without changing runtime behavior, reviewed bytes or fingerprint provenance.

## Reusable lesson

- When stored theme preference and resolved system appearance are separate contracts, presentation owners must consume resolved state while persistence continues to consume preference state.
- Route-scoped compatibility bridges are safer than promoting resolved theme ownership globally when only one legacy route needs the bridge.
- Visual fingerprints remain fail-closed until exact Linux browser evidence is manually reviewed; later test-only repairs must preserve the reviewed bytes and provenance.

## Remaining work

- Continue umbrella #205.
- Do not reopen #593 unless the exact 430px Auto/system contract regresses.

## Harness reset

- `.agents/current/TASK.md`, `.agents/current/PROGRESS.md`, and `.agents/current/EXECUTION.md` are reset byte-for-byte to the canonical templates in this reconciliation PR.
