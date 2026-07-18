from pathlib import Path


COMPONENT = Path("frontend/components/lexigo-premium-app.tsx")
CSS = Path("frontend/app/premium-ui.css")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one marker, found {count}")
    return text.replace(old, new, 1)


text = COMPONENT.read_text(encoding="utf-8")
text = replace_once(
    text,
    'import { csrfTokenFromCookie, isSessionPayload, refreshSession, type Session } from "../lib/auth-session";\n',
    'import {\n'
    '  isAcceptedResponse,\n'
    '  passwordRequirements,\n'
    '  presentAuthFailure,\n'
    '  validateAuthValues,\n'
    '  type AuthField,\n'
    '  type AuthFieldErrors,\n'
    '  type AuthMode,\n'
    '} from "../lib/auth-form";\n'
    'import { csrfTokenFromCookie, isSessionPayload, refreshSession, type Session } from "../lib/auth-session";\n',
    "auth form imports",
)

text = replace_once(
    text,
    '''function localizeAPIMessage(message: string): string {
  const normalized = message.trim().toLowerCase();
  if (normalized.includes("invalid credentials") || normalized.includes("invalid token")) {
    return "Неверный email или пароль. Проверьте данные и попробуйте снова.";
  }
  return message;
}

''',
    "",
    "remove message parsing",
)

text = replace_once(
    text,
    '''    throw new RequestFailure(failure.kind, localizeAPIMessage(failure.message), {
      status: failure.status,
      code: failure.code,
      cause: failure,
    });
''',
    '''    throw new RequestFailure(failure.kind, failure.message, {
      status: failure.status,
      code: failure.code,
      field: failure.field,
      cause: failure,
    });
''',
    "stable request error metadata",
)

text = replace_once(
    text,
    '''  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
''',
    '''  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [authFieldErrors, setAuthFieldErrors] = useState<AuthFieldErrors>({});
  const [authFormError, setAuthFormError] = useState("");
  const [authNotice, setAuthNotice] = useState("");
''',
    "auth form state",
)

navigation_effect_end = '''  }, []);

  useEffect(() => {
    const storageTimer = window.setTimeout(() => {
'''
reset_effect = '''  }, []);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("reset_token")?.trim() ?? "";
    if (!token) return;
    setResetToken(token);
    setAuthMode("reset");
    setReturnView("profile");
    setAuthFieldErrors({});
    setAuthFormError("");
    setAuthNotice("");
  }, []);

  useEffect(() => {
    const storageTimer = window.setTimeout(() => {
'''
text = replace_once(text, navigation_effect_end, reset_effect, "reset token bootstrap")

