export type SessionResumeEnvironment = {
  windowTarget: Pick<Window, "addEventListener" | "removeEventListener">;
  documentTarget: Pick<Document, "addEventListener" | "removeEventListener"> & {
    visibilityState: DocumentVisibilityState;
  };
};

function browserEnvironment(): SessionResumeEnvironment | null {
  if (typeof window === "undefined" || typeof document === "undefined") return null;
  return { windowTarget: window, documentTarget: document };
}

export function subscribeToSessionResume(
  onResume: () => void,
  environment: SessionResumeEnvironment | null = browserEnvironment(),
): () => void {
  if (!environment) return () => undefined;

  const { windowTarget, documentTarget } = environment;
  const handleVisibility = () => {
    if (documentTarget.visibilityState === "visible") onResume();
  };

  windowTarget.addEventListener("online", onResume);
  windowTarget.addEventListener("pageshow", onResume);
  documentTarget.addEventListener("visibilitychange", handleVisibility);

  return () => {
    windowTarget.removeEventListener("online", onResume);
    windowTarget.removeEventListener("pageshow", onResume);
    documentTarget.removeEventListener("visibilitychange", handleVisibility);
  };
}
