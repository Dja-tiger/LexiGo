# Current Task Progress

## 2026-08-24 Stage 6b

### Verified

- Live `main` before branching: `4412209b771edab470223d6dd683be5fc73b05f4`.
- No open pull requests existed before branch creation.
- Stage 6a runtime attribution is delivered in `review_events.session_kind` and `selection_reason`.
- Issue #651 still explicitly requires analytics separation for `new_learned`, `due_reviewed`, `remediation_reviewed`, `review_backlog`, `lapses`, and `retention`.
- Existing Progress aggregates are primarily answer-mode/global metrics; no process analytics object exists yet.
- Existing retained-items evidence uses successful recall events but does not exclude an explicitly attributed Study recall session.

### Finding

Stage 6a created the immutable evidence required to aggregate learning processes correctly. Stage 6b can now add analytics without guessing process intent from `answer_mode`.

### Root cause

Before Stage 6a, review events did not persist session intent, so Progress could only aggregate by interaction mode. That made Study / Review / Remediation separation impossible without semantic inference.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`

### Checks passed

- Live open-PR gate: none.
- Exact base main SHA verified.
- Downstream-consumer rule and OpenAPI structural rule read before write.
- Current backend Progress producer, frontend validator/types and Stage 6a queue/event attribution audited.

### Checks failed

- None.

### Current branch head

Resolve from live branch ref after implementation commit.

### Next action

Apply the bounded cross-layer process analytics contract, run targeted checks, open Draft PR, then run immutable-head full CI.
