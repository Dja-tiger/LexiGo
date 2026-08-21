# Issue #647 First Use desktop loading/error runtime reconciliation

Verified on 2026-08-21.

## Product delivery

- Umbrella visual parity: Issue #205.
- First Use loading/error visual-evidence owner: Issue #642 / Draft PR #645.
- Runtime repair: Issue #647 — restore desktop First Use loading/error hierarchy to the active repository-owned OpenPencil design.
- Product PR: #648 — `fix(first-use): restore desktop loading error hierarchy`.
- Final developer-authored PR head: `33bf2217a61d438d90ee85b3085a3c73a317cc41`.
- Final immutable-head CI: #3965 / run `32491975673` — `success` on the exact PR head.
- Squash merge / delivered `main`: `d05c37351d05e3b76a5e0cf9d03c943cf0cbad40`.
- Exact-main CI: run `32506357884` — `success` on the exact merge SHA, including backend unit/integration, frontend core, both UI shards, accessibility, Content Security, Controlled Service Worker, performance, iOS PWA, lesson completion, Linux Visual regression and published `api`/`web` container images.
- Exact-SHA Stage: run `32507433547` — `success` for image SHA `d05c37351d05e3b76a5e0cf9d03c943cf0cbad40`, including deploy, public smoke and 12/12 public Chromium/iOS WebKit checks.
- Issue #647 is closed as completed by the squash merge.

## Delivered runtime contract

PR #648 restores the active OpenPencil desktop hierarchy for `/onboarding` initial loading and generic recoverable-error states without changing backend/API/session/state-machine ownership:

- desktop loading now follows header → state intro → 720×540 state panel hierarchy for OpenPencil nodes `n442` / `n614`;
- desktop loading owns the fifth skeleton row plus the canonical lower note geometry/copy;
- desktop generic recoverable error now follows the corresponding state intro + recoverable panel hierarchy for nodes `n456` / `n628`;
- mobile 390×844 loading/error presentation remains compact and unchanged in ownership;
- initial loading remains `aria-busy=true` and does not reveal answers;
- recoverable error remains `role=alert`, keeps `Повторить` / `Вернуться назад` and preserves retry sequencing;
- existing First Use behavioral owners and previously approved visual fingerprints remain unchanged.

No backend, API, OpenPencil `.op`, screen-map, workflow, dependency, deployment-infrastructure or visual-fingerprint allow-list files changed in PR #648.

## Design provenance and evidence

- Active OpenPencil source SHA-256: `6d73b785aaeb7dda35a53c9c5f16edfc9cbef1092dbce992183538f16505520e`.
- OpenPencil acceptance run: `32486519368`.
- Artifact: `9448087269` (`openpencil-visual-acceptance-2a996c4c143374e4130b875ba526662544f1c25c`).
- Live artifact digest: `sha256:6613ec5c6680ff962e2612c366aba454a7ab815212e2b1a763a9f4c085b95689`.
- Canonical First Use loading/error nodes remain:
  - `firstuse.loading.mobile.light` → `n117`, 390×844;
  - `firstuse.error.mobile.light` → `n128`, 390×844;
  - `firstuse.loading.mobile.dark` → `n277`, 390×844;
  - `firstuse.error.mobile.dark` → `n288`, 390×844;
  - `firstuse.loading.desktop.light` → `n442`, 1440×900;
  - `firstuse.error.desktop.light` → `n456`, 1440×900;
  - `firstuse.loading.desktop.dark` → `n614`, 1440×900;
  - `firstuse.error.desktop.dark` → `n628`, 1440×900.
- Exact OpenPencil error panel copy is `Текущий выбор сохранён. Повторите запрос — диагностическая позиция не потеряется.`; the pre-repair PR #645 fixture copy `Диагностика временно недоступна` is therefore non-canonical and must not be carried into the reconstructed evidence PR.

The live GitHub artifact metadata is authoritative. An older handoff contained a different artifact digest; this reconciliation records the live value above rather than propagating stale metadata.

## Validation and failure classification

The runtime repair did not approve new loading/error runtime hashes. Existing authoritative Linux Visual regression remained green on the repaired runtime, proving no regression to already approved First Use/system-state baselines.

An earlier PR run `32490479463` failed only a downstream source contract in `frontend/components/system-state-openpencil-contract.test.ts`: it expected one literal static `className="lx-first-use-panel lx-first-use-message" role="alert"` string. The runtime intentionally composes a recoverable-state modifier dynamically, so the stale assertion was changed to protect semantic `role=alert` ownership plus the exact recoverable modifier. Runtime behavior was not weakened. The next repaired run #3964 / `32490753893` and final run #3965 / `32491975673` were green.

## Delivery-process recovery

While preparing the task-local docs commit in PR #648, one `create_file` operation was mis-selected and targeted a deliberately nonexistent branch/path. GitHub rejected the request with HTTP 404 before any repository ref or path changed. Writes were stopped; protected `main`, the PR head and absence of the accidental path were revalidated; the exact Git Data schema was then reloaded before resuming. The incident remains recorded because a rejected write still requires repository-state reconstruction under `.agents/AGENTS.tool-selection.md`.

## Remaining First Use visual-evidence work

Issue #642 remains open. Draft PR #645 is pre-repair evidence work based on the old `main`, is currently not mergeable, and must be reconstructed on top of the delivered runtime rather than rebased blindly.

The reconstructed #645 must:

1. keep the eight canonical loading/error cases in the existing authoritative `frontend/e2e/first-use-visual.spec.ts` owner;
2. use request-scoped deterministic fixtures whose rendered copy matches the active OpenPencil/runtime contract;
3. start with `REVIEW_REQUIRED` runtime fingerprints so the first immutable Linux run fails closed while attaching exact PNG/JSON evidence;
4. manually review every Linux actual against `n117/n128/n277/n288/n442/n456/n614/n628`;
5. approve only exact content-addressed runtime hashes after that review;
6. keep the previously approved First Use baselines unchanged unless a separate reviewed correction proves otherwise.

## Harness reset

This reconciliation branch resets `.agents/current/TASK.md`, `.agents/current/PROGRESS.md` and `.agents/current/EXECUTION.md` byte-for-byte to the canonical templates before Issue #642 resumes.

`PROJECT_STATE.md` is intentionally not destructively rewritten through a potentially truncated full-file connector response. This dedicated reconciliation record preserves exact delivery evidence without risking loss of historical repository state, matching the established repository reconciliation pattern.