old_submit = '''  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const authenticated = await requestJSON<Session>(`/api/v1/auth/${authMode}`, {
        method: "POST",
        body: JSON.stringify({ email, password, ...(authMode === "register" ? { displayName } : {}) }),
      }, undefined, isSessionPayload);
      setSession(authenticated);
      setPassword("");
      setHydratedUserID("");
      navigate({ view: returnView === "profile" ? "home" : returnView });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось выполнить вход");
    } finally {
      setBusy(false);
    }
  }
'''
new_submit = '''  function clearAuthFieldError(field: AuthField) {
    setAuthFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setAuthFormError("");
  }

  function switchAuthMode(nextMode: AuthMode) {
    setAuthMode(nextMode);
    setAuthFieldErrors({});
    setAuthFormError("");
    setAuthNotice("");
    setPassword("");
    setPasswordConfirmation("");
    setPasswordVisible(false);
  }

  function focusFirstAuthError(errors: AuthFieldErrors) {
    const order: AuthField[] = ["displayName", "email", "password", "passwordConfirmation", "token"];
    const field = order.find((candidate) => Boolean(errors[candidate]));
    if (!field) return;
    window.requestAnimationFrame(() => document.getElementById(`auth-${field}`)?.focus());
  }

  function removeResetTokenFromURL() {
    const target = new URL(window.location.href);
    target.searchParams.delete("reset_token");
    window.history.replaceState(
      { lexigo: true, view: "profile" },
      "",
      target.pathname + (target.searchParams.size ? `?${target.searchParams.toString()}` : ""),
    );
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = { displayName, email, password, passwordConfirmation, token: resetToken };
    const validationErrors = validateAuthValues(authMode, values);
    if (Object.keys(validationErrors).length > 0) {
      setAuthFieldErrors(validationErrors);
      setAuthFormError("Исправьте отмеченные поля.");
      focusFirstAuthError(validationErrors);
      return;
    }

    setBusy(true);
    setError("");
    setAuthFieldErrors({});
    setAuthFormError("");
    setAuthNotice("");
    try {
      if (authMode === "forgot") {
        await requestJSON<{ accepted: true }>(
          "/api/v1/auth/password-reset/request",
          { method: "POST", body: JSON.stringify({ email: email.trim() }) },
          undefined,
          isAcceptedResponse,
        );
        setAuthNotice("Если аккаунт существует, письмо со ссылкой отправлено. Проверьте также папку «Спам».");
        return;
      }

      if (authMode === "reset") {
        await requestJSON<void>("/api/v1/auth/password-reset/confirm", {
          method: "POST",
          body: JSON.stringify({ token: resetToken, newPassword: password }),
        });
        setPassword("");
        setPasswordConfirmation("");
        setResetToken("");
        removeResetTokenFromURL();
        setAuthMode("login");
        setAuthNotice("Пароль изменён. Войдите с новым паролем.");
        return;
      }

      const authenticated = await requestJSON<Session>(`/api/v1/auth/${authMode}`, {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          password,
          ...(authMode === "register" ? { displayName: displayName.trim() } : {}),
        }),
      }, undefined, isSessionPayload);
      setSession(authenticated);
      setPassword("");
      setPasswordConfirmation("");
      setHydratedUserID("");
      navigate({ view: returnView === "profile" ? "home" : returnView });
    } catch (requestError) {
      const presentation = presentAuthFailure(requestError);
      setAuthFieldErrors(presentation.fieldErrors);
      setAuthFormError(presentation.formError);
      focusFirstAuthError(presentation.fieldErrors);
    } finally {
      setBusy(false);
    }
  }
'''
text = replace_once(text, old_submit, new_submit, "public auth submit flow")

start = text.find("  function renderProfile() {")
end = text.find("\n  function renderAllItems() {", start)
if start < 0 or end < 0:
    raise SystemExit("renderProfile section markers were not found")
