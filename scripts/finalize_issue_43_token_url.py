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
    '''    const timer = window.setTimeout(() => {
      setResetToken(token);
      setAuthMode("reset");
      setReturnView("profile");
      setAuthFieldErrors({});
      setAuthFormError("");
      setAuthNotice("");
    }, 0);
''',
    '''    const timer = window.setTimeout(() => {
      target.searchParams.delete("reset_token");
      target.hash = "";
      window.history.replaceState(
        { lexigo: true, view: "profile" },
        "",
        target.pathname + (target.searchParams.size ? `?${target.searchParams.toString()}` : ""),
      );
      setResetToken(token);
      setAuthMode("reset");
      setReturnView("profile");
      setAuthFieldErrors({});
      setAuthFormError("");
      setAuthNotice("");
    }, 0);
''',
    "immediate reset bearer URL cleanup",
)

replace_once(
    "frontend/e2e/auth-flow.spec.ts",
    '''  await expect(page.getByRole("heading", { name: "Создайте новый пароль" })).toBeVisible();
  await expect(page.locator("#auth-password")).toHaveAttribute("name", "password");
''',
    '''  await expect(page.getByRole("heading", { name: "Создайте новый пароль" })).toBeVisible();
  await expect(page).toHaveURL(/\?view=profile$/);
  await expect(page.locator("#auth-password")).toHaveAttribute("name", "password");
''',
    "reset bearer removed before form interaction",
)

replace_once(
    "docs/password-recovery.md",
    "- the frontend never displays or persists the reset token outside component memory and the current URL fragment; legacy query links remain readable for rollout compatibility;\n",
    "- the frontend reads the token from the URL fragment into component memory and immediately removes fragment/query credentials with `history.replaceState`; legacy query links remain readable for rollout compatibility;\n",
    "immediate token cleanup documentation",
)
