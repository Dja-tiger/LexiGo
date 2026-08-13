# Current Task Execution

## Task

- Issue: #481 delivery remediation
- Parent: #25
- Branch: `fix/issue-481-stage-webkit-sw-cancellation`
- Base SHA: `b62470b0051ca60e2bea177ab08945887107822c`
- Trigger: Stage #3208 public iOS WebKit acceptance failure after product PR #482 merge.

## Verified provenance

- PR #482 final head `b7eb33fd0e7da8b877217b1ec8f2af93b491f8e9` passed CI #3366 fully and squash-merged as `b62470b0051ca60e2bea177ab08945887107822c`.
- Exact-main CI #3367 / run `31675946620` passed fully and published exact-SHA images.
- Stage #3208 / run `31676641895` checked out exact `b62470b0...`, validated the exact CI-scope artifact, deployed the exact images and passed public frontend/API smoke.
- Public browser failed only in iOS WebKit stale-build recovery. 11/12 tests passed.
- The failed test retried once and reproduced the same pageerror, so no blind rerun is accepted as root-cause remediation.

## Failure diagnosis

Public test `frontend/e2e/public-runtime-smoke.spec.ts` computes the exact expected current-build service-worker URL and temporarily sets it as `guardServiceWorkerURL`. Fatal page errors are ignored only when `isExpectedWebKitGuardServiceWorkerCancellation()` identifies the exact known WebKit cancellation.

Observed normalized capture:

`Cannot load https: /<stage-host>/sw.js?build=b62470b0... due to access control checks.`

Current helper:

- strips a leading `Error:`;
- canonicalizes only `Cannot load https: //host/...` to `Cannot load https://host/...`;
- then requires exact equality to the guard URL.

The Stage WebKit diagnostic used a single slash after the scheme separator. Because that formatting variant is not normalized, the exact equality check is never reached successfully.

## Remediation design

Change only the protocol-fragment normalization so either one or two slash characters after the split `http:`/`https:` are canonicalized to `://`. Keep every classifier guard unchanged:

- browser must be `webkit`;
- guardServiceWorkerURL must be non-null;
- normalized full diagnostic must equal `Cannot load <exact guard URL> due to access control checks.` exactly.

Add focused unit coverage for the single-slash Stage form and retain all existing negatives for Chromium, null guard, wrong build, wrong path and wrong host.

## Safety

- No service-worker registration/update behavior changes.
- No build-version guard logic changes.
- No Playwright retry/tolerance increase.
- No deployment/CI workflow changes.
- No listening/backend/API changes.
- If the exact URL differs, the failure remains fatal.

## Delivery procedure

1. Commit Agent Docs pre-flight for remediation.
2. Apply the two-file normalizer + unit regression patch.
3. Read back diff and open Draft PR against live `main`.
4. Run full immutable-head CI and review/compare audit.
5. Ready and expected-head squash merge without further head mutation.
6. Require exact-main CI and exact-image Stage.
7. Require public endpoint smoke and public Chromium+iOS WebKit acceptance.
8. Only then mark all #481 AC delivered and close #481.
9. Perform separate post-merge Agent Docs reconciliation/reset before choosing the next #25 phase.