new_profile = '''  function renderProfile() {
    if (!session) {
      const resetMode = authMode === "reset";
      const forgotMode = authMode === "forgot";
      const registrationMode = authMode === "register";
      const passwordMode = authMode === "login" || registrationMode || resetMode;
      const requirements = passwordRequirements(password);
      const title = resetMode
        ? "Создайте новый пароль"
        : forgotMode
          ? "Восстановите доступ"
          : "Сохраняйте прогресс на всех устройствах";
      const description = resetMode
        ? "Ссылка одноразовая. После смены пароля активные сессии на других устройствах будут завершены."
        : forgotMode
          ? "Укажите email аккаунта. Ответ не раскрывает, зарегистрирован ли адрес."
          : "Аккаунт нужен для интервальной очереди, продолжения уроков и недельной аналитики.";
      const submitLabel = busy
        ? "Отправляем…"
        : resetMode
          ? "Сохранить новый пароль"
          : forgotMode
            ? "Отправить ссылку"
            : authMode === "login"
              ? "Войти"
              : "Создать аккаунт";
      const passwordDescriptionID = authMode === "login" ? undefined : "auth-password-requirements";

      return (
        <section className="lx-auth-card">
          <div className="lx-auth-heading">
            <span>АККАУНТ</span>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>

          {!resetMode && !forgotMode ? (
            <div className="lx-auth-tabs" role="tablist" aria-label="Режим аккаунта">
              <button
                type="button"
                role="tab"
                aria-selected={authMode === "login"}
                className={authMode === "login" ? "active" : ""}
                onClick={() => switchAuthMode("login")}
              >
                Вход
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={registrationMode}
                className={registrationMode ? "active" : ""}
                onClick={() => switchAuthMode("register")}
              >
                Регистрация
              </button>
            </div>
          ) : null}

          {authNotice ? <p className="lx-auth-notice" role="status" aria-live="polite">{authNotice}</p> : null}
          {authFormError ? <p className="lx-auth-form-error" role="alert">{authFormError}</p> : null}

          <form onSubmit={submitAuth} noValidate aria-label={resetMode ? "Новый пароль" : forgotMode ? "Восстановление пароля" : registrationMode ? "Регистрация" : "Вход"}>
            {registrationMode ? (
              <label htmlFor="auth-displayName">
                <span>Имя</span>
                <input
                  id="auth-displayName"
                  name="name"
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="name"
                  value={displayName}
                  aria-invalid={Boolean(authFieldErrors.displayName)}
                  aria-describedby={authFieldErrors.displayName ? "auth-displayName-error" : undefined}
                  onChange={(event) => {
                    setDisplayName(event.target.value);
                    clearAuthFieldError("displayName");
                  }}
                  placeholder="Как к вам обращаться"
                />
                {authFieldErrors.displayName ? <small id="auth-displayName-error" className="lx-field-error" role="alert">{authFieldErrors.displayName}</small> : null}
              </label>
            ) : null}

            {!resetMode ? (
              <label htmlFor="auth-email">
                <span>Email</span>
                <input
                  id="auth-email"
                  name="username"
                  type="email"
                  inputMode="email"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoComplete="username"
                  value={email}
                  aria-invalid={Boolean(authFieldErrors.email)}
                  aria-describedby={authFieldErrors.email ? "auth-email-error" : undefined}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    clearAuthFieldError("email");
                  }}
                  placeholder="name@example.com"
                />
                {authFieldErrors.email ? <small id="auth-email-error" className="lx-field-error" role="alert">{authFieldErrors.email}</small> : null}
              </label>
            ) : null}

            {passwordMode ? (
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

            {(registrationMode || resetMode) ? (
              <>
                <ul id="auth-password-requirements" className="lx-password-requirements" aria-label="Требования к паролю">
                  {requirements.map((requirement) => (
                    <li key={requirement.id} className={requirement.met ? "met" : ""}>
                      <span aria-hidden="true">{requirement.met ? "✓" : "○"}</span>{requirement.label}
                    </li>
                  ))}
                </ul>
                <label htmlFor="auth-passwordConfirmation">
                  <span>Повторите пароль</span>
                  <input
                    id="auth-passwordConfirmation"
                    name="password-confirmation"
                    type={passwordVisible ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={passwordConfirmation}
                    aria-invalid={Boolean(authFieldErrors.passwordConfirmation)}
                    aria-describedby={authFieldErrors.passwordConfirmation ? "auth-passwordConfirmation-error" : undefined}
                    onChange={(event) => {
                      setPasswordConfirmation(event.target.value);
                      clearAuthFieldError("passwordConfirmation");
                    }}
                  />
                  {authFieldErrors.passwordConfirmation ? <small id="auth-passwordConfirmation-error" className="lx-field-error" role="alert">{authFieldErrors.passwordConfirmation}</small> : null}
                </label>
              </>
            ) : null}

            {authFieldErrors.token ? <p id="auth-token" className="lx-field-error lx-token-error" role="alert" tabIndex={-1}>{authFieldErrors.token}</p> : null}

            {authMode === "login" ? (
              <button className="lx-auth-link" type="button" onClick={() => switchAuthMode("forgot")}>Забыли пароль?</button>
            ) : null}

            <div className="lx-auth-actions">
              <button
                className="lx-button ghost"
                type="button"
                onClick={() => {
                  if (forgotMode || resetMode) switchAuthMode("login");
                  else navigate({ view: "home" });
                }}
              >
                {forgotMode || resetMode ? "К входу" : "Отмена"}
              </button>
              <button className="lx-button primary" type="submit" disabled={busy}>{submitLabel}</button>
            </div>
          </form>
        </section>
      );
    }
    return <><section className="lx-page-heading"><div><span>ПРОФИЛЬ</span><h1>{session.user.displayName || "Ваш аккаунт"}</h1><p>Настройки обучения и синхронизация между устройствами.</p></div><div className="lx-heading-badge"><Icon name="user"/><span>{session.user.email}</span></div></section><section className="lx-profile-grid"><article><span>Email</span><strong>{session.user.email}</strong><small>используется для входа</small></article><article><span>Аккаунт создан</span><strong>{formatAccountDate(session.user.createdAt)}</strong><small>история хранится на сервере</small></article><article><span>Дневная цель</span><strong>{progress?.dailyGoal ?? 30}</strong><small>ответов в день</small></article><article><span>Активный урок</span><strong>{activeLesson ? "Есть" : "Нет"}</strong><small>{activeLesson ? sourceLabel(activeLesson.source) : "можно начать новый"}</small></article></section><section className="lx-page-actions"><button className="lx-button ghost" type="button" onClick={logout}>Выйти</button><button className="lx-button primary" type="button" onClick={() => navigate({ view: "progress" })}>Открыть прогресс</button></section></>;
  }
'''
text = text[:start] + new_profile + text[end:]
COMPONENT.write_text(text, encoding="utf-8")

