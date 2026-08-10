# Progress

## Delivered before this slice

- Issue #74 closed after exact-SHA Stage/public delivery.
- Issue #18 Phase 1 PR #462 delivered adaptive ranking, review/new ratio, anti-streak and durable lesson reasons.
- Phase 1 merge SHA `edcfd3dbee62a4dba253df07d984fa326350c984` passed main CI #3151 and Stage #2994, including public HTTP/browser smoke.
- Issue #18 was reopened after GitHub incorrectly marked the XL issue completed at the Phase 1 merge boundary.

## Active phase

Backend-only diagnostic onboarding and learner self-mark contract on `feat/issue-18-diagnostic-onboarding-backend`.

## Implemented in change-set

- Additive onboarding state + diagnostic-item persistence migration.
- Deterministic bounded representative candidate selector.
- Resumable status/start/mark/complete/skip repository contract.
- Prompt-without-answer and reveal-after-mark response split.
- Scheduler initialization policy that does not create review history.
- Authenticated route wiring.
- Deterministic unit contracts for coverage, bounds, mark vocabulary and initialization policy.

## Next gates

1. Commit bounded change-set.
2. Open Draft PR.
3. Run immutable-head CI; fix only proven failures.
4. Ready + expected-head squash merge after full green and empty review-thread audit.
5. Verify exact-SHA main CI and Stage/public gates.
6. Continue #18 only within non-visual backend scope until #201 Figma design gate is cleared.
