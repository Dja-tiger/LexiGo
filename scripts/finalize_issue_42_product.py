from pathlib import Path


def replace_once(path: str, old: str, new: str, label: str) -> None:
    file_path = Path(path)
    text = file_path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one marker, found {count}")
    file_path.write_text(text.replace(old, new, 1), encoding="utf-8")


component = "frontend/components/lexigo-premium-app.tsx"
replace_once(
    component,
    'import { csrfTokenFromCookie, refreshSession, type Session } from "../lib/auth-session";\n',
    'import { csrfTokenFromCookie, isSessionPayload, refreshSession, type Session } from "../lib/auth-session";\n',
    "session validator import",
)
replace_once(
    component,
    '''      const authenticated = await requestJSON<Session>(`/api/v1/auth/${authMode}`, {
        method: "POST",
        body: JSON.stringify({ email, password, ...(authMode === "register" ? { displayName } : {}) }),
      });
      setSession(authenticated);
      setPassword("");
      setHydratedUserID("");
      await hydrateAccount(authenticated);
      setHydratedUserID(authenticated.user.id);
      navigate({ view: returnView === "profile" ? "home" : returnView });
''',
    '''      const authenticated = await requestJSON<Session>(`/api/v1/auth/${authMode}`, {
        method: "POST",
        body: JSON.stringify({ email, password, ...(authMode === "register" ? { displayName } : {}) }),
      }, undefined, isSessionPayload);
      setSession(authenticated);
      setPassword("");
      setHydratedUserID("");
      navigate({ view: returnView === "profile" ? "home" : returnView });
''',
    "independent post-auth hydration",
)
replace_once(
    "frontend/lib/account-resources.test.ts",
    '''    const { dueNow: _dueNow, ...missingDueNow } = PROGRESS;
    expect(isProgressSummaryPayload(missingDueNow)).toBe(false);
''',
    '''    expect(isProgressSummaryPayload({ ...PROGRESS, dueNow: undefined })).toBe(false);
''',
    "unused test binding",
)
