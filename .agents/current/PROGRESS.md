# Current Task Progress

## 2026-08-17 Europe/Berlin

### Runtime repair verified

- Reconciled base/main before this slice: `e25cee1b2ef991aff9ea5a27f63d170e1bc8d1b7`.
- Dictionary root cause: primary Library navigation emitted compatibility graph `product`; #579 now emits canonical `dictionary`.
- Compact Materials root cause: missing one-line/equal-target geometry; #579 owns 48px minimum targets and overflow-safe nowrap behavior.
- Reminder root cause: one correct component owner rendered legacy hardcoded dark/blue presentation; #579 keeps the owner and switches presentation to semantic `--ak-*` tokens.
- Home → Learn/history/reload browser evidence stayed canonical; no speculative bootstrap canonicalization was added.
- Functional CI #3739 / run `32046365625` passed the normal browser matrix including WebKit/iOS.

### Transition visual evidence already approved

Exact Linux artifact `9293292461` from CI #3739, source head `43e80f5b1b0d6c778f53147ba6a115fefc94df0b`, digest `sha256:fedbe32158ef6199005c1f11b834a2974f5bbef4291d4738f4b7069d1e1e2483`:

- Dictionary Light `390×1197` — `4487459cea3e1347768e381ce393aeeecfb3f1e22b47e01554810cb6508b556d`.
- Dictionary Dark `390×1197` — `9104709d0b7f742ae22f18bacfe605a7658eb0db0b539e93b597ff8779cd855c`.
- Phrases Light `390×1616` — `91cc3fabe4cc7369e1c67992a28d4199b0a68028e354098fe17a78f5ddf93318`.
- Phrases Dark `390×1616` — `066a3ba05e676501a6025214567bdbdd901c8b820e8cb632003e5fc44a00b6b9`.
- Learn Light `390×1212` — `95e13c8164fea6ff0ba9ab0ae6032e4d01d4e9108d6fde79c3edef89fdff3169`.
- Learn Dark `390×1212` — `012800cae78c9639a97908b7a1d687e8b4893f47cc2cf615ecb6d04667827dc5`.

All six were manually inspected before approval at commit `be2bf0341bc85bdb3f860e5e7ba3226f2cedbc25`.

### CI #3740 classification

Run `32048818693` on immutable head `be2bf0341bc85bdb3f860e5e7ba3226f2cedbc25` failed only in:

- `Frontend E2E (UI tests (shard 1/2))`: longstanding new-tab navigation flake in `app-router-routes.spec.ts`; the new tab existed but URL assertion observed an empty URL while `/learn` navigation was pending. This test/file is not changed by #579.
- `Frontend E2E (Visual regression)`: dependent pre-existing visual contracts still encoded the legacy shared Reminder pixels; the six new #577 transition baselines themselves passed.

Visual source artifact: `9294131591`, digest `sha256:df25e2d160218fb355a3a5b86a0e1d4883dd3a2bdda5bf335e64cdbb876179b7`.
UI diagnostics artifact: `9294130463`, digest `sha256:a17d8d85ddc961996524a420e224ebe74a0862a4fc19116e6f9ca82d881efde1`.

### Manual review and differential proof

- Exact Light/Dark #3740 route/system/phrases/profile screenshots were manually inspected: canonical shells remain intact, Materials labels are one line, semantic Reminder is appearance-correct, no relevant clipping/overflow was observed.
- Previous approved tablet artifact: `9291962719`, CI `32040684330`, head `3578718bdcba1a24873ce23999ef7672a22193c5`, digest `sha256:aefffe94dc106084f4c18eb5d54d9e1e2ad87a1d8ccf670ac1c818bd5b480033`.
- Old vs #3740 pixel diff for every affected 768px tablet state is confined to exactly `x=541..646, y=0..102`; below that shared Reminder region the images are pixel-identical.
- Three fuzzy states were retry-stable and are migrated to exact content-addressed #3740 captures: Home compact, Progress compact, Progress desktop. Their old binary snapshots remain untouched and are no longer the assertion path at those affected widths.

### Evidence reconciliation being committed

Only reviewed dependent visual contracts are changing. No runtime/CSS/navigation source changes are part of this evidence commit. Strict contracts retain original Figma-approved hashes where applicable and add exact renderer-equivalent #577 fingerprints rather than replacing design provenance.

### Next action

Create one atomic evidence compatibility commit, read back/compare the branch, then require a new full immutable-head CI. If only the same unrelated new-tab flake recurs, rerun that job on the same head. Merge is blocked until full green.
