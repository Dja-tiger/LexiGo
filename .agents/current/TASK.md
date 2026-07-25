# Current Task

## Identity

- Issue: documentation/tooling task; no product Issue
- Branch: `chore/agent-harness-v1`
- Base SHA: `f2785be459a04b87511ab8d9f26d60b3da15669b`
- Head SHA: resolve from live branch ref; the file cannot self-encode its own mutable commit SHA
- PR: pending creation

## Objective

- Implement repository-based agent memory and a reproducible engineering harness.
- Preserve all existing production-safe rules and error lessons.
- Make current, completed and remaining work reconstructable from repository files.
- Do not change production behavior.

## Scope

Root entrypoint, AGENTS index integration, verified project state, skills registry, current-task memory, templates, reusable lessons, harness documentation, README entry, PR checklist and source-contract validation.

## Non-goals

No backend/frontend product code, API, migration, dependency, deployment, Figma, snapshot, scheduler, Progress, Scenario, Dictionary or Profile change.

## Allowed paths

- `AGENTS.md`
- `.agents/**`
- `docs/agent-harness.md`
- `README.md`
- `.github/pull_request_template.md`
- `scripts/ci/check-agent-harness.sh`

## Prohibited paths

All product/runtime/deployment/dependency paths not listed above.

## Runtime owners

None changed. Existing runtime ownership remains defined by `README.md`, `docs/architecture.md` and product code in `main`.

## Documentation owners

- Root entrypoint: `AGENTS.md`
- Normative index/rules: `.agents/AGENTS*.md`
- Current project state: `.agents/PROJECT_STATE.md`
- Stable procedures: `.agents/SKILLS.md`
- Current task records: `.agents/current/**`
- Full process: `docs/agent-harness.md`

## Invariants

- `main` remains unchanged until an approved squash merge.
- Existing `.agents/AGENTS.base.md` and specialized rules remain intact.
- The product branch for Issue #19 is not modified; live verification shows it is absent after PR #215.
- GitHub remains authoritative over saved state.
- No secrets, generated artifacts or temporary workflows are added.

## Acceptance criteria

- Required harness structure exists and links are valid.
- Existing AGENTS rules remain discoverable and authoritative.
- `PROJECT_STATE.md` reflects live GitHub, including closed Issue #19, merged PR #216, open Issue #24 and stage validation gap.
- `SKILLS.md`, current records, templates and lessons exist.
- README and PR template reference the harness.
- `scripts/ci/check-agent-harness.sh` passes.
- Diff is limited to allowed paths and required CI passes.

## Required checks

- Markdown structure and relative links
- `scripts/ci/check-agent-harness.sh`
- allowed-path compare
- secret-pattern scan
- generated-artifact scan
- existing cheap docs/source gates
- full required PR CI

## Risks

Documentation drift, self-referential branch metadata, stale project state and duplication of normative rules.

## Rollback

Revert the documentation/tooling commit. Product runtime and data remain unaffected.
