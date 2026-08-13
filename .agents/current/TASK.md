# Current Task

## Identity

- Issue: #497 — `[Medium][Learning][#25 Phase 4] Add local pronunciation recorder platform foundation`
- Branch: `feat/issue-497-local-pronunciation-recorder`
- Base SHA: `98773d95a65c864b66084eae731eb643786bc7a7`
- Head SHA: resolve from live branch ref
- PR: pending

## Objective

Add one non-visual browser platform owner for optional pronunciation self-recording. Capture starts only from an explicit caller action, recordings remain ephemeral/in-memory, and no server/storage/analytics path is introduced.

## Scope

- `frontend/lib/pronunciation-recorder.ts` lifecycle owner;
- explicit user-triggered start that acquires one audio MediaStream;
- unsupported/requesting/recording/recorded/denied/error state contract;
- allowlisted MediaRecorder MIME selection;
- bounded duration with deterministic auto-stop;
- stop/cancel/dispose track cleanup;
- object-URL ownership/revocation;
- unit and source-contract tests;
- focused architecture/privacy documentation if required.

## Non-goals

- no visual control, route, Figma or CSS changes;
- no cloud provider, upload, server endpoint or persistence;
- no speech-to-text/pronunciation score;
- no background recording;
- no scheduler/listening-event changes;
- no changes to the existing Issue #51 speech player.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/lib/pronunciation-recorder.ts`
- `frontend/lib/pronunciation-recorder.test.ts`
- `frontend/lib/pronunciation-recorder-source.test.ts`
- `docs/architecture.md` only if the ownership/privacy contract requires a durable note

## Prohibited paths

- `frontend/components/**`
- `frontend/app/**`
- `frontend/e2e/**` in this non-visual foundation slice
- backend/API/database paths
- Figma/design artifacts
- service worker/cache owners
- analytics/performance owners
- deployment workflows/configuration

## Runtime owners

- New `frontend/lib/pronunciation-recorder.ts`: sole local capture/recording lifecycle owner.
- Existing `frontend/components/speech-player-button.tsx`: unchanged speech playback owner.

## Documentation owners

- `.agents/current/**`
- `docs/architecture.md` only for the durable privacy boundary.

## Invariants

- Constructing/importing the owner performs no capture request.
- `startRecording()` is the only method that calls `getUserMedia`.
- At most one live MediaStream/MediaRecorder belongs to one owner instance.
- All tracks stop on stop, cancel, recorder error and dispose.
- Raw audio never enters fetch/XHR, storage, analytics or service-worker caches.
- Recordings exist only as one owned Blob/object URL in memory; replaced/disposed URLs are revoked.
- A denied/unsupported recorder cannot block text or existing speech playback learning paths.

## Acceptance criteria

- no side effect on construction;
- stable unsupported and permission-denied states;
- explicit start can produce one bounded local recording;
- deterministic stop/auto-stop/cancel/dispose cleanup;
- allowlisted MIME feature detection;
- unit/source contracts prove lifecycle and no side channel;
- existing frontend core/build and speech-player tests remain green.

## Required checks

- frontend lint/typecheck/unit/build;
- focused recorder unit/source contracts;
- full immutable-head CI before merge;
- clean PR diff and review-thread audit.

## Risks

- leaking a live audio track after error/cancel/navigation;
- double-start races producing two streams/recorders;
- stale object URLs retaining audio longer than intended;
- browser differences in MIME support and permission errors;
- accidental introduction of network or persistent-storage behavior.

## Rollback

Revert the standalone library/tests/docs slice. No persistence/schema/API migration exists and no current UI imports the new owner yet.
