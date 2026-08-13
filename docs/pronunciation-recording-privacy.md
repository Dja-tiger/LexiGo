# Pronunciation recording privacy contract

Issue #497 / parent #25 Phase 4 establishes a browser-only foundation for optional pronunciation self-recording. It does not add a visual microphone control; later presentation work remains gated on canonical Figma nodes.

## Ownership

`frontend/lib/pronunciation-recorder.ts` is the sole owner of microphone capture and local recording lifecycle. Existing speech playback remains owned by the Issue #51 speech player and is independent from recording permission.

## Permission boundary

- importing or constructing the recorder does not request microphone access;
- microphone access is requested only from explicit `startRecording()` through `navigator.mediaDevices.getUserMedia({ audio: true, video: false })`;
- unsupported browsers and denied permission produce stable non-recording states and do not block text or speech-playback learning paths;
- concurrent starts cannot create multiple permission prompts or parallel recorder lifecycles.

## Data boundary

Raw microphone audio is local and ephemeral. The owner may hold one in-memory `Blob` and one object URL for playback by a future presentation layer. It does not use `fetch`, XHR, beacon delivery, IndexedDB, local/session storage, Service Worker caches, analytics or backend APIs. No database schema or server endpoint stores pronunciation recordings.

The recording MIME type is chosen only from an explicit feature-detected audio allowlist. Recording duration is capped at 30 seconds.

## Cleanup boundary

- stopping a recording stops every owned media track;
- cancellation, MediaRecorder failure and owner disposal also stop every owned track;
- a permission request that resolves after cancel/dispose immediately stops the late stream and never starts a recorder;
- replacing, clearing or disposing a completed clip revokes the previously owned object URL;
- disposal is terminal for the owner instance.

## Product boundary

This phase is intentionally non-visual. It does not define microphone button copy, placement, permission education, pronunciation scoring or persistence. Those behaviors require a later design-driven slice with exact production Figma nodes and real browser/physical-device permission evidence.
