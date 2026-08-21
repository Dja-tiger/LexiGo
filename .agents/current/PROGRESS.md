# Current Task Progress

## 2026-08-21 04:24 Europe/Moscow

### Verified

- live repository: `Dja-tiger/LexiGo`;
- exact base/main: `cb7559cca2160c4c1cd2e9e9fcd90770e13f7e49`;
- no open PRs at task start;
- Issue #638 created as Phase 5 of parent #25;
- branch `feat/issue-638-custom-phrases` created from exact base;
- `.agents/current/**` was canonical/clean before task start;
- current custom-word foundation is owner-scoped and scheduler-backed through `words` + `user_words`;
- current phrase model already shares `words` + `user_words`, and authenticated phrase catalog/detail filters already permit owner rows;
- migration `000022_custom_words.up.sql` intentionally forbids owner rows unless `kind='word'` and `source='user-custom-v1'`;
- `words_phrase_shape_chk` requires non-empty slug/cloze/cloze_answer;
- current global phrase slug index plus `GetPhraseBySlug` means allowing user-controlled private slugs could create ambiguous shared/private lookup;
- repository has no slug-generation helper and backend has no UUID dependency.

### Finding

The smallest safe backend gap is private custom phrase create/delete with a server-owned globally unique canonical slug. Existing custom-word and glossary-v1 APIs do not need to be generalized or changed.

### Root cause

Phase 2 of #25 deliberately delivered custom **words** only. The parent product intent includes user words/phrases, but the database constraint and create/delete handlers still enforce word-only ownership. Phrases already use the same scheduler entity, so a second SRS would be incorrect.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`

### Checks passed

- branch compare after first write: ahead 1 / behind 0, only `.agents/current/TASK.md` changed;
- TASK read-back blob: `fca85e288e9623bda0ffa8c1a02f288564969519`;
- `main` re-read unchanged at exact base after the first branch write.

### Checks failed

- one branch-ref read through a raw REST URL containing `/` in the branch name was rejected by the connector URL allow-list with HTTP 400 before any GitHub mutation. Ref existence was then confirmed through `search_branches` and `compare_commits`; no repository recovery was required because the rejected call was read-only.

### Current branch head

Resolve from live branch ref after this write; previous verified commit was `d7232a9fbb719d5f7fecc3ddf432593031dae763`.

### Next action

Write/read-back EXECUTION, inspect exact phrase integration/OpenAPI owners, then implement migration + request validation + repository/HTTP routes + deterministic tests without touching frontend/design/custom-glossary-v1 behavior.
