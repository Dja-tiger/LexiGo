# Issue #19 completion contract

## Scope

This follow-up completes the remaining weekly retained-learning acceptance criterion without redesigning `/progress`:

- aggregate weak Recall evidence by actionable part of speech (`noun`, `verb`, `adjective`);
- expose the evidence as `weekly.weakPartsOfSpeech`;
- combine topic and part-of-speech evidence into no more than three direct recommendations;
- start the existing durable due Recall flow with either `topic` or `source` filtering;
- retain the existing session cap, recovery gate and lesson persistence contracts.

## Non-goals

- Progress visual redesign;
- Scenario Lessons;
- scheduler changes;
- new lesson modes;
- broad route-island or CSS refactoring.

## Verification

- backend integration: API aggregation and due-source compatibility;
- frontend unit: validation, normalization and malformed evidence rejection;
- browser E2E: global, topic-filtered and source-filtered Recall lesson creation;
- existing mobile, WebKit, accessibility, visual, bundle and performance gates remain blocking.
