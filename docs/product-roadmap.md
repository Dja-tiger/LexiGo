# LexiGo product roadmap

## Product objective

LexiGo should help technical specialists retrieve the right English word or phrase during real work, not merely browse a vocabulary catalog.

The product loop is:

1. understand what should be learned now;
2. actively recall an item;
3. receive immediate feedback;
4. save the result and schedule the next review;
5. see evidence of progress;
6. return to the exact unfinished context.

## North-star metric

**Weekly retained technical items** — distinct words or phrases successfully recalled and then successfully recalled again during a later spaced review.

## Current product stage

Implemented foundations:

- account and cross-device progress;
- personal due queue and spaced repetition;
- configurable lessons and technical phrase practice;
- persistent unfinished vocabulary lessons;
- daily goal, streak and vocabulary-state metrics.

The main usability gap was information architecture. The application behaved as one long screen: browser Back left the product, visual cards were not navigation, and users could not predict where a click would lead.

## P0 — coherent product navigation

User outcome: users can move through LexiGo like a real application and safely use browser Back and Forward.

Scope:

- URL-backed views: Home, Learn, Phrases, Library, Progress, Profile and Lesson;
- History API integration for internal transitions;
- clickable logo, navigation, dashboard metrics, product cards and phrase previews;
- dedicated useful content for every top-level view;
- mobile bottom navigation;
- page titles and stable direct URLs;
- PWA cache refresh.

Acceptance criteria:

- after Home → Phrases → phrase details, browser Back returns to Phrases and then Home;
- browser Forward restores the same application states;
- clicking the LexiGo logo always returns Home without a full reload;
- every dashboard card has a meaningful destination;
- parts-of-speech cards open a preselected lesson setup;
- a phrase card opens translation, example and usage guidance;
- navigation remains usable on mobile and as an installed PWA.

## P1 — durable technical phrase learning

User outcome: phrase practice contributes to the same persistent learning loop as vocabulary.

Scope:

- move phrase content into a shared backend learning-item model;
- persist Again / Almost / Known reviews;
- schedule phrase repetitions;
- include phrases in progress and retained-item metrics;
- resume interrupted phrase lessons.

Success metric: weekly retained technical phrases and phrase review completion rate.

## P1 — onboarding diagnostic and adaptive queue

User outcome: a new user receives useful material immediately instead of an undifferentiated backlog of 579 words.

Scope:

- short calibration across vocabulary levels and parts of speech;
- capture technical interests and common work situations;
- combine due items, recent mistakes, weak topics and a controlled share of new items;
- explain why an item is in the lesson.

Success metric: first rated lesson completion and day-7 learning retention.

## P1 — weekly learning report

User outcome: users understand what they retained, where they struggle and what to do next.

Scope:

- retained items, not only viewed items;
- recall versus multiple-choice performance;
- weak topics and parts of speech;
- due-backlog trend;
- recommended next-week focus.

Success metric: report-to-lesson conversion and week-over-week retained items.

## P2 — workplace transfer

- scenario lessons for incidents, architecture reviews, releases and status updates;
- user-created team terminology and workplace phrases;
- pronunciation and listening exercises;
- lightweight confidence checks after real workplace use;
- controlled experiments for lesson size, feedback and reminders.

## Product guardrails

- no credit for opening or revealing a card;
- no artificial pressure that prioritizes streak over learning quality;
- no visual element should look interactive without a meaningful action;
- browser navigation must never silently discard a saved lesson;
- typed recall and recognition results remain analytically distinct;
- no personal names or examples without explicit user input;
- scheduling changes must remain deterministic, tested and reversible.
