# Current Task Execution

## Task

- Issue: #638 — private custom phrases / parent #25 Phase 5
- Branch: `feat/issue-638-custom-phrases`
- Base SHA: `cb7559cca2160c4c1cd2e9e9fcd90770e13f7e49`
- PR: not opened yet at this record

## Skills used

### GitHub repository operations

Purpose:

Safely reconstruct live state, isolate Issue #638, publish guarded commits, preserve complete large-file content, and prepare immutable PR delivery.

Instruction source:

- `AGENTS.md`
- `.agents/AGENTS.md`
- `.agents/AGENTS.base.md`
- `.agents/AGENTS.tool-selection.md`
- `.agents/SKILLS.md`
- `docs/agent-harness.md`
- installed GitHub skill `skills://plugins/github/github/skill.md`

Version or verification date:

2026-08-21 against live `main@cb7559cca2160c4c1cd2e9e9fcd90770e13f7e49`.

Inputs:

Issue #25 parent acceptance; delivered foundations #481/#482, #485/#486, #489/#493/#494/#495, #497/#498; live phrase/custom-word persistence, OpenAPI, integration tests and Agent Harness rules.

Files inspected:

- custom-word request/repository/HTTP/glossary owners;
- phrase persistence and slug validator;
- `words` repository public/authenticated owner filters;
- phrase and lesson integration tests;
- server route registration;
- migrations `000005_persistent_phrases.up.sql` and `000022_custom_words.up.sql`;
- complete `api/openapi.yaml` blob;
- `custom_glossary_openapi_contract_test.go` as a downstream full-document OpenAPI parser/version consumer;
- OpenPencil screen map for UI-gap classification;
- mandatory Agent Harness rules.

Actions performed:

- proved UI remains design-gated and selected an independent backend phrase-ownership slice;
- created Issue #638 and isolated branch from exact main;
- widened the private DB scope without changing shared catalog ownership;
- implemented bounded phrase request validation and cryptographically random server-owned slugs;
- implemented transactional phrase create/enrollment and owner-safe deletion;
- registered authenticated create/delete routes;
- added deterministic unit/source and real PostgreSQL integration coverage;
- fetched the complete large OpenAPI blob, constructed a complete additive `0.18.0` replacement, created/read back a new Git blob, then attached it through a single tree/commit fast-forward;
- audited downstream exact OpenAPI consumers and synchronized only the proven glossary contract test assertion; no glossary runtime or v1 portability behavior changed;
- continuously rechecked `main`, branch divergence and allowed-path diff.

Commands or procedures:

GitHub connector exact branch/file/blob/tree/commit/ref operations; source searches; commit comparison; branch-explicit read-backs. Local clone was attempted only as an optional validation convenience and abandoned when the execution container had no external DNS/network.

Artifacts produced:

- Issue #638;
- branch `feat/issue-638-custom-phrases`;
- migration `000023_custom_phrases.up.sql`;
- custom phrase validation/repository/HTTP/test owners;
- PostgreSQL integration test `custom_phrases_test.go`;
- OpenAPI `0.18.0` additive contract;
- synchronized shared OpenAPI full-document contract test;
- populated `.agents/current/**` task records.

Result:

Implementation is complete enough for authoritative repository CI. The product slice remains backend/API/migration only and reuses the established scheduler.

Failures:

- one read-only branch REST URL containing `/` was rejected by the connector allow-list before mutation;
- optional local clone/download was unavailable because the execution container lacked external DNS/network.

Root cause:

Tool/environment constraints, not repository defects.

Fallback:

- branch existence and head state were verified through branch search/compare;
- complete OpenAPI was manipulated through GitHub Git Data blobs/trees with pre-commit read-back;
- compile, YAML structural parse and PostgreSQL execution are delegated to the repository's authoritative CI runners.

Limitations:

No local authoritative test execution is claimed. PR CI is mandatory before readiness/merge.

Reusable lessons:

- private phrase support must preserve globally unambiguous slug lookup while detail resolution can see shared and owner rows;
- do not generalize custom-word/glossary-v1 runtime merely to share code when an additive phrase owner is sufficient;
- when a large canonical file cannot be safely patched incrementally, create/read-back a complete blob before moving the branch ref;
- source changes to a shared specification require a downstream exact-consumer audit, including version and textual enum assertions.

### Backend validation

Purpose:

Protect PostgreSQL ownership, phrase shape, scheduler enrollment, deletion, existing custom-word compatibility and OpenAPI structure.

Instruction source:

- `.agents/SKILLS.md` Backend validation
- `.agents/AGENTS.issue-19-completion.md`
- `.agents/AGENTS.issue-132-openapi-structure.md`
- `.agents/AGENTS.issue-199-phrases.md`

Version or verification date:

2026-08-21.

Implementation contract:

- owner rows remain `source='user-custom-v1'`;
- custom phrase `kind='phrase'` and `part_of_speech='phrase'`;
- phrase shape includes non-empty canonical slug/cloze/cloze_answer;
- cloze request contains exactly one `_____` marker;
- private slug is generated server-side from 128 random bits;
- create + user_words enrollment is one transaction;
- owner duplicate is normalized `(lemma, translation)`; equivalent content is allowed for another owner;
- public catalog excludes owner content;
- deletion requires owner+kind+source and discards a containing active lesson first;
- custom-word and `lexigo-custom-glossary-v1` behavior is unchanged.

Validation ladder:

1. source/read-back and producer/consumer audit — completed;
2. complete OpenAPI blob read-back — completed;
3. Go unit/static/security and full YAML parse — pending CI;
4. real PostgreSQL integration — pending CI;
5. complete immutable-head CI — pending;
6. review/thread audit — pending;
7. expected-head squash merge — pending;
8. exact-main CI and exact-SHA Stage/public smoke — pending.

Current outcome:

No known deterministic source-contract blocker remains after synchronizing the shared OpenAPI version/error-field consumer.
