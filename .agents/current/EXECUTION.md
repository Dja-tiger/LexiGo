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
- exact local Git object hashes for candidate test files.

Files inspected:

- all mandatory repository Harness documents;
- canonical, adaptive and late Figma navigation CSS owners;
- route navigation runtime and history owners;
- focused mobile-navigation test;
- all visual specifications reported by CI #2843;
- downloaded Playwright reports and attached PNG artifacts for failed UI and visual jobs.

Actions performed:

- continued the already-open atomic Issue #74 slice instead of starting a new task;
- verified the live branch, PR and immutable CI #2843 head;
- localized the focused failure to a 0.000025 CSS px serialization difference, not a reserve defect;
- added a bounded 0.1 CSS px geometry tolerance while preserving the required navigation-height-plus-20px invariant;
- extracted every changed compact screenshot from CI #2843 and manually reviewed the rendered deltas;
- confirmed that changed visuals preserve route geometry and differ meaningfully only in the intended bottom-navigation label typography;
- promoted content-addressed compact hashes and immutable CI provenance in phrases, profile, system-state and word-detail visual owners;
- retained both manually reviewed compact-light Profile hashes because Linux masked-profile rasterization produced a bounded three-pixel difference without a meaningful rendered change;
- verified all five replacement files by exact local Git blob SHA;
- created Git blobs, a Git tree and commit `c4b682b1f5469cb39e623394501df89494ddb9e9`, then advanced the branch without force-push;
- rejected an attempted large `visual-regression.spec.ts` blob because its SHA differed from the exact local object and it decoded as invalid UTF-8;
- reconciled `TASK.md` so reviewed compact visual owners are explicitly allowed and unrelated baselines remain prohibited;
- updated progress and execution handoff before further product writes.

Commands or procedures:

GitHub connector reads/writes, workflow/job and artifact inspection, Playwright trace extraction, manual PNG review, local `git hash-object`, exact Git blob/tree/commit construction, non-force branch update and readback verification. Local results are used only for object-integrity verification; GitHub CI remains authoritative for product acceptance.

Artifacts produced:

- bounded focused geometry assertion;
- reviewed compact visual hashes with CI #2843 provenance;
- exact Git blobs for five test owners;
- commit `c4b682b1f5469cb39e623394501df89494ddb9e9`;
- updated `.agents/current/**` handoff;
- CI #2844, later superseded by required handoff commits.

Result:

The runtime/CSS candidate remains unchanged. Five exact test owners now encode the intended compact navigation result, and the focused geometry contract tolerates browser serialization noise without weakening product reserve. The central `visual-regression.spec.ts` compact hash reconciliation remains pending because no exact transport for its 20.5 KB replacement has yet been proven.

Failures:

- CI #2843 focused reserve assertion failed by 0.000025 CSS px.
- CI #2843 visual gate rejected intended compact screenshots containing the updated navigation.
- One UI shard recorded a first-attempt unrelated iOS WebKit Lesson Result textbox miss.
- The first manually transmitted large blob failed SHA verification and decoded as invalid UTF-8.

Root cause:

- independent fractional geometry serialization made an exact comparison more precise than the CSS invariant requires;
- complete-viewport content-addressed baselines necessarily changed when a visible global compact navigation label changed;
- the connector has no mounted-file or batch upload parameter for Git blob creation, so manual large payload reconstruction is unsafe unless exact SHA verification succeeds.

Fallback:

Do not attach any mismatching blob or weaken visual gates. Keep the reviewed local file and either use a transport that preserves the exact Git object or refactor the affected baseline constants into a smaller owned module only if that refactor remains transparent, test-equivalent and within the atomic Issue #74 scope.

Limitations:

No physical-device result is claimed. Whole-application 200% browser zoom remains a later Issue #74 slice. The current branch is not merge-ready until the central visual owner is reconciled and full immutable-head CI passes.

Reusable lesson:

For global typography changes, treat content-addressed compact screenshots as expected downstream contracts, but promote them only after artifact-level review. Geometry assertions should encode a bounded browser precision tolerance rather than exact equality across separately serialized values. Never attach a connector-created Git blob until its SHA matches the locally expected object.
