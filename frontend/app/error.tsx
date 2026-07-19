"use client";

import { useEffect } from "react";

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("route rendering failed", error);
  }, [error]);

  return (
    <main className="lx-route-boundary" role="alert">
      <div className="lx-bootstrap-mark" aria-hidden="true">!</div>
      <strong>Раздел не удалось открыть</strong>
      <span>Повторите загрузку. Активная сессия и сохранённые ответы не удаляются.</span>
      {error.digest ? <small>Код: {error.digest}</small> : null}
      <button type="button" className="lx-button primary" onClick={reset}>Повторить</button>
    </main>
  );
}
