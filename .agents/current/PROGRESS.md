# Current Task Progress

## 2026-08-17 Europe/Berlin

### Verified

- Live `main` at branch creation: `157c645731604fb39488068397472994b2ea67d1`.
- Issue #571 created from exact Linux evidence produced by #568 / Draft PR #570.
- Audit head `8b656e7c05fac830a343ec1bf88aea9be0bfe148`, CI #3704 / run `31979268275`, visual artifact `9271989171`, digest `sha256:2e6dd3d9f51fcd7e787865b8f61e7b9f27373ad841e85fd327f663a51d6f0aae`.
- All 20 tablet audit states passed pathname/owner/navigation/overflow/runtime-error checks before the intentional `REVIEW_REQUIRED` hash gate.
- Manual review classified seven routes as visually coherent and reproduced real defects in `/learn`, `/phrases`, `/profile` in both Light and Dark.
- Learn root cause: desktop outer `1fr + 360px` composer survives at 768 because the one-column bridge ends at 767 while RouteChrome tablet rail starts at 720.
- Phrases root cause: fixed `250px + 1fr` catalog workspace survives at 768; single-column catalog layout starts only below 768.
- Profile root cause: route-navigation tablet rail offset is overridden by route-specific `.lx-profile-app .lx-main-content { margin: 0 auto }` in the actual cascade.
- Existing responsive/UI CI already collects `adaptive-layout-cascade.spec.ts`, `phrases-grid-cascade.spec.ts`, and `account-security-width-cascade.spec.ts`, so no new package/workflow wiring is required.

### Finding

The three defects are production CSS ownership failures at the existing 720–1099px RouteChrome tablet interval. They are not OpenPencil source defects and must not be approved as tablet audit baselines.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`

### Checks passed

- Live main re-verified before runtime branch creation.
- Duplicate runtime issue search completed; no existing issue for these exact defects was found.
- CSS root causes confirmed against production stylesheets and RouteChrome breakpoint ownership.

### Checks failed

- #570 Visual regression intentionally remains red on `REVIEW_REQUIRED`; the three broken routes are specifically blocked from fingerprint approval.

### Current branch head

Resolve from live branch ref after this commit.

### Next action

Implement route-scoped tablet presentation overrides and extend the existing computed-cascade suites so the 768px regressions fail closed before browser visual review.