# Active Lesson — production source mapping

Issue: `#193`

Figma file: `LexiGo Design System`

- fileKey: `3xXmBWnf38jbvLjtziwber`
- page: `14 — Active Lesson Screens` (`75:2`)

## Canonical production references

| Production state | Figma node |
| --- | --- |
| Compact mobile Recall prompt | `75:6` |
| Compact mobile Recall correct | `75:30` |
| Compact mobile Choice incorrect | `75:89` |
| Desktop Study light | `75:120` |
| Desktop Recall correct | `75:150` |

`75:57` is the offline/sync presentation and is intentionally excluded from this slice. It remains owned by Issue `#202`.

## Code ownership

- `components/active-lesson-presentation.tsx` owns the focused visual and accessibility presentation.
- `app/active-lesson.css` owns responsive layout and token mapping.
- `lib/active-lesson-presentation.ts` owns pure presentation-state derivation.
- `components/lexigo-premium-app.tsx` continues to own authentication, active-session loading, review submission, `lessonVersion`, server-controlled position, completion and navigation lifecycle.
- `components/review-outbox-runtime.tsx` continues to own queued review delivery.

The presentation component must not call the API, calculate the next server position, complete the lesson or redesign offline/outbox behavior.

## Verification matrix

- compact mobile: 390 × 844 and minimum 320 px width;
- medium/tablet: 768 × 1024;
- desktop: 1440 px;
- Light and Dark semantic tokens;
- keyboard-only Recall and Choice;
- safe-exit dialog focus trap and return;
- 200% zoom and no horizontal overflow;
- reduced motion;
- blocking axe audit;
- Linux visual-regression baselines.
