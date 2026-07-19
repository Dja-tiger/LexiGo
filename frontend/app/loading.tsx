export default function RouteLoading() {
  return (
    <main className="lx-route-boundary" aria-live="polite" aria-busy="true">
      <div className="lx-bootstrap-mark" aria-hidden="true">L</div>
      <strong>Загружаем раздел…</strong>
      <span>Маршрут и состояние экрана восстанавливаются.</span>
    </main>
  );
}
