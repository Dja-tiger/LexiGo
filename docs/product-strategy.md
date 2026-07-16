# LexiGo product strategy

## Product promise

LexiGo helps technical specialists turn passive English knowledge into language they can recall and use during incidents, design discussions, code reviews and delivery work.

The product should optimize for durable recall and workplace transfer, not for the number of cards viewed.

## Primary user job

> When I need English at work, help me quickly retrieve the right word or phrase and use it with confidence.

## Current product diagnosis

The application already provides authentication, a technical vocabulary catalog, configurable lesson blocks, active-recall cards, multiple-choice support and technical phrase chunks. The main missing link is persistence: an answer currently does not change the learner's future queue or provide durable evidence of progress.

Without a closed learning loop, the product behaves like a content viewer. The next product stage must turn every answer into an adaptive decision.

## Product goals

### Goal 1 — Close the learning loop

Every rated word must update its repetition state, next due date and review history.

Success criteria:

- 100% of completed word ratings create a review event;
- the next due date changes immediately;
- failed recall returns sooner than successful recall;
- the same word cannot be updated for another user.

### Goal 2 — Make daily value visible

Users must understand what is due, what they completed today and whether they are building durable knowledge.

Success criteria:

- dashboard shows due now, reviews today, daily goal, streak and mastered words;
- progress updates immediately after each rating;
- daily goal is configurable and stored per account.

### Goal 3 — Optimize for recall, not exposure

Default lessons should prefer active recall, immediate corrective feedback and mixed practice. Multiple choice remains scaffolding, not the primary success metric.

Success criteria:

- typed recall remains the default mode;
- feedback follows every answer;
- mixed lessons interleave parts of speech;
- product analytics distinguish recall mode from recognition mode in a later iteration.

### Goal 4 — Transfer learning into technical work

Technical phrases should be taught as reusable chunks with context, cloze prompts and scenario grouping.

Success criteria:

- phrase catalog covers incidents, troubleshooting, architecture, data engineering, delivery and release communication;
- phrase progress is persisted in a subsequent iteration;
- users can practice production, not only recognition.

## North-star metric

**Weekly retained technical items:** the number of distinct words or phrases successfully recalled during the week that were also successfully recalled in a later spaced review.

This metric is preferable to lessons completed because it combines engagement with learning durability.

## Supporting metrics

- activation: first completed rated lesson within 24 hours of registration;
- day-7 learning retention: user completes at least one review on day 7;
- review completion rate: rated items / lesson items opened;
- successful recall rate by mode;
- median due backlog;
- percentage of active users meeting their daily goal;
- technical phrase usage confidence, collected later through lightweight self-report.

## Prioritized roadmap

### P0 — implemented in the current iteration

- persistent review endpoint;
- spaced scheduling for Again / Almost / Known;
- review history;
- progress summary;
- configurable daily goal;
- streak and mastered-word counters;
- frontend integration and immediate progress refresh.

### P1

- persist technical phrase reviews;
- resume interrupted lessons;
- onboarding diagnostic to estimate known vocabulary;
- adaptive lesson composition based on due backlog and weak topics;
- weekly progress report with retained-item cohorts.

### P2

- pronunciation and listening exercises;
- user-created workplace phrases;
- scenario lessons for incidents, architecture reviews and status updates;
- experiment framework for lesson size, reminders and feedback wording.

## Product guardrails

- no artificial streak pressure that hides poor learning outcomes;
- no credit for merely opening or revealing a card;
- no personal examples or names without explicit user input;
- no production metric should reward volume while ignoring recall quality;
- all scheduling changes must be deterministic, tested and reversible.
