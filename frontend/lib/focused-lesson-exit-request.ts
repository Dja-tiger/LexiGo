export const FOCUSED_LESSON_EXIT_REQUEST_EVENT = "lexigo:request-lesson-exit";

type FocusedLessonExitWindow = Window & {
  __lexigoPendingFocusedLessonExitRequest?: boolean;
};

function requestWindow(): FocusedLessonExitWindow {
  return window as FocusedLessonExitWindow;
}

/**
 * Publishes a safe-exit request and keeps it pending until Active Lesson
 * consumes it. The pending bit is intentionally stored on window rather than
 * in a module singleton so it survives route-island chunk remounts and module
 * evaluation order without persisting beyond the current document.
 */
export function requestFocusedLessonExit(): void {
  requestWindow().__lexigoPendingFocusedLessonExitRequest = true;
  window.dispatchEvent(new Event(FOCUSED_LESSON_EXIT_REQUEST_EVENT));
}

/**
 * Atomically claims the current safe-exit request. A mounted presentation
 * consumes it from the event listener; a presentation remounted by Next.js
 * consumes the same request from its layout effect.
 */
export function consumeFocusedLessonExitRequest(): boolean {
  const host = requestWindow();
  const pending = host.__lexigoPendingFocusedLessonExitRequest === true;
  if (pending) {
    delete host.__lexigoPendingFocusedLessonExitRequest;
  }
  return pending;
}
