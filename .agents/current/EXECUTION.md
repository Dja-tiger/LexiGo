# Current Task Execution

## Task

- Branch: `feat/issue-638-custom-phrases`
- Base SHA: `cb7559cca2160c4c1cd2e9e9fcd90770e13f7e49`
- Head SHA: resolve from live branch ref
- PR: not opened yet

## Skills used

### GitHub repository operations

Purpose:

Safely reconstruct live state, create Issue #638/isolated branch, constrain paths, write/read-back task memory and prepare guarded PR delivery.

Instruction source:

- `AGENTS.md`
- `.agents/AGENTS.md`
- `.agents/AGENTS.base.md`
- `.agents/AGENTS.tool-selection.md`
- `.agents/SKILLS.md`
- `docs/agent-harness.md`

Version or verification date:

2026-08-21 task pre-flight against `main@cb7559cca2160c4c1cd2e9e9fcd90770e13f7e49`.

Inputs:

Issue #25 parent acceptance, delivered child issues/PRs #481/#482, #485/#486, #489/#493/#494/#495, #497/#498, live source and migrations.

Files inspected:

- custom-word request/repository/HTTP/glossary owners;
- phrase persistence and slug validator;
- server route registration;
- repository authenticated/public catalog filtering;
- migration `000005_persistent_phrases.up.sql`;
- migration `000022_custom_words.up.sql`;
- OpenPencil screen map for UI-gap classification;
- mandatory Agent Harness rules and public architecture docs.

Actions performed:

- completed parent #25 foundation audit;
- proved no canonical listening/pronunciation/custom-vocabulary UI frames exist, so UI work remains design-gated;
- identified private custom phrases as an independent backend gap;
- created child Issue #638;
- created branch from exact verified main;
- wrote and read back task/pre-flight state.

Commands or procedures:

GitHub connector live reads/searches, exact branch creation, branch-explicit contents writes and post-write read-back/main verification.

Artifacts produced:

- Issue #638;
- branch `feat/issue-638-custom-phrases`;
- `.agents/current/TASK.md` and `PROGRESS.md` task records.

Result:

Pre-flight supports one backend/API/migration slice. No frontend/design dependency is required for this phase.

Failures:

One read-only REST branch URL containing a slash was rejected by the connector URL allow-list with HTTP 400.

Root cause:

The generic fetch URL validator did not accept the unescaped slash-containing branch path.

Fallback:

Used branch search and commit comparison, which confirmed the ref and exact diff without any mutation.

Limitations:

OpenAPI is a large file; mutation strategy must preserve the complete YAML document and must be followed by whole-document structural parsing. If connector file-size handling is unsuitable, use a verified local clone solely to construct/test complete file content, then publish through guarded repository writes.

Reusable lesson:

Private phrase support must preserve slug lookup uniqueness. Do not make private slug uniqueness merely owner-scoped while `GET /api/v1/phrases/{slug}` can see both shared and owner rows; generate a globally unique canonical private slug instead.

### Backend validation

Purpose:

Protect PostgreSQL ownership, phrase shape, scheduler enrollment, deletion and OpenAPI contracts.

Instruction source:

- `.agents/SKILLS.md` Backend validation
- `.agents/AGENTS.issue-19-completion.md`
- `.agents/AGENTS.issue-132-openapi-structure.md`
- `.agents/AGENTS.issue-199-phrases.md`

Version or verification date:

2026-08-21.

Inputs:

Existing `words`/`user_words` model, phrase catalog/detail consumers and custom-word integration tests.

Files inspected:

See task pre-flight above.

Actions performed:

Producer/consumer and transaction-boundary audit completed before runtime code.

Commands or procedures:

Planned validation ladder: Go formatting/unit/source -> OpenAPI YAML parse -> PostgreSQL integration -> full repository CI -> exact-main CI -> exact-SHA Stage/public smoke.

Artifacts produced:

Issue #638 acceptance matrix and explicit allowed-path contract.

Result:

Implementation can reuse current scheduler and owner filters without a parallel model.

Failures:

None yet in product validation.

Root cause:

N/A.

Fallback:

If integration reveals a shared primitive is necessary, stop and expand allowed paths only to the proven owner; do not silently generalize custom-word/glossary-v1 code.

Limitations:

No local test run has been performed yet; implementation has not started.

Reusable lesson:

Cross-layer acceptance is not satisfied by widening a database constraint alone. Request validation, persistence, owner-safe read/delete consumers, OpenAPI and real PostgreSQL evidence must move together.
