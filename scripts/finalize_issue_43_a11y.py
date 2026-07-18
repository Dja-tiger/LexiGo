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
    '''            {passwordMode ? (
              <label htmlFor="auth-password">
                <span>{resetMode ? "Новый пароль" : "Пароль"}</span>
                <span className="lx-password-control">
                  <input
                    id="auth-password"
                    name="password"
                    type={passwordVisible ? "text" : "password"}
                    required
                    minLength={authMode === "login" ? undefined : 10}
                    maxLength={72}
                    autoComplete={authMode === "login" ? "current-password" : "new-password"}
                    value={password}
                    aria-invalid={Boolean(authFieldErrors.password)}
                    aria-describedby={[passwordDescriptionID, authFieldErrors.password ? "auth-password-error" : ""].filter(Boolean).join(" ") || undefined}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      clearAuthFieldError("password");
                      if (passwordConfirmation) clearAuthFieldError("passwordConfirmation");
                    }}
                  />
                  <button
                    type="button"
                    className="lx-password-toggle"
                    aria-pressed={passwordVisible}
                    aria-label={passwordVisible ? "Скрыть пароль" : "Показать пароль"}
                    onClick={() => setPasswordVisible((current) => !current)}
                  >
                    {passwordVisible ? "Скрыть" : "Показать"}
                  </button>
                </span>
                {authFieldErrors.password ? <small id="auth-password-error" className="lx-field-error" role="alert">{authFieldErrors.password}</small> : null}
              </label>
            ) : null}
''',
    '''            {passwordMode ? (
              <div className="lx-auth-field">
                <label htmlFor="auth-password">{resetMode ? "Новый пароль" : "Пароль"}</label>
                <span className="lx-password-control">
                  <input
                    id="auth-password"
                    name="password"
                    type={passwordVisible ? "text" : "password"}
                    required
                    minLength={authMode === "login" ? undefined : 10}
                    maxLength={72}
                    autoComplete={authMode === "login" ? "current-password" : "new-password"}
                    value={password}
                    aria-invalid={Boolean(authFieldErrors.password)}
                    aria-describedby={[passwordDescriptionID, authFieldErrors.password ? "auth-password-error" : ""].filter(Boolean).join(" ") || undefined}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      clearAuthFieldError("password");
                      if (passwordConfirmation) clearAuthFieldError("passwordConfirmation");
                    }}
                  />
                  <button
                    type="button"
                    className="lx-password-toggle"
                    aria-pressed={passwordVisible}
                    aria-label={passwordVisible ? "Скрыть пароль" : "Показать пароль"}
                    onClick={() => setPasswordVisible((current) => !current)}
                  >
                    {passwordVisible ? "Скрыть" : "Показать"}
                  </button>
                </span>
                {authFieldErrors.password ? <small id="auth-password-error" className="lx-field-error" role="alert">{authFieldErrors.password}</small> : null}
              </div>
            ) : null}
''',
    "password toggle outside label",
)

replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '''                <ul id="auth-password-requirements" className="lx-password-requirements" aria-label="Требования к паролю">
                  {requirements.map((requirement) => (
                    <li key={requirement.id} className={requirement.met ? "met" : ""}>
''',
    '''                <ul id="auth-password-requirements" className="lx-password-requirements" aria-label="Требования к паролю" aria-live="polite">
                  {requirements.map((requirement) => (
                    <li
                      key={requirement.id}
                      className={requirement.met ? "met" : ""}
                      aria-label={`${requirement.label}: ${requirement.met ? "выполнено" : "не выполнено"}`}
                    >
''',
    "live password requirement semantics",
)

replace_once(
    "frontend/app/premium-ui.css",
    '''.lx-auth-card label > span:first-child { color: #aab5c8; }
''',
    '''.lx-auth-card label, .lx-auth-field > label { color: #aab5c8; }
.lx-auth-field { display: grid; gap: 7px; }
''',
    "auth field layout",
)

e2e_path = Path("frontend/e2e/auth-flow.spec.ts")
e2e_text = e2e_path.read_text(encoding="utf-8")
assertion_marker = '''  await expect(page.locator("#auth-password")).toHaveAttribute("autocomplete", "new-password");
  await expect(page.locator("#auth-passwordConfirmation")).toHaveAttribute("autocomplete", "new-password");
'''
if e2e_text.count(assertion_marker) != 2:
    raise SystemExit(f"password accessibility browser assertions: expected two markers, found {e2e_text.count(assertion_marker)}")
e2e_text = e2e_text.replace(
    assertion_marker,
    assertion_marker
    + '''  await expect(page.locator("#auth-password").locator("xpath=ancestor::label")).toHaveCount(0);
  await expect(page.locator("#auth-password-requirements")).toHaveAttribute("aria-live", "polite");
''',
    1,
)
e2e_path.write_text(e2e_text, encoding="utf-8")

replace_once(
    "frontend/e2e/auth-flow.spec.ts",
    '''  await page.locator("#auth-password").fill("short");
  await expect(page.locator(".lx-password-requirements li").first()).not.toHaveClass(/met/);
  await page.locator("#auth-password").fill("correct horse battery staple");
  await expect(page.locator(".lx-password-requirements li").first()).toHaveClass(/met/);
''',
    '''  await page.locator("#auth-password").fill("short");
  await expect(page.locator(".lx-password-requirements li").first()).not.toHaveClass(/met/);
  await expect(page.locator(".lx-password-requirements li").first()).toHaveAttribute("aria-label", "Не менее 10 символов: не выполнено");
  await page.locator("#auth-password").fill("correct horse battery staple");
  await expect(page.locator(".lx-password-requirements li").first()).toHaveClass(/met/);
  await expect(page.locator(".lx-password-requirements li").first()).toHaveAttribute("aria-label", "Не менее 10 символов: выполнено");
''',
    "live password requirement browser assertions",
)
