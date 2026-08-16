import {
  isCanonicalRoutePath,
  navigationURL,
  parseNavigation,
  type NavigationTarget,
} from "./navigation";

const RETURN_PARAMETER = "return_to";
const RETURN_BASE = "https://lexigo.invalid";
const AUTHENTICATION_RETURN_VIEWS = new Set<NavigationTarget["view"]>([
  "library",
  "phrases",
  "onboarding",
]);

export function authenticationURL(returnTarget: NavigationTarget): string {
  const parameters = new URLSearchParams({
    [RETURN_PARAMETER]: navigationURL(returnTarget),
  });
  return `/profile?${parameters.toString()}`;
}

export function catalogAuthenticationReturn(search: string): NavigationTarget | null {
  const parameters = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const raw = parameters.get(RETURN_PARAMETER);
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;

  let parsedURL: URL;
  try {
    parsedURL = new URL(raw, RETURN_BASE);
  } catch {
    return null;
  }
  if (parsedURL.origin !== RETURN_BASE || !isCanonicalRoutePath(parsedURL.pathname)) return null;

  const target = parseNavigation(parsedURL.search, parsedURL.pathname);
  if (!AUTHENTICATION_RETURN_VIEWS.has(target.view)) return null;
  return target;
}