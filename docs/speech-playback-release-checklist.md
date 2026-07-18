# Speech playback release checklist

Issue #51 replaces the previous application-level speech helper with a lifecycle-owned React control. Automated tests cover state transitions, `voiceschanged`, deterministic English voice selection, stop semantics, navigation cleanup, phrase binding and unsupported browsers. They do not prove that a real device has usable audio output.

## Required physical matrix

Record device model, OS/browser version, installed voice language, silent-mode state, output route and result.

| Platform | Required checks |
| --- | --- |
| iPhone Safari | Home preview, phrase detail and lesson card; start, stop, replay, navigate away, lock/unlock screen. |
| Installed iPhone PWA | Cold launch, first playback after launch, repeated playback, app background/foreground, Bluetooth and device speaker. |
| iPad Safari / PWA | Portrait and landscape, hardware keyboard activation, Split View, voice list loaded after page render. |
| Android Chrome | Device speaker, Bluetooth, language pack present/absent, repeated start/stop, tab background/foreground. |
| macOS Safari | Local English voice selection, stop during playback, navigation cleanup, VoiceOver announcement. |
| Desktop Chrome | Local and remote English voices, error recovery, keyboard activation. |

## Per-scenario checks

1. The control reads exactly the word or phrase shown in its card, not text from a neighbouring heading.
2. The first tap starts or prepares playback and changes the accessible label to `Остановить произношение`.
3. A second tap stops playback without immediately starting another utterance.
4. End, browser cancellation and navigation restore the idle label.
5. A real playback error leaves a retryable control and a visible explanation.
6. A browser without Web Speech support shows a disabled control and visible fallback guidance.
7. English voice selection prefers a local `en-GB` voice, then `en-US`, then another English voice.
8. Loading voices after initial render does not require a reload.
9. Verify both EventTarget-style `voiceschanged` and the older Safari `onvoiceschanged` property path where available.
10. No stale audio continues after moving to another route or lesson item.
11. Screen-reader focus and announcement remain stable after start, stop, end and error.
12. The production `node:22-alpine` Web image completes its multi-stage build and contains the Next.js standalone output.

## Release blockers

Do not release when any of the following is reproduced:

- a second tap restarts instead of stopping playback;
- audio continues after route navigation or lesson-card change;
- the control speaks text extracted from another DOM element;
- the control remains visually active after end/error/cancel;
- unsupported browsers show an enabled control that does nothing;
- an English voice is available but a non-English voice is selected;
- a playback error is silent or cannot be retried;
- the production Web container cannot be built from `frontend/Dockerfile`.
