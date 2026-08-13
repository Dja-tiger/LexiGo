export type WebKitGuardServiceWorkerCancellationInput = {
  browserName: string;
  errorName: string;
  errorMessage: string;
  guardServiceWorkerURL: string | null;
};

export function normalizeRuntimePageError(name: string, message: string): string {
  const diagnostic = [name.trim(), message.trim()].filter(Boolean).join(": ");
  return diagnostic
    .replace(/^Error:\s*/i, "")
    .replace(/^Cannot load (https?):\s*\/{1,2}/i, "Cannot load $1://");
}

export function isExpectedWebKitGuardServiceWorkerCancellation(
  input: WebKitGuardServiceWorkerCancellationInput,
): boolean {
  if (input.browserName !== "webkit" || !input.guardServiceWorkerURL) return false;
  return normalizeRuntimePageError(input.errorName, input.errorMessage)
    === `Cannot load ${input.guardServiceWorkerURL} due to access control checks.`;
}
