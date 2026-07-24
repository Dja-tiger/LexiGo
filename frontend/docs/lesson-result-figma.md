# Canonical Lesson Result

Issue: #194

Figma source of truth: `LexiGo Design System`, file key `3xXmBWnf38jbvLjtziwber`.

Production matrix:

- mobile complete `217:5`;
- mobile daily goal `217:6`;
- mobile next block `217:7`;
- mobile due review `217:8`;
- mobile sync pending / dark `217:9`;
- desktop complete `217:10`;
- desktop daily goal `217:11`;
- desktop next block `217:12`;
- desktop due review `217:13`;
- desktop sync pending / dark `217:14`.

`LessonResultPresentation` owns only the result presentation and interaction hierarchy. `LexigoPremiumApp` remains responsible for authenticated lesson lifecycle, review persistence, progress refresh, distinct next-lesson creation, route navigation, and recovery state.

The result distinguishes objective recall evidence from recognition and passive activity, restores after reload/history without resubmitting a review, prevents reopening the completed lesson through the continuation action, and presents one primary action for each result state.

Final validation must run from a normal developer-authored head after all one-time integration commits are removed. The required gate includes lint, typecheck, unit tests, production build, dependency audit, browser projects, accessibility, visual regression, performance budgets, and container builds.

Before validation, the reconstruction gate verifies that the complete production app is present, required Lesson Result ownership imports exist, and the file terminates normally rather than accepting a partial generated artifact.

The two compiler-oriented React lint exceptions remain scoped to the monolithic runtime owner. Reload, browser-history restoration, duplicate-submit prevention, focus ownership and retry behavior remain mandatory executable contracts; the rules stay enabled for every presentation component and all new code outside that owner.
