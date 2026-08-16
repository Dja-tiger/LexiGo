# Current Task

## Identity

- Issue: #18
- Branch: feat/issue-18-selection-reason
- Base SHA: 126d059f0ae980e7a50425a23a378c29a1e8b641
- Head SHA: resolve from live branch ref
- PR: #561

## Objective

Close the remaining Issue #18 product gap by preserving the server-owned lesson selection reason through the frontend Active Lesson boundary and showing the learner a concise truthful reason for each selected item.

## Scope

- Validate optional backend `reason` values on active lesson items.
- Preserve the validated reason in the frontend learning item model.
- Centralize visible reason copy.
- Render a compact visible reason in the existing focused Active Lesson card.
- Add regression coverage for contract, copy and source wiring.
- Verify the existing manual lesson composer still sends source, mode and size unchanged.

## Non-goals

- No scheduler or queue priority changes.
- No backend API/schema changes.
- No lesson composer redesign or new review-ratio controls.
- No OpenPencil/Figma source mutation.
- No deployment topology changes.

## Allowed paths

- .agents/current/TASK.md
- .agents/current/PROGRESS.md
- .agents/current/EXECUTION.md
- frontend/lib/account-resources.ts
- frontend/lib/account-resources.test.ts
- frontend/lib/interface-copy.ts
- frontend/lib/interface-copy.test.ts
- frontend/lib/learning.ts
- frontend/lib/active-lesson-presentation.test.ts
- frontend/components/lexigo-active-lesson-app.tsx
- frontend/components/active-lesson-presentation.tsx
- frontend/components/active-lesson-selection-reason-source.test.ts
- frontend/app/active-lesson.css

## Prohibited paths

- backend/**
- design/openpencil/**
- docs/figma/**
- deployment/**
- .github/workflows/**

## Runtime owners

- backend/internal/learning/lesson.go — server-owned selection reason contract, read only.
- frontend/lib/account-resources.ts — active lesson runtime validation.
- frontend/components/lexigo-active-lesson-app.tsx — API-to-presentation mapping.
- frontend/components/active-lesson-presentation.tsx — focused lesson presentation.
- frontend/app/active-lesson.css — focused lesson styling.

## Documentation owners

- .agents/current/** for task execution evidence.
- frontend/lib/interface-copy.ts for user-visible product terminology.

## Invariants

- Never fabricate a selection reason when the server omits it.
- Accept only the six backend reason values: recent_failure, due, weak_topic, new, scheduled, manual.
- Existing manual source/mode/size lesson creation remains unchanged.
- Active Lesson stays a focused route without global navigation.
- No axe rule, severity, security or CI relaxation.

## Acceptance criteria

- Active lesson payload accepts valid optional selection reasons and rejects unknown reason values.
- The current item visibly states a concise reason when one is present.
- recent_failure, due, weak_topic and new have explicit learner-facing copy; scheduled and manual also remain truthful.
- Missing reason produces no invented explanation.
- Existing manual lesson composer source/mode/size POST contract remains intact.
- Targeted unit/source tests and full immutable-head CI pass.

## Required checks

- Frontend unit tests covering account resource validation and Active Lesson reason copy.
- Source contract covering reason mapping into Active Lesson presentation.
- Full PR CI on immutable head, including Accessibility, UI shards and Visual.
- Review/thread/diff audit before Ready and merge.
- Exact-main CI and Stage because runtime frontend changes.

## Risks

- Visual layout shift on compact Active Lesson screens.
- Stale clients receiving an unknown future backend reason.
- Accidentally conflating item-selection reason with learning status or confidence.

## Rollback

Revert the frontend selection-reason slice; backend reason persistence and scheduler behavior are unchanged.
