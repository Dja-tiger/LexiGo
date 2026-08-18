# Current Task Execution

## Task

- Issue: #589
- Branch: `fix/min-mobile-learn-contrast`
- Base SHA: `2edf865448fb47951bd80963215cb3a6a76b01a4`
- Head SHA: resolve from live PR/ref after every write
- PR: #591

## Skills used

### Production-safe frontend delivery

Purpose: isolate and repair the compact Learn contrast defect exposed by the fail-closed #587 minimum-width audit without changing already-approved Auto/default or Dark compact presentation.

Instruction source: root `AGENTS.md`, every document indexed by `.agents/AGENTS.md`, `.agents/SKILLS.md`, `docs/agent-harness.md`, Issue #589 and parent #587/#205.

Version or verification date: live `main@2edf865448fb47951bd80963215cb3a6a76b01a4`, verified 2026-08-18.

Inputs: diagnostic CI #3756 / run `32074275805`; broad-repair CI #3758 / run `32078860455`; corrected CI #3763 / run `32093144691`; Linux Visual artifacts `9304580365` and `9309266622`; prior reviewed Visual source artifact `9293292461` from run `32046365625`; 320px explicit Light/Dark evidence; canonical 390px Lesson Composer baseline; OpenPencil/Figma screen map mapping `202:6` / `fig_6826`.

Files inspected: Learn runtime/CSS owners, explicit appearance token owner, existing source contract, canonical Learn route browser contract, route-transition visual owner, exact old/new Linux screenshots, current Issue/PR/review state and Agent Harness memory.

Actions performed:

1. classified the original 320px Light issue as a computed-cascade production defect;
2. inspected CI #3758 after the first repair attempt and identified changed Learn compact visual fingerprints;
3. manually inspected the exact #3758 Linux actual before any baseline action and proved the viewport-only compact selector was a regression for Auto/default dark-hero presentation;
4. replaced the broad compact semantic foreground with an explicit-Light-only selector under `max-width: 767px`;
5. strengthened the source contract to reject both the broad selector and `data-lexigo-resolved-appearance` ownership;
6. extended the existing canonical 390×844 Learn browser contract to assert the computed heading foreground for explicit Light/Dark and preserved desktop fixed-foreground states;
7. ran corrected immutable CI #3763 and observed exactly one deterministic Visual mismatch: `learn after Home client navigation — light`, while the critical Auto/default Lesson Composer baseline, `learn.dark` transition and all other Visual cases reproduced;
8. downloaded exact #3763 artifact `9309266622` (`sha256:1d8f7c5c423a8113d11599df4b647d60bc804e260019907ecebbad50a29c0656`) and extracted the actual explicit-Light transition SHA `14732c934d4b91a89415174ccd01a9c1a9c4134c9b07c21229401c48bb544425`;
9. downloaded prior approved source artifact `9293292461` from run `32046365625` and extracted exact old `learn.light` SHA `95e13c8164fea6ff0ba9ab0ae6032e4d01d4e9108d6fde79c3edef89fdff3169`;
10. manually compared old and new `390×1212` frames and confirmed the old frame encoded the defect (heading invisible on Light hero) while the new frame shows the required readable dark heading with unchanged geometry;
11. approved only the reviewed `learn.light` transition hash/provenance to CI #3763 / developer head `928b0186a688545aadcd9b82d84e5940f79f0ab6`; all other visual fingerprints remain untouched;
12. reconciled `.agents/current/**` scope so the single reviewed visual evidence write is explicit and auditable.

Commands or procedures: GitHub connector exact file/Issue/PR/ref reads and writes; `compare_commits` after every write; workflow job/log/artifact inspection; exact artifact downloads; SHA-256 lookup and manual PNG review in the container. No local `git`/`gh` checkout was used because the local environment could not resolve GitHub networking.

Artifacts produced: focused branch commits on PR #591 plus manually reviewed CI #3758/#3763 Linux Visual artifacts and the prior baseline source artifact. No generated or binary artifact was committed.

Result: implementation matches the corrected contract — only compact explicit Light uses semantic dark heading text; Auto/default compact, explicit Dark compact and desktop/tablet dark hero retain fixed `#f4f7f5` foreground. The only reviewed visual contract changed by the repair is the explicit-Light Home→Learn transition, now `390×1212` SHA `14732c934d4b91a89415174ccd01a9c1a9c4134c9b07c21229401c48bb544425`. A new full immutable-head CI is required after this evidence approval and harness reconciliation.

Failures classified:

- CI #3758 Visual: production regression introduced by the first too-broad repair selector, not a stale baseline; broad baseline updates were explicitly rejected after manual review.
- CI #3763 Visual: expected reviewed product change isolated to explicit `learn.light`; old baseline encoded the actual white-on-light defect, so a single content-addressed fingerprint/provenance update is justified after exact old/new Linux comparison.
- Figma MCP screenshot access remains quota-blocked; the repository-owned active OpenPencil screen map and exact Linux evidence remain the fallback design evidence for this slice.
- #588 diagnostic CI also contains an unrelated pre-existing iOS WebKit calendar geometry failure; it is outside #589 scope.

Root cause: foreground ownership depended on two dimensions simultaneously — compact viewport and explicit user appearance. The fixed accessibility foreground is correct for the dark hero, while only explicit Light changes the compact effective surface to the semantic light canvas. A viewport-only override erased that distinction. Separately, the route-transition visual gate had frozen the defective explicit-Light appearance and therefore required one reviewed fingerprint update once the defect was corrected.

Fallback: repository-owned OpenPencil/Figma mapping plus authoritative Linux artifacts; no inferred or blind snapshot approval.

Limitations: task cannot be marked complete until the new final head passes full immutable CI, authoritative Visual reproduces the reviewed `14732c…` explicit-Light transition and all untouched hashes, review/main-drift audit is clean, merge succeeds, and exact-main plus Stage/public validation pass.

Reusable lesson: responsive foreground overrides must be keyed to the actual effective surface and appearance owner. A media-query boundary alone is insufficient when explicit appearance can change the surface independently. Content-addressed visual baselines are approval evidence: reject broad updates that conceal regressions, but re-approve a narrowly isolated fingerprint when exact old/new artifacts prove the old baseline encoded the defect being intentionally fixed.