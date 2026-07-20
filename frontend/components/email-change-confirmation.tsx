"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { AccountRequestError, publicAccountRequest } from "../lib/account-api";

function tokenFromFragment(): string {
  const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return fragment.get("email_change_token")?.trim() ?? "";
}

function clearEmailChangeFragment(): void {
  const target = `${window.location.pathname}${window.location.search}`;
  window.history.replaceState(window.history.state, "", target);
}

export function EmailChangeConfirmation({
  onSessionInvalidated,
}: {
  onSessionInvalidated: () => void;
}) {
  const pathname = usePathname();
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (pathname !== "/profile") return;
    const timer = window.setTimeout(() => setToken(tokenFromFragment()), 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  if (pathname !== "/profile" || token === "") return null;

  async function confirmEmailChange() {
    setBusy(true);
    setStatus("idle");
    setMessage("");
    try {
      await publicAccountRequest<void>("/api/v1/account/email-change/confirm", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      clearEmailChangeFragment();
      setToken("");
      setStatus("success");
      setMessage("Email изменён. Все активные сессии завершены. Войдите с новым адресом.");
      onSessionInvalidated();
    } catch (requestError) {
      if (requestError instanceof AccountRequestError) {
        setStatus("error");
        setMessage(requestError.message);
      } else {
        setStatus("error");
        setMessage(requestError instanceof Error ? requestError.message : "Не удалось подтвердить новый email");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="lx-email-confirmation" aria-labelledby="email-confirmation-title">
      <div className="lx-email-confirmation-card">
        <span>ПОДТВЕРЖДЕНИЕ EMAIL</span>
        <h1 id="email-confirmation-title">Подтвердить новый адрес</h1>
        <p>
          После подтверждения новый email станет адресом для входа, а все текущие refresh-сессии будут завершены.
        </p>
        {status === "error" ? <div className="lx-account-notice error" role="alert">{message}</div> : null}
        {status === "success" ? <div className="lx-account-notice success" role="status">{message}</div> : null}
        <button className="lx-button primary" type="button" disabled={busy} onClick={() => void confirmEmailChange()}>
          {busy ? "Подтверждаем…" : "Подтвердить email"}
        </button>
      </div>
    </section>
  );
}
