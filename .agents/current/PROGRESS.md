# Current Task Progress

## 2026-08-21 10:10 Europe/Moscow

### Verified

- live repository: `Dja-tiger/LexiGo`;
- exact base/main remains `cb7559cca2160c4c1cd2e9e9fcd90770e13f7e49`;
- no open PR existed for `feat/issue-638-custom-phrases` before publication;
- Issue #638 is the Phase 5 backend gap under parent #25;
- branch remains 0 behind `main` throughout implementation;
- private phrases reuse the existing `words(kind='phrase')` + `user_words` scheduler rather than a second SRS;
- authenticated phrase catalog/detail already consume owner-scoped rows, while public projections require `owner_user_id is null`;
- global phrase slug lookup stays unambiguous because private slugs are server-generated with 128 bits of cryptographic randomness and preserve the existing global slug uniqueness contract.

### Implemented

- migration `000023_custom_phrases.up.sql` widens `words_private_scope_chk` only from private words to private `word|phrase`, still restricted to `source='user-custom-v1'`;
- `CreateCustomPhraseRequest` with bounded normalization for `lemma`, `translation`, `phonetic`, `topic`, `note`, `cloze`, `clozeAnswer`;
- required phrase shape enforces exactly one `_____` cloze marker and server-owned `partOfSpeech='phrase'`;
- canonical slug `custom-phrase-<128-bit hex>` generated via Go standard library `crypto/rand`;
- transactional phrase insert plus exactly one `user_words` enrollment;
- same-owner normalized `(lemma, translation)` duplicate detection with independent cross-account ownership;
- owner-safe delete restricted by id + owner + kind + private source, with active lesson discard before existing FK cascade cleanup;
- authenticated `POST /api/v1/phrases/custom` and `DELETE /api/v1/phrases/custom/{phraseID}` routes;
- unit tests for normalization, bounds, cloze shape and slug canonicality/distinctness;
- real PostgreSQL integration test for ownership, catalog/detail visibility, public isolation, scheduler participation, duplicate behavior, custom-word compatibility, lesson/review reuse and active-lesson deletion;
- complete OpenAPI 3.1 document updated additively from version `0.17.0` to `0.18.0` using a full Git blob/tree replacement rather than a partial file write;
- `UserWord` OpenAPI now truthfully documents `kind`, phrase `slug`, `cloze` and `clozeAnswer` returned by the existing runtime model;
- shared custom-glossary OpenAPI parser/version/error-field assertion synchronized after producer/consumer audit proved it was a downstream contract owner; glossary v1 runtime/schema remains unchanged.

### Read-back evidence

- migration blob: `aa53f6514cefb8814fc3f21508535e16efc6cc6e`;
- custom phrase model/validation blob: `c162166265dea9dbdf88229a2d1e0b0557718eaa`;
- repository blob: `afeceb310ef4221d3c671c8a6ee37cf120ebe136`;
- HTTP blob: `75f3f4052ce0679a80b0aa195097d3d461cfba18`;
- feature OpenAPI source-test blob: `6ee71b6436af124302d30c770527e2354718055d`;
- complete OpenAPI blob: `bfce514293a1c38288f842c24317eb4c28f034fe`;
- synchronized shared OpenAPI contract test blob: `2ea3eb488925353e9e4c4b1ac4b67d9b16a6d470`.

### Checks passed before PR

- branch started from exact live `main` and remained 0 behind through the latest compare;
- all runtime files were read back after guarded writes;
- complete OpenAPI blob was fetched back from GitHub before being attached to the branch tree;
- stale exact assertions for OpenAPI `0.17.0` and the previous Error field enum were traced to the shared glossary OpenAPI test and synchronized;
- diff remains limited to explicit task paths plus that proven shared contract consumer;
- no frontend/design/workflow/dependency files changed.

### Checks pending

- repository Go formatting/static/unit/security gates;
- complete OpenAPI YAML parse in the existing Go contract test;
- real PostgreSQL integration suite including `custom_phrases_test.go`;
- full immutable-head CI;
- PR review/thread audit;
- expected-head squash merge;
- exact-main CI plus exact-SHA Stage/public validation.

### Tooling limitation

A local clone could not be obtained in the execution container because external DNS/network access was unavailable. No validation was skipped silently: complete-file read-back was performed through GitHub Git Data APIs, and compile/YAML/PostgreSQL checks are delegated to the repository's authoritative CI environment.

### Current branch state

Before this progress write, compare was 9 commits ahead / 0 behind `main`; latest product/shared-contract head was `f5c6ab2a7b3ab6bf1bb659fbe87b2768acc7314b`.

### Next action

Read back updated Agent Harness state, open Draft PR from the exact branch head, then run and inspect the full repository CI. Fix only deterministic failures attributable to Issue #638; do not expand into UI/design or glossary-v1 feature scope.
