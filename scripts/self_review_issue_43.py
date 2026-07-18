from pathlib import Path


def replace_once(path: str, old: str, new: str, label: str) -> None:
    file_path = Path(path)
    text = file_path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one marker, found {count}")
    file_path.write_text(text.replace(old, new, 1), encoding="utf-8")


replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '''  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("reset_token")?.trim() ?? "";
    if (!token) return;
''',
    '''  useEffect(() => {
    const target = new URL(window.location.href);
    const fragment = new URLSearchParams(target.hash.replace(/^#/, ""));
    const token = fragment.get("reset_token")?.trim()
      || target.searchParams.get("reset_token")?.trim()
      || "";
    if (!token) return;
''',
    "fragment-first reset bootstrap",
)

replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '''  function removeResetTokenFromURL() {
    const target = new URL(window.location.href);
    target.searchParams.delete("reset_token");
    window.history.replaceState(
      { lexigo: true, view: "profile" },
      "",
      target.pathname + (target.searchParams.size ? `?${target.searchParams.toString()}` : ""),
    );
  }
''',
    '''  function removeResetTokenFromURL() {
    const target = new URL(window.location.href);
    target.searchParams.delete("reset_token");
    target.hash = "";
    window.history.replaceState(
      { lexigo: true, view: "profile" },
      "",
      target.pathname + (target.searchParams.size ? `?${target.searchParams.toString()}` : ""),
    );
  }
''',
    "reset token URL cleanup",
)

replace_once(
    "frontend/e2e/auth-flow.spec.ts",
    '  await page.goto("/?view=profile&reset_token=one-time-token");\n',
    '  await page.goto("/?view=profile#reset_token=one-time-token");\n',
    "fragment reset browser flow",
)
replace_once(
    "frontend/e2e/auth-flow.spec.ts",
    '  await expect(page).not.toHaveURL(/reset_token=/);\n',
    '  await expect(page).not.toHaveURL(/reset_token=/);\n  await expect(page).toHaveURL(/\\?view=profile$/);\n',
    "reset fragment cleanup assertion",
)

replace_once(
    "backend/internal/auth/password_recovery_sender.go",
    '\t"log/slog"\n\t"net"\n',
    '\t"log/slog"\n\t"mime"\n\t"net"\n',
    "MIME subject import",
)
replace_once(
    "backend/internal/auth/password_recovery_sender.go",
    '\t\t"Subject: Восстановление пароля LexiGo",\n',
    '\t\t"Subject: " + mime.BEncoding.Encode("UTF-8", "Восстановление пароля LexiGo"),\n',
    "RFC 2047 subject encoding",
)

replace_once(
    "docs/password-recovery.md",
    "4. The raw token is placed in a same-origin URL as `reset_token` and delivered by SMTP.\n",
    "4. The raw token is placed in the URL fragment as `#reset_token=...` and delivered by SMTP. Fragments are not sent in HTTP requests or Referer headers.\n",
    "password reset fragment documentation",
)
replace_once(
    "docs/password-recovery.md",
    "- the frontend never displays or stores the reset token outside component memory and the current URL;\n",
    "- the frontend never displays or persists the reset token outside component memory and the current URL fragment; legacy query links remain readable for rollout compatibility;\n",
    "password reset token storage documentation",
)
