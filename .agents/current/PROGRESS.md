# Current Task Progress

## 2026-08-06 09:51 Europe/Moscow

### Verified

- Repository: `Dja-tiger/LexiGo`.
- Live `main`: `078f842740bbed27deed92888e8f482cb133f616`.
- Stage remains healthy on exact product image SHA `3b8f3c39faee1223e3773935c761eb7903409868`; Issue #12 records deploy, public smoke and public browser success.
- Open unrelated PRs #304, #305 and #403 are Dependabot maintenance.
- Issue #74 remains open and no product slice was active after PR #411/#412 reconciliation.
- Branch `fix/issue-74-word-detail-related-phrase-targets` was created from exact live `main`.
- Draft PR #413 is open from the focused branch to `main`.
- Every changed path was read back after its write; branch heads matched the returned commit SHA and `main` remained unchanged.
- Initial authoritative CI #2913 ran on exact developer-authored head `f417d52aa742100cddb56007925ce994fa3b8850`.

### Finding

- Canonical authenticated Word Detail renders up to three live related-phrase native buttons in `.lx-word-detail-phrase-list`.
- `frontend/app/word-detail.css` gives these controls a 34px minimum painted height and the list a 10px wrapped gap.
- Fine-pointer 44px expansion needs 5px transparent block-axis slop per side; the existing 10px row gap is sufficient.
- Coarse-pointer 48px expansion needs 7px per side; wrapped rows therefore require a 14px row gap to prevent effective-target overlap.
- `DictionaryCatalog` already routes each selected phrase slug to canonical `/phrases/[slug]`; no runtime callback or History change is required.
- The execution container cannot resolve `github.com`, so a local shallow clone failed before checkout. This is classified as an infrastructure limitation, not a test result; authoritative validation runs in repository CI.
- CI #2913 proved the functional contract: frontend core, backend unit/security, backend integration, both UI shards, lesson completion, iOS PWA dictionary, Dictionary smoke and accessibility audit completed successfully.
- CI #2913 Visual regression failed only for compact Word Detail Light and Dark. The downloaded Playwright report showed deterministic outputs of 390x1749 versus prior 390x1745 baselines, with no runtime or semantic change. The exact +4px height is the intended coarse-pointer row-gap increase from 10px to 14px.

### Root cause

The related-phrase pills were designed as compact 34px visual chips, but they did not have a separate interaction owner that guarantees the minimum 44px fine-pointer and 48px coarse-pointer hit area. Preventing overlap for wrapped 48px targets requires 14px coarse-pointer row separation, which intentionally adds 4px to the compact full-page visual baseline.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/app/layout.tsx`
- `frontend/app/word-detail-related-phrase-touch-targets.css`
- `frontend/components/word-detail-related-phrase-touch-target-source.test.ts`
- `frontend/e2e/word-detail-related-phrase-touch-targets.spec.ts`
- `frontend/e2e/word-detail-visual.spec.ts`
- `frontend/package.json`

### Checks passed

- Mandatory repository-harness reading and live GitHub pre-flight.
- Source ownership audit for Word Detail presentation, CSS, Dictionary route/navigation and canonical E2E fixture.
- Explicit branch/base/readback verification after every write.
- Initial allowed-path compare: branch was not behind `main` and changed only the expected focused paths.
- Static contract covers native semantic ownership, 34px painted geometry, 44/48px effective targets, transparent perimeter hit testing, pairwise non-overlap, focus, canonical phrase navigation and compact overflow.
- CI #2913 classifier, frontend lint, TypeScript, unit tests, production build and dependency audit.
- CI #2913 backend unit/race/security and integration/race suites.
- CI #2913 UI shards 1/2 and 2/2, including the new cross-browser related-phrase geometry contract.
- CI #2913 lesson completion, iOS PWA dictionary, Dictionary smoke and accessibility audit.
- Visual failure artifact downloaded and inspected; Light/Dark compact outputs are stable across initial run and retry.
- Exact compact Light baseline accepted as 390x1749, SHA-256 `c0370ebe2bb3e5b14b802889603d00bd9a43d33f63fe67ea87ddcf071e8a6112`.
- Exact compact Dark baseline accepted as 390x1749, SHA-256 `1587a40a287e26e8806a25ca146051e470f2e0aa3db0a89329ed0af99611c3fb`.
- Both desktop Word Detail baselines remain unchanged.

### Checks failed

- Local shallow clone could not start because the isolated execution container could not resolve `github.com`; no source or test command executed locally.
- Initial CI #2913 Visual regression correctly rejected the two stale compact content hashes. This deterministic baseline mismatch has been addressed; a new immutable-head CI is required.

### Current branch head

Resolve from live branch ref after this write. The final candidate head must include this progress record and pass a fresh authoritative CI; results from #2913 are diagnostic evidence only.

### Next action

Read this record back, verify branch/main refs and the final focused compare, then monitor the new authoritative CI on the exact latest developer-authored head. Do not mark Ready or merge until every required job, including visual, performance, security, service-worker and container gates, is green.