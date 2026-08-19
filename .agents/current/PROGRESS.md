# Current Task Progress

## 2026-08-19 — reviewed browser-zoom evidence

### Verified live state

- Repository: `Dja-tiger/LexiGo`.
- Issue: #601; parent visual-parity umbrella: #205.
- Draft PR: #602 on branch `test/issue-601-route-browser-zoom-parity`.
- Corrected base remains `main@cb51f7ae8ff4ce0b92c09719c3d7b1c2f5dc960c` from merged PR #606 / closed Issue #603.
- Pre-approval head: `d04e2bacbb0d5f3ad2b7bc83dd1a251f481e8b20`.
- PR diff remains evidence/test-only and within the six allowed paths; no runtime/backend/deploy/design/workflow source is changed.

### CI classification and collection repair

- Earlier immutable-head run #3843 exposed a test-collection defect: the consolidated 1440×900 browser-zoom owner was also collected by `visual-compact` and `visual-medium`, where the project viewport made the browser zoom contract observe factor `1` instead of `2`.
- The owner is now ignored by compact/medium and collected only by canonical `visual-desktop`; the fail-closed source contract protects this boundary.
- CI #3845 / Actions run `32224361667` on exact head `d04e2bacbb0d5f3ad2b7bc83dd1a251f481e8b20` confirms the repair:
  - frontend core is green;
  - the Visual suite runs the consolidated owner only under `visual-desktop`;
  - 156 visual tests pass and 282 are skipped by project selection;
  - the only two failures are the intentional Light/Dark `REVIEW_REQUIRED` gates for Issue #601.

### Corrected Linux evidence

- Exact Visual artifact: `9355233690`.
- Artifact SHA-256: `3106254cdd3923dc97d7e58cd0d4edf7e6a868f80c78a6a6f55e238a95f763af`.
- Evidence source viewport: `1440×900`.
- True browser-owned zoom factor: `2.0`.
- Effective CSS width: exactly `720px`.
- Capture path: CDP `Page.getLayoutMetrics` + `Page.captureScreenshot`, with CSS→DIP conversion from `cssVisualViewport.zoom` and output normalization using `scale: 1 / zoom`.
- All 20 route/theme states reached evidence capture only after canonical route owner, exact RouteChrome ownership, document/main/route/global/interactive containment, visible-text containment, keyboard focus-visible, reduced motion and runtime-error assertions passed.
- All 20 corrected Linux PNGs were manually reviewed. No right-side clipping, horizontal overflow, overlapping route chrome, or focused-route content truncation is reproduced.

### Reviewed fingerprints

Light:
- Home `720×615`: `89ca202f311574c26355d2673cabacd47bb91780eee34011887d746732f9a568`
- Learn `720×995`: `c1b05d53ca5d3184a73c3dda372aa67d2eab5deed26c4d603568297367377d5f`
- Active Lesson `720×766`: `14cf5dce9466ab03bb40eb106e2e99c985b6b046dfa959f36587d35a93558985`
- Progress `720×1664`: `b1178cacef2f9fdc8bb747f1253fefc903da665df4eb4672c7845ffa0b3c18e9`
- Dictionary `720×1058`: `71f121025b9dac9572ec746942267e2b9b05c72f957fb47a3092d681e35b0c25`
- Word Detail `720×1676`: `9e110d2ce1ef79fe2547f9d6ed782210c8dd7f60ab3ace27c5cdc678322c6103`
- Phrases `720×1363`: `a600b1098395ad6cf9e170de0d59863dc0505bd63b80390de2a40f54aabdae65`
- Phrase Detail `720×1589`: `64b6dfcc35d1aa327945e4fac47c95cc31bd7daa14c199d1f6d4d52f23981f75`
- Profile `720×4086`: `8dacc1f7f390229c9f4b3fed4a2b037731e00e0fd4b34d702c51027060b0237b`
- Onboarding `720×914`: `a166f294d2d6b8a5714c5ad066fbb98f51d059fa6d931cbed3561fcda6913f89`

Dark:
- Home `720×615`: `fdc9899a6c90005db48fc2e88b8d46cdfb057faace0c728c2da5725116c76b40`
- Learn `720×995`: `56a5c528fc096d798b36963227fab20791469d0e1a3300f1f8c2dea40a97434e`
- Active Lesson `720×766`: `aa65b64f58055f76485e21db9a2058cbca9f2612086d00b65fc8480e86ec6416`
- Progress `720×1664`: `f0832dafef9d02af60a970d1f252fea6ace675df58d609de8127a5ff74d87007`
- Dictionary `720×1058`: `fed59daf3407b2b93e56617e75ad8699af5167cea3796643c6dd62ca483b0b53`
- Word Detail `720×1676`: `c332f97e59e1d56da16859718145ed0e2bf4c671bfcc0ee76f942cf26de54d9d`
- Phrases `720×1363`: `b36077210d12ac1eae8de4e4898965b1d3bd9b55dec5551b5e07c77bc5c70084`
- Phrase Detail `720×1589`: `788bee88dc42223eeff5d9e923ed89d71c9205e8369afa9beb6ff54353576167`
- Profile `720×4086`: `f6b7826b0a9b61e4092aa1696ead3ec7dd73a5c3af1aeafcdf1547c5af1105d5`
- Onboarding `720×914`: `b3cef0bddbb26e6f7b5e96c142a130642b4c47f8da57a1efe049330bc7018ebe`

### Stale child issues resolved

- #604 (Active Lesson clipping) is closed `not_planned`.
- #605 (Onboarding clipping) is closed `not_planned`.
- Both were created from historical artifact `9340975602`, whose Playwright full-page capture coordinate contract was invalidated by #603.
- The corrected CDP artifact above does not reproduce either focused-route defect, so no runtime repair is justified.

### Next action

Commit only the manually reviewed fingerprints and this factual task evidence, then require a fresh full immutable-head CI. Do not mark Ready until that final developer-authored head is fully green and review/main-drift audits are clean.
