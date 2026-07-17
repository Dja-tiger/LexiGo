from pathlib import Path

path = Path("frontend/components/lexigo-premium-app.tsx")
text = path.read_text()


def replace_once(old: str, new: str, label: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    text = text.replace(old, new, 1)


replace_once(
    '''  navigationURL,
  parseNavigation,
  PRIMARY_NAVIGATION,
''',
    '''  isRestorableNavigation,
  navigationURL,
  NAVIGATION_STORAGE_KEY,
  parseNavigation,
  parseStoredNavigation,
  PRIMARY_NAVIGATION,
''',
    "navigation imports",
)

replace_once(
    '''function localizeAPIMessage(message: string): string {
  const normalized = message.trim().toLowerCase();
  if (normalized.includes("invalid credentials") || normalized.includes("invalid token")) {
    return "Неверный email или пароль. Проверьте данные и попробуйте снова.";
  }
  return message;
}

class APIError extends Error {
''',
    '''function localizeAPIMessage(message: string): string {
  const normalized = message.trim().toLowerCase();
  if (normalized.includes("invalid credentials") || normalized.includes("invalid token")) {
    return "Неверный email или пароль. Проверьте данные и попробуйте снова.";
  }
  return message;
}

function isStandaloneDisplayMode(): boolean {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return navigatorWithStandalone.standalone === true
    || window.matchMedia?.("(display-mode: standalone)").matches === true;
}

function readPersistedNavigation(): NavigationTarget | null {
  try {
    const target = parseStoredNavigation(window.localStorage.getItem(NAVIGATION_STORAGE_KEY));
    if (!target) window.localStorage.removeItem(NAVIGATION_STORAGE_KEY);
    return target;
  } catch {
    return null;
  }
}

function persistNavigation(target: NavigationTarget) {
  if (!isRestorableNavigation(target)) return;
  try {
    window.localStorage.setItem(NAVIGATION_STORAGE_KEY, JSON.stringify(target));
  } catch {
    // URL navigation remains authoritative when standalone storage is restricted.
  }
}

class APIError extends Error {
''',
    "standalone navigation helpers",
)

replace_once(
    '''      data-lexigo-collection={definition.source}
      className={`lx-themed-${variant} lx-collection-${definition.source}${selected ? " selected" : ""}`}
''',
    '''      data-lexigo-collection={definition.source}
      data-lexigo-source={definition.source}
      data-lexigo-dictionary-source={variant === "library" ? definition.source : undefined}
      className={`lx-themed-${variant} lx-collection-${definition.source}${selected ? " selected" : ""}`}
''',
    "collection selectors",
)

replace_once(
    '''  useEffect(() => {
    const syncNavigation = () => {
      const next = parseNavigation(window.location.search);
      setNavigation(next);
      if (next.source) setSource(next.source);
    };
    syncNavigation();
    window.addEventListener("popstate", syncNavigation);
    return () => {
      window.removeEventListener("popstate", syncNavigation);
    };
  }, []);
''',
    '''  useEffect(() => {
    const applyNavigation = (next: NavigationTarget) => {
      setNavigation(next);
      if (next.source) setSource(next.source);
      persistNavigation(next);
    };
    const syncNavigationFromURL = () => applyNavigation(parseNavigation(window.location.search));

    const explicitNavigation = window.location.search.length > 0;
    const restored = !explicitNavigation && isStandaloneDisplayMode()
      ? readPersistedNavigation()
      : null;
    if (restored) {
      window.history.replaceState({ lexigo: true, ...restored }, "", navigationURL(restored));
      applyNavigation(restored);
    } else {
      syncNavigationFromURL();
    }

    window.addEventListener("popstate", syncNavigationFromURL);
    return () => {
      window.removeEventListener("popstate", syncNavigationFromURL);
    };
  }, []);
''',
    "standalone launch restoration",
)

replace_once(
    '''    setNavigation(target);
    if (target.source) setSource(target.source);
    setError("");
''',
    '''    setNavigation(target);
    if (target.source) setSource(target.source);
    persistNavigation(target);
    setError("");
''',
    "navigation persistence",
)

replace_once(
    '''                <button key={option.value} type="button" className={source === option.value ? "selected" : ""} onClick={() => setSource(option.value)}>
''',
    '''                <button key={option.value} type="button" data-lexigo-source={option.value} aria-pressed={source === option.value} className={source === option.value ? "selected" : ""} onClick={() => setSource(option.value)}>
''',
    "source selector attributes",
)

replace_once(
    '''          {SOURCE_OPTIONS.map((option) => <button key={option.value} type="button" onClick={() => option.value === "phrases" ? navigate({ view: "phrases" }) : navigate({ view: "learn", source: option.value })}><span className={`lx-section-icon ${option.value}`}><Icon name={option.icon}/></span><strong>{option.label}</strong><small>{option.count} {option.value === "phrases" ? "фразы" : "слов"}</small><p>{option.hint}</p><em>Открыть <Icon name="arrow" size={15}/></em></button>)}
''',
    '''          {SOURCE_OPTIONS.map((option) => <button key={option.value} type="button" data-lexigo-dictionary-source={option.value} aria-label={`Открыть раздел: ${option.label}`} onClick={() => option.value === "phrases" ? navigate({ view: "phrases" }) : navigate({ view: "learn", source: option.value })}><span className={`lx-section-icon ${option.value}`}><Icon name={option.icon}/></span><strong>{option.label}</strong><small>{option.count} {option.value === "phrases" ? "фразы" : "слов"}</small><p>{option.hint}</p><em>Открыть <Icon name="arrow" size={15}/></em></button>)}
''',
    "dictionary source selectors",
)

path.write_text(text)
print("issue 37 navigation patch applied")
