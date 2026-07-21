(() => {
  "use strict";
  const parameters = new URLSearchParams(window.location.search);
  const reason = parameters.get("reason");
  const rawReturn = parameters.get("return");
  let returnTarget = "/";

  if (rawReturn) {
    try {
      const candidate = new URL(rawReturn, window.location.origin);
      if (candidate.origin === window.location.origin && candidate.pathname !== "/offline.html") {
        candidate.searchParams.delete("__lexigo_build");
        returnTarget = candidate.pathname + candidate.search + candidate.hash;
      }
    } catch {
      returnTarget = "/";
    }
  }

  const title = document.getElementById("title");
  const description = document.getElementById("description");
  const connection = document.getElementById("connection");
  const retryButton = document.getElementById("retry");

  if (reason === "stale-build" && title && description) {
    title.textContent = "Обновляем LexiGo до актуальной версии";
    description.textContent = "Браузер повторно получил страницу предыдущей версии. Автоматическое обновление остановлено, чтобы не создать цикл перезагрузки. Текущий маршрут сохранён.";
  }

  const updateConnection = () => {
    if (!connection) return;
    connection.textContent = navigator.onLine
      ? "Соединение доступно. Можно повторить загрузку."
      : "Нет подключения к сети. LexiGo повторит переход после восстановления соединения.";
  };
  const retry = () => window.location.replace(returnTarget);

  retryButton?.addEventListener("click", retry);
  window.addEventListener("online", retry, { once: true });
  window.addEventListener("offline", updateConnection);
  updateConnection();
})();
