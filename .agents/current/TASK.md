# Current Task

## Identity

- Issue: #642
- Branch: test/issue-642-first-use-loading-error-visual
- Base SHA: 0fce4b690a6fbff95dd2d4ec6c5e725a21700d9d
- Head SHA: resolve from live branch ref after reconstructed commit
- PR: #645

## Objective

Reconstruct the First Use loading/error visual-evidence PR on current delivered `main` and collect exact fail-closed Linux evidence before approving any new content-addressed fingerprints.

## Scope

- extend only the existing authoritative `frontend/e2e/first-use-visual.spec.ts` owner;
- preserve the existing eight approved First Use fingerprints byte-for-byte;
- cover mobile/desktop × Light/Dark × loading/error with exact OpenPencil key/node/route/viewport provenance;
- use deterministic request-scoped loading/error fixtures and the canonical recoverable-error copy;
- bind desktop error assertions separately to the visible state intro and `role=alert` panel;
- assert loading `aria-busy`, no answer disclosure, horizontal overflow absence and error controls inside the canonical viewport;
- keep all eight new hashes at `REVIEW_REQUIRED` until a fresh immutable Linux run on this reconstructed head is manually reviewed.

## Non-goals

- no runtime React/CSS changes;
- no backend/API/session/state-machine changes;
- no OpenPencil `.op` or screen-map mutation;
- no workflow/dependency/deploy changes;
- no competing visual test owner;
- no blind fingerprint approval or fuzzy screenshot tolerance.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/e2e/first-use-visual.spec.ts`

## Prohibited paths

- `frontend/components/**`
- `frontend/app/**`
- `backend/**`
- `api/**`
- `design/**`
- `docs/figma/openpencil-screen-map.json`
- `.github/workflows/**`
- dependency manifests/lockfiles
- deploy/runtime infrastructure files
- existing visual snapshot binaries

## Runtime owners

- `frontend/components/lexigo-onboarding-app.tsx` — delivered First Use loading/error presentation and semantics from #647/#648.
- `frontend/app/first-use.css` — delivered responsive/appearance presentation, including the later desktop reassertion that keeps `.lx-first-use-loading-note--mobile` hidden at desktop width.

## Documentation owners

- Issue #642 / PR #645 and `.agents/current/**`.

## Invariants

- initial loading remains `aria-busy=true` and reveals no diagnostic answer content;
- generic recoverable error remains `role=alert` with `Повторить` and `Вернуться назад`;
- canonical recoverable-error copy is `Текущий выбор сохранён. Повторите запрос — диагностическая позиция не потеряется.`;
- desktop error legitimately exposes separate state-intro and alert-panel headings with the same accessible text;
- active OpenPencil source SHA-256 remains `6d73b785aaeb7dda35a53c9c5f16edfc9cbef1092dbce992183538f16505520e`;
- existing eight approved First Use hashes must not change in this evidence slice.

## Acceptance criteria

- all eight new canonical cases execute in authoritative Linux Visual regression;
- each case resolves to its exact active OpenPencil key/node/route/viewport;
- first immutable Linux run on the reconstructed current-main head attaches PNG/JSON actuals and fails only because the eight fingerprints remain `REVIEW_REQUIRED`;
- every fresh actual is manually reviewed against `n117/n128/n277/n288/n442/n456/n614/n628` before approval;
- approved hashes are exact SHA-256 values from those reviewed Linux PNGs;
- full immutable-head CI passes after reviewed fingerprint approval;
- reviews/threads and main drift are clean before protected squash merge.

## Required checks

- authoritative Linux Visual regression collection;
- existing First Use behavior/retry coverage;
- full frontend/core/browser/accessibility/security CI after fingerprint approval;
- exact changed-file audit and review/thread audit.

## Risks

- stale evidence from a branch that does not contain current runtime/CSS must not be approved;
- unscoped role locators can bind ambiguously because repaired desktop error intentionally renders two same-name headings;
- screenshot hashes are Linux/browser-build specific and must never be inferred from OpenPencil PNG hashes;
- a fresh product mismatch must remain fail-closed and be split into a separate runtime repair.

## Rollback

Force-reset the evidence branch back to current `main`; no production runtime or data migration is involved.