css = CSS.read_text(encoding="utf-8")
marker = '''.lx-profile-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 13px; margin-top: 18px; }
'''
addition = '''.lx-auth-heading { display: grid; gap: 8px; }
.lx-auth-heading > span { color: #65bfff; font-size: 11px; font-weight: 850; letter-spacing: .12em; }
.lx-auth-heading h1 { margin: 0; font-size: clamp(30px, 5vw, 44px); }
.lx-auth-heading p { margin: 0; color: #8f9bb1; line-height: 1.6; }
.lx-auth-notice, .lx-auth-form-error { margin: 18px 0 0; border-radius: 13px; padding: 12px 14px; line-height: 1.5; }
.lx-auth-notice { border: 1px solid rgba(53, 210, 139, .28); color: #bdf5df; background: rgba(15, 85, 61, .25); }
.lx-auth-form-error { border: 1px solid rgba(255, 91, 119, .3); color: #ffc1ca; background: rgba(108, 20, 41, .28); }
.lx-auth-card label > span:first-child { color: #aab5c8; }
.lx-auth-card input[aria-invalid="true"] { border-color: rgba(255, 91, 119, .68); box-shadow: 0 0 0 3px rgba(255, 91, 119, .1); }
.lx-password-control { position: relative; display: block; }
.lx-password-control input { padding-right: 108px; }
.lx-password-toggle { position: absolute; top: 50%; right: 7px; min-width: 88px; min-height: 36px; transform: translateY(-50%); border: 1px solid rgba(145, 168, 211, .18); border-radius: 9px; color: #c8cfdd; background: rgba(255,255,255,.04); font-size: 12px; font-weight: 760; }
.lx-password-toggle:hover, .lx-password-toggle:focus-visible { border-color: rgba(121, 95, 255, .55); color: white; }
.lx-field-error { color: #ffb1bd; font-size: 12px; font-weight: 650; line-height: 1.45; }
.lx-token-error { border: 1px solid rgba(255, 91, 119, .25); border-radius: 12px; padding: 12px; background: rgba(108, 20, 41, .2); }
.lx-password-requirements { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin: -4px 0 0; padding: 0; list-style: none; }
.lx-password-requirements li { display: flex; align-items: center; gap: 7px; border: 1px solid var(--lx-border); border-radius: 11px; padding: 9px 10px; color: #7e8ba0; background: rgba(255,255,255,.018); font-size: 12px; }
.lx-password-requirements li.met { border-color: rgba(53, 210, 139, .22); color: #8de5bd; background: rgba(53, 210, 139, .06); }
.lx-auth-link { width: fit-content; border: 0; padding: 2px 0; color: #9f85ff; background: transparent; font-size: 13px; font-weight: 760; text-decoration: underline; text-underline-offset: 4px; }
.lx-auth-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 5px; }

'''
if css.count(marker) != 1:
    raise SystemExit(f"auth CSS marker: expected one marker, found {css.count(marker)}")
css = css.replace(marker, addition + marker, 1)
css = replace_once(
    css,
    '''  .lx-profile-grid { grid-template-columns: 1fr; }
''',
    '''  .lx-profile-grid { grid-template-columns: 1fr; }
  .lx-password-requirements { grid-template-columns: 1fr; }
  .lx-auth-actions { align-items: stretch; flex-direction: column-reverse; }
  .lx-auth-actions .lx-button { width: 100%; }
''',
    "mobile auth layout",
)
CSS.write_text(css, encoding="utf-8")
