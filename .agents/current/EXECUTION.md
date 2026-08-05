# Current Task Execution

## Task

- Issue: #74
- Branch: `fix/issue-74-mobile-navigation-labels`
- Base SHA: `091b8ffdbf0bb70edbbe963f9fd88e40c3ef848a`
- Head SHA: resolve from live branch ref
- PR: #397

## Skills used

### Connected GitHub production workflow

Purpose:

Continue one atomic production slice through repository inspection, branch writes, authoritative CI, expected-head merge and deployment evidence.

Instruction source:

- repository `AGENTS.md` and mandatory `.agents/**` overlays;
- `docs/agent-harness.md`;
- connected GitHub and CI-diagnostics skills.

Version or verification date:

2026-08-05.

Inputs:

- live `main`, PR #397 and Issue #74 state;
- final mobile-navigation cascade and runtime ownership;
- CI #2832 selector-conflict diagnostics;
- CI #2843 UI and visual reports, traces and screenshots;
- CI #2847 final pre-promotion matrix and exact visual hash output;
- exact Git blobs for every candidate test file.

Files inspected:

- all mandatory repository Harness documents;
- canonical, adaptive and late Figma navigation CSS owners;
- route navigation runtime and history owners;
- focused mobile-navigation test;
- all visual specifications reported by CI #2843 and CI #2847;
- downloaded Playwright reports and attached PNG artifacts for failed UI and visual jobs;
- raw `frontend/e2e/visual-regression.spec.ts` Git blob by exact SHA.

Actions performed:

- continued the already-open atomic Issue #74 slice instead of starting a new task;
- verified live `main`, branch, PR, Issue and immutable CI heads before writes;
- localized the focused failure to a 0.000025 CSS px serialization difference, not a reserve defect;
- added a bounded 0.1 CSS px geometry tolerance while preserving the required navigation-height-plus-20px invariant;
- extracted every changed compact screenshot from CI #2843 and manually reviewed the rendered deltas;
- confirmed that changed visuals preserve route geometry and differ meaningfully only in the intended bottom-navigation label typography;
- promoted content-addressed compact hashes and immutable CI provenance in phrases, profile, system-state and word-detail visual owners;
- retained both manually reviewed compact-light Profile hashes because Linux masked-profile rasterization produced a bounded three-pixel difference without a meaningful rendered change;
- verified all five earlier replacement files by exact Git blob SHA;
- created Git blobs, a Git tree and commit `c4b682b1f5469cb39e623394501df89494ddb9e9`, then advanced the branch without force-push;
- rejected an earlier attempted large `visual-regression.spec.ts` blob because its SHA differed from the exact local object and it decoded as invalid UTF-8;
- reconciled `TASK.md` so reviewed compact visual owners are explicitly allowed and unrelated baselines remain prohibited;
- inspected CI #2847 and confirmed all core, backend, UI, accessibility, PWA, service-worker, security, performance and smoke gates passed;
- classified the five stable CI #2847 failures as the exact reviewed central compact baselines and kept the unrelated Dictionary empty-state hash unchanged because its retry passed;
- fetched the exact raw central file by blob SHA `7a2ea545ebedc5334dca80a3259b7caa07d29b0a`;
- reconstructed the 20.5 KB UTF-8 payload byte-for-byte and verified its Git object SHA before modification;
- replaced only the five approved compact hashes and set provenance to CI #2843 / run `31009993569` at immutable head `6ba40fbdafccc4cd34ad3869a7004a6c0c4ea9c2`;
- precomputed replacement blob SHA `4b3ce87d65ada5164906107c9ddc761586b8294f`;
- committed `frontend/e2e/visual-regression.spec.ts` as `38ab25a8a5421fb33ba398d218dc967441c3a31b` through the branch-explicit contents API;
- read the changed path back and confirmed GitHub returned the same expected blob SHA;
- confirmed `main` remained on `091b8ffdbf0bb70edbbe963f9fd88e40c3ef848a` after the write;
- updated the final task handoff before authoritative CI.

Commands or procedures:

GitHub connector reads/writes, workflow/job and artifact inspection, Playwright trace extraction, manual PNG review, local Git-object hashing for integrity, exact raw blob retrieval, branch-explicit contents updates and readback verification. Local calculations are used only for object-integrity verification; GitHub CI remains authoritative for product acceptance.

Artifacts produced:

- bounded focused geometry assertion;
- reviewed compact visual hashes with CI #2843 provenance;
- exact Git blobs for all affected visual owners;
- central visual owner blob `4b3ce87d65ada5164906107c9ddc761586b8294f`;
- product/test commit `38ab25a8a5421fb33ba398d218dc967441c3a31b`;
- updated `.agents/current/**` handoff;
- superseded CI runs #2844 and #2847 evidence retained in PR history.

Result:

The runtime/CSS candidate is unchanged and all reviewed compact visual contracts are now encoded, including the central `visual-regression.spec.ts` owner. No unrelated or flaky baseline was promoted. The remaining delivery gate is full authoritative CI on the final documented developer-authored head, followed by review checks, Ready, expected-head squash merge and exact-SHA stage/public validation.

Failures:

- CI #2843 focused reserve assertion failed by 0.000025 CSS px.
- CI #2843 visual gate rejected intended compact screenshots containing the updated navigation.
- One CI #2843 UI shard recorded a first-attempt unrelated iOS WebKit Lesson Result textbox miss; CI #2847 passed both UI shards.
- The first manually transmitted large blob failed SHA verification and decoded as invalid UTF-8, so it was discarded and never attached to the branch.
- CI #2847 failed only five stable central compact hashes; one separate Dictionary empty-state first attempt was flaky and passed the existing contract on retry.

Root cause:

- independent fractional geometry serialization made an exact comparison more precise than the CSS invariant requires;
- complete-viewport content-addressed baselines necessarily changed when a visible global compact navigation label changed;
- manual reconstruction without raw-blob verification is unsafe for large UTF-8 Git objects;
- the isolated Dictionary empty-state mismatch was non-deterministic and did not reproduce on retry, so it did not justify a baseline change.

Fallback:

Do not attach any mismatching blob, weaken visual gates or promote a retry-only hash. If final CI exposes a new mismatch, inspect the exact Linux artifact and classify it before any further source change.

Limitations:

No physical-device result is claimed. Whole-application 200% browser zoom remains a later Issue #74 slice. The current branch is not merge-ready until full final-head CI passes.

Reusable lesson:

For global typography changes, treat content-addressed compact screenshots as expected downstream contracts, but promote them only after artifact-level review. Geometry assertions should encode a bounded browser precision tolerance rather than exact equality across separately serialized values. For large text writes, fetch the raw Git blob, reproduce its object SHA before modification, precompute the replacement SHA and verify the returned blob before advancing delivery.
