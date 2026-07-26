export const APPEARANCE_STORAGE_KEY = "lexigo.appearance.v1";
export const APPEARANCE_CHANGED_EVENT = "lexigo:appearance-changed";
export const APPEARANCE_DARK_QUERY = "(prefers-color-scheme: dark)";

export const APPEARANCE_THEME_COLORS = {
  light: "#f4f7f5",
  dark: "#10211d",
} as const;

export type AppearancePreference = "auto" | "light" | "dark";
export type ResolvedAppearance = Exclude<AppearancePreference, "auto">;

type AppearanceDocument = Pick<Document, "documentElement" | "querySelectorAll">;
type AppearanceStorage = Pick<Storage, "getItem" | "setItem">;
type AppearanceMediaQuery = Pick<MediaQueryList, "matches" | "addEventListener" | "removeEventListener">;

function storageOrNull(): AppearanceStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function mediaQueryOrNull(): AppearanceMediaQuery | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return null;
  return window.matchMedia(APPEARANCE_DARK_QUERY);
}

export function normalizeAppearancePreference(value: unknown): AppearancePreference {
  return value === "light" || value === "dark" || value === "auto" ? value : "auto";
}

export function resolveAppearance(
  preference: AppearancePreference,
  systemPrefersDark: boolean,
): ResolvedAppearance {
  if (preference === "light" || preference === "dark") return preference;
  return systemPrefersDark ? "dark" : "light";
}

export function readAppearancePreference(storage: AppearanceStorage | null = storageOrNull()): AppearancePreference {
  if (!storage) return "auto";
  try {
    return normalizeAppearancePreference(storage.getItem(APPEARANCE_STORAGE_KEY));
  } catch {
    return "auto";
  }
}

export function persistAppearancePreference(
  preference: AppearancePreference,
  storage: AppearanceStorage | null = storageOrNull(),
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(APPEARANCE_STORAGE_KEY, preference);
    return true;
  } catch {
    return false;
  }
}

export function applyAppearancePreference(
  preference: AppearancePreference,
  options: {
    document?: AppearanceDocument | null;
    systemPrefersDark?: boolean;
  } = {},
): ResolvedAppearance {
  const documentTarget = options.document ?? (typeof document === "undefined" ? null : document);
  const systemPrefersDark = options.systemPrefersDark ?? mediaQueryOrNull()?.matches ?? false;
  const resolved = resolveAppearance(preference, systemPrefersDark);

  if (!documentTarget) return resolved;

  const root = documentTarget.documentElement;
  root.dataset.lexigoAppearance = preference;
  root.dataset.lexigoResolvedAppearance = resolved;
  root.style.colorScheme = resolved;

  documentTarget.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    meta.content = APPEARANCE_THEME_COLORS[resolved];
    meta.dataset.lexigoResolvedAppearance = resolved;
  });

  return resolved;
}

export function setAppearancePreference(preference: AppearancePreference): {
  persisted: boolean;
  resolved: ResolvedAppearance;
} {
  const normalized = normalizeAppearancePreference(preference);
  const persisted = persistAppearancePreference(normalized);
  const resolved = applyAppearancePreference(normalized);

  if (typeof window !== "undefined" && typeof CustomEvent !== "undefined") {
    window.dispatchEvent(new CustomEvent<AppearancePreference>(APPEARANCE_CHANGED_EVENT, {
      detail: normalized,
    }));
  }

  return { persisted, resolved };
}

export function subscribeAppearanceRuntime(
  onPreference?: (preference: AppearancePreference, resolved: ResolvedAppearance) => void,
): () => void {
  if (typeof window === "undefined" || typeof document === "undefined") return () => undefined;

  const mediaQuery = mediaQueryOrNull();

  const applyStoredPreference = () => {
    const preference = readAppearancePreference();
    const resolved = applyAppearancePreference(preference, {
      document,
      systemPrefersDark: mediaQuery?.matches ?? false,
    });
    onPreference?.(preference, resolved);
  };

  const handleSystemAppearance = () => {
    if (readAppearancePreference() !== "auto") return;
    applyStoredPreference();
  };
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== APPEARANCE_STORAGE_KEY) return;
    applyStoredPreference();
  };
  const handleLocalChange = () => applyStoredPreference();

  applyStoredPreference();
  mediaQuery?.addEventListener("change", handleSystemAppearance);
  window.addEventListener("storage", handleStorage);
  window.addEventListener(APPEARANCE_CHANGED_EVENT, handleLocalChange);

  return () => {
    mediaQuery?.removeEventListener("change", handleSystemAppearance);
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(APPEARANCE_CHANGED_EVENT, handleLocalChange);
  };
}

export function createAppearanceBootstrapScript(): string {
  const key = JSON.stringify(APPEARANCE_STORAGE_KEY);
  const query = JSON.stringify(APPEARANCE_DARK_QUERY);
  const lightColor = JSON.stringify(APPEARANCE_THEME_COLORS.light);
  const darkColor = JSON.stringify(APPEARANCE_THEME_COLORS.dark);

  return `(()=>{const d=document.documentElement;let p="auto";try{const v=localStorage.getItem(${key});if(v==="light"||v==="dark"||v==="auto")p=v}catch{}const r=p==="dark"||p==="auto"&&matchMedia(${query}).matches?"dark":"light";d.dataset.lexigoAppearance=p;d.dataset.lexigoResolvedAppearance=r;d.style.colorScheme=r;const c=r==="dark"?${darkColor}:${lightColor};document.querySelectorAll('meta[name="theme-color"]').forEach((m)=>{m.content=c;m.dataset.lexigoResolvedAppearance=r})})();`;
}
