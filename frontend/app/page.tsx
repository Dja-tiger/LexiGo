const cards = [
  { label: "Новые слова", value: "15", hint: "первая дневная сессия" },
  { label: "Повторить", value: "42", hint: "по интервальному алгоритму" },
  { label: "Серия", value: "0", hint: "начнётся после первого урока" },
  { label: "Словарь", value: "0 / 800+", hint: "импорт добавим следующим этапом" },
];

export default function Home() {
  return (
    <main className="shell">
      <header className="hero">
        <div>
          <p className="eyebrow">AI ENGLISH COACH</p>
          <h1>LexiGo</h1>
          <p className="subtitle">Английский через интервальные повторения и реальные задачи Data Engineer.</p>
        </div>
        <span className="badge">MVP foundation</span>
      </header>

      <section className="grid" aria-label="Статистика">
        {cards.map((card) => (
          <article className="card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <small>{card.hint}</small>
          </article>
        ))}
      </section>

      <section className="lesson">
        <div>
          <p className="eyebrow">СЕГОДНЯ</p>
          <h2>Первый учебный цикл</h2>
          <p>После импорта слов здесь появятся задания на перевод, распознавание, письмо и технический диалог.</p>
        </div>
        <button type="button" disabled>Начать урок</button>
      </section>

      <section className="roadmap">
        <h2>Ближайшие функции</h2>
        <ol>
          <li>Импорт исходного списка из CSV/XLSX.</li>
          <li>Алгоритм SM-2 и история ответов.</li>
          <li>Авторизация в интерфейсе и синхронизация прогресса.</li>
          <li>AI-проверка английских ответов.</li>
        </ol>
      </section>
    </main>
  );
}
