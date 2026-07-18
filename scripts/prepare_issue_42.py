from pathlib import Path


def replace_once(path: str, old: str, new: str, label: str) -> None:
    file_path = Path(path)
    text = file_path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one marker, found {count}")
    file_path.write_text(text.replace(old, new, 1), encoding="utf-8")


apply_path = Path("scripts/apply_issue_42.py")
apply_text = apply_path.read_text(encoding="utf-8")
old_import = 'import { csrfTokenFromCookie, refreshSession, type Session } from "../lib/auth-session";\\n'
new_import = 'import { csrfTokenFromCookie, isSessionPayload, refreshSession, type Session } from "../lib/auth-session";\\n'
positions: list[int] = []
start = 0
while True:
    position = apply_text.find(old_import, start)
    if position < 0:
        break
    positions.append(position)
    start = position + len(old_import)
if len(positions) != 2:
    raise SystemExit(f"session validator import: expected two codemod markers, found {len(positions)}")
position = positions[-1]
apply_path.write_text(
    apply_text[:position] + new_import + apply_text[position + len(old_import):],
    encoding="utf-8",
)

replace_once(
    str(apply_path),
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
