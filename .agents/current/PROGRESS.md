# Current Task Progress

## 2026-08-17 Europe/Berlin

### Runtime repair verified

- Base/main for this slice: `e25cee1b2ef991aff9ea5a27f63d170e1bc8d1b7`.
- Issue #577 / Draft PR #579, branch `fix/issue-577-route-runtime`.
- Runtime reviewed-source head: `43e80f5b1b0d6c778f53147ba6a115fefc94df0b`.
- Dictionary primary navigation now emits canonical `dictionary` ownership.
- Compact Materials owns equal 48px minimum targets, nowrap labels and overflow-safe geometry.
- Shared Reminder keeps one component/geometry owner and uses semantic `--ak-*` tokens instead of legacy hardcoded dark/blue values.
- Home → Learn/history/reload remained canonical; no speculative bootstrap canonicalization was added.
- CI #3739 / run `32046365625` passed the functional/browser matrix including WebKit/iOS.

### Reviewed transition evidence

Exact Linux artifact `9293292461` from CI #3739, source head `43e80f5b1b0d6c778f53147ba6a115fefc94df0b`, digest `sha256:fedbe32158ef6199005c1f11b834a2974f5bbef4291d4738f4b7069d1e1e2483`:

- Dictionary Light `390×1197` — `4487459cea3e1347768e381ce393aeeecfb3f1e22b47e01554810cb6508b556d`.
- Dictionary Dark — `9104709d0b7f742ae22f18bacfe605a7658eb0db0b539e93b597ff8779cd855c`.
- Phrases Light `390×1616` — `91cc3fabe4cc7369e1c67992a28d4199b0a68028e354098fe17a78f5ddf93318`.
- Phrases Dark — `066a3ba05e676501a6025214567bdbdd901c8b820e8cb632003e5fc44a00b6b9`.
- Learn Light `390×1212` — `95e13c8164fea6ff0ba9ab0ae6032e4d01d4e9108d6fde79c3edef89fdff3169`.
- Learn Dark — `012800cae78c9639a97908b7a1d687e8b4893f47cc2cf615ecb6d04667827dc5`.

All six were manually inspected before approval at `be2bf0341bc85bdb3f860e5e7ba3226f2cedbc25`.

### Dependent evidence reconciliation

CI #3740 / run `32048818693` on `be2bf034…` failed Visual because older route/system/tablet contracts still encoded the intentional legacy Reminder pixels; the six new #577 transition states passed. Exact Visual artifact `9294131591`, digest `sha256:df25e2d160218fb355a3a5b86a0e1d4883dd3a2bdda5bf335e64cdbb876179b7`, was manually reviewed.

Against previously approved tablet artifact `9291962719` / CI `32040684330`, every changed pixel in all 14 affected 768px states is confined to `x=541..646, y=0..102`, the shared Reminder region; all pixels below are identical. Evidence-only commit `d31419799272e5fbb697980eb6c976f7aa05b6b7` reconciled only visual contracts plus Agent Harness; no runtime/CSS/navigation source changed.

The second #3740 failure was the known unrelated new-tab timing flake in unchanged `app-router-routes.spec.ts`, artifact `9294130463`, digest `sha256:a17d8d85ddc961996524a420e224ebe74a0862a4fc19116e6f9ca82d881efde1`.

### CI #3741 classification

CI #3741 / run `32053496642` on exact head `d31419799272e5fbb697980eb6c976f7aa05b6b7` reached `113 passed`, `198 skipped`, `1 failed` in Visual. All #577 transition states, tablet matrix, Phrases, system states and the other Profile states passed. The sole failure was `Profile Figma visual baselines › compact light`.

Exact #3741 Visual artifact `9295711128`, digest `sha256:fa96254d31f7b4fdb97c30d7311085aa968d4d2b61e78141d7a071a2c8bc56b2`, was downloaded. The compact-Light capture is retry-stable at `390×844`, SHA-256 `b2fc018f0c1a86e484d33405c334b7f70a9b658bee5f235c532cebfefee551b0`, and was manually inspected.

The earlier reviewed #3740 compact-Light capture is `821083de2f8a57488671ef2e4014384b8ad5dd531a5f9d96c52e5409cbf1b8e9`. Decoded pixel comparison between #3740 and #3741 shows only 4 changed pixels, bbox `x=272..321, y=7..21`, with maximum RGB delta of one LSB, all on the antialiased top Reminder edge. Geometry/content are otherwise identical. Both exact values are therefore retained as scoped renderer-equivalent fingerprints; no tolerance and no product/runtime change is introduced.

### Next action

Commit the single Profile renderer-equivalent correction together with this harness evidence, verify exact diff, then require a fresh fully green immutable-head CI before Ready/merge. Merge remains blocked until that gate is green.
