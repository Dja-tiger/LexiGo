import type { Metadata } from "next";
import Link from "next/link";

import styles from "./design-system.module.css";

export const metadata: Metadata = {
  title: "Design System · LexiGo",
  description: "Визуальная документация foundations и semantic tokens LexiGo.",
  robots: {
    index: false,
    follow: false,
  },
};

const COLORS = [
  { name: "Canvas", token: "--lx-color-bg-canvas", className: styles.swatchCanvas },
  { name: "Soft background", token: "--lx-color-bg-soft", className: styles.swatchSoft },
  { name: "Surface", token: "--lx-color-surface-default", className: styles.swatchSurface },
  { name: "Strong surface", token: "--lx-color-surface-strong", className: styles.swatchSurfaceStrong },
  { name: "Primary text", token: "--lx-color-text-primary", className: styles.swatchText },
  { name: "Muted text", token: "--lx-color-text-muted", className: styles.swatchMuted },
  { name: "Purple", token: "--lx-primitive-purple-500", className: styles.swatchPurple },
  { name: "Violet", token: "--lx-primitive-violet-500", className: styles.swatchViolet },
  { name: "Blue", token: "--lx-primitive-blue-500", className: styles.swatchBlue },
  { name: "Cyan", token: "--lx-primitive-cyan-500", className: styles.swatchCyan },
  { name: "Success", token: "--lx-color-action-success", className: styles.swatchGreen },
  { name: "Danger", token: "--lx-color-feedback-danger", className: styles.swatchDanger },
] as const;

const SPACING = [
  { name: "space-1", token: "--lx-space-1", value: "4 px", className: styles.space1 },
  { name: "space-2", token: "--lx-space-2", value: "8 px", className: styles.space2 },
  { name: "space-3", token: "--lx-space-3", value: "12 px", className: styles.space3 },
  { name: "space-4", token: "--lx-space-4", value: "16 px", className: styles.space4 },
  { name: "space-6", token: "--lx-space-6", value: "24 px", className: styles.space6 },
  { name: "space-8", token: "--lx-space-8", value: "32 px", className: styles.space8 },
  { name: "space-12", token: "--lx-space-12", value: "48 px", className: styles.space12 },
  { name: "space-16", token: "--lx-space-16", value: "64 px", className: styles.space16 },
] as const;

export default function DesignSystemPage() {
  return (
    <main className={styles.page} data-design-system-page="true">
      <div className={styles.container}>
        <header className={styles.hero}>
          <div>
            <p className={styles.kicker}>Foundations v1 · code-first</p>
            <h1 className={styles.title}>LexiGo Design System</h1>
            <p className={styles.description}>
              Рабочая документация semantic tokens и базовых UI-контрактов. Эта страница рендерится
              теми же CSS-переменными, которые использует продукт, поэтому изменения можно проверять
              непосредственно в браузере, Playwright и visual regression tests.
            </p>
          </div>
          <Link className={styles.backLink} href="/">
            Вернуться в LexiGo
          </Link>
        </header>

        <div className={styles.summaryGrid} aria-label="Сводка дизайн-системы">
          <article className={styles.summaryCard}>
            <span>Цветовая модель</span>
            <strong>Primitive → Semantic</strong>
          </article>
          <article className={styles.summaryCard}>
            <span>Сетка отступов</span>
            <strong>4 px</strong>
          </article>
          <article className={styles.summaryCard}>
            <span>Минимальная область касания</span>
            <strong>44 × 44</strong>
          </article>
          <article className={styles.summaryCard}>
            <span>Motion accessibility</span>
            <strong>Reduced motion</strong>
          </article>
        </div>

        <section className={styles.section} aria-labelledby="colors-heading">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionLabel}>01 · Colors</p>
              <h2 className={styles.sectionTitle} id="colors-heading">Семантическая палитра</h2>
            </div>
            <p className={styles.sectionDescription}>
              Компоненты используют роли, а не hex-значения. Primitive tokens меняются только при
              пересмотре бренда; semantic tokens могут получать отдельные значения для будущей light theme.
            </p>
          </div>
          <div className={styles.tokenGrid} data-token-category="color">
            {COLORS.map((color) => (
              <article className={styles.tokenCard} data-token={color.token} key={color.token}>
                <div className={`${styles.swatch} ${color.className}`} aria-hidden="true" />
                <div className={styles.tokenMeta}>
                  <strong>{color.name}</strong>
                  <code className={styles.code}>{color.token}</code>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="typography-heading">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionLabel}>02 · Typography</p>
              <h2 className={styles.sectionTitle} id="typography-heading">Типографическая шкала</h2>
            </div>
            <p className={styles.sectionDescription}>
              Inter-compatible system stack используется для интерфейса. Моноширинный стек зарезервирован
              для кода, API, SQL и технических терминов.
            </p>
          </div>
          <div className={styles.specimenStack}>
            <article className={styles.specimen}>
              <div className={styles.specimenMeta}>
                <strong>Display</strong>
                <code className={styles.code}>--lx-text-display-md</code>
              </div>
              <p className={styles.displaySample}>Learn the system, not the list.</p>
            </article>
            <article className={styles.specimen}>
              <div className={styles.specimenMeta}>
                <strong>Heading</strong>
                <code className={styles.code}>--lx-text-heading-lg</code>
              </div>
              <p className={styles.headingSample}>Повторение технической лексики</p>
            </article>
            <article className={styles.specimen}>
              <div className={styles.specimenMeta}>
                <strong>Body</strong>
                <code className={styles.code}>--lx-text-body</code>
              </div>
              <p className={styles.bodySample}>
                Контекст, перевод и интервальное повторение должны считываться без декоративного шума.
              </p>
            </article>
            <article className={styles.specimen}>
              <div className={styles.specimenMeta}>
                <strong>Label</strong>
                <code className={styles.code}>--lx-text-sm</code>
              </div>
              <p className={styles.labelSample}>Data engineering</p>
            </article>
            <article className={styles.specimen}>
              <div className={styles.specimenMeta}>
                <strong>Technical</strong>
                <code className={styles.code}>--lx-font-family-mono</code>
              </div>
              <p className={styles.monoSample}>select retained_items from learning_progress;</p>
            </article>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="spacing-heading">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionLabel}>03 · Spacing</p>
              <h2 className={styles.sectionTitle} id="spacing-heading">Сетка и плотность</h2>
            </div>
            <p className={styles.sectionDescription}>
              Layout строится на 4 px grid. Touch controls используют минимум 44 px, а Android-oriented
              поверхности могут переходить к comfortable target 48 px.
            </p>
          </div>
          <div className={styles.spacingList} data-token-category="spacing">
            {SPACING.map((space) => (
              <div className={styles.spacingRow} data-token={space.token} key={space.token}>
                <code className={styles.spacingName}>{space.name}</code>
                <div className={styles.spacingTrack} aria-hidden="true">
                  <span className={`${styles.spacingBar} ${space.className}`} />
                </div>
                <span className={styles.spacingValue}>{space.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="controls-heading">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionLabel}>04 · Controls</p>
              <h2 className={styles.sectionTitle} id="controls-heading">Базовые действия</h2>
            </div>
            <p className={styles.sectionDescription}>
              Primary action должен быть один на локальный сценарий. Secondary и destructive actions
              визуально отделены и сохраняют доступную область касания.
            </p>
          </div>
          <div className={styles.controlGrid}>
            <article className={styles.controlCard}>
              <h3>Primary</h3>
              <p>Продолжение основного пользовательского намерения.</p>
              <div className={styles.buttonRow}>
                <button className={styles.primaryButton} type="button">Начать урок</button>
              </div>
            </article>
            <article className={styles.controlCard}>
              <h3>Secondary</h3>
              <p>Дополнительное действие без конкуренции с основной CTA.</p>
              <div className={styles.buttonRow}>
                <button className={styles.secondaryButton} type="button">Открыть словарь</button>
                <button className={styles.secondaryButton} disabled type="button">Недоступно</button>
              </div>
            </article>
            <article className={styles.controlCard}>
              <h3>Destructive</h3>
              <p>Необратимое действие требует подтверждения и явного текста.</p>
              <div className={styles.buttonRow}>
                <button className={styles.dangerButton} type="button">Удалить данные</button>
              </div>
            </article>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="feedback-heading">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionLabel}>05 · Feedback</p>
              <h2 className={styles.sectionTitle} id="feedback-heading">Состояния и обратная связь</h2>
            </div>
            <p className={styles.sectionDescription}>
              Цвет не является единственным носителем смысла. Каждое состояние сопровождается текстом,
              а критические ошибки не исчезают автоматически.
            </p>
          </div>
          <div className={styles.stateGrid}>
            <article className={styles.stateCard}>
              <span className={`${styles.stateIndicator} ${styles.success}`}>Сохранено</span>
              <h3>Success</h3>
              <p>Операция подтверждена сервером и не требует следующего действия.</p>
            </article>
            <article className={styles.stateCard}>
              <span className={`${styles.stateIndicator} ${styles.warning}`}>Нужна проверка</span>
              <h3>Warning</h3>
              <p>Пользователь может продолжить, но должен понимать последствия.</p>
            </article>
            <article className={styles.stateCard}>
              <span className={`${styles.stateIndicator} ${styles.danger}`}>Не сохранено</span>
              <h3>Error</h3>
              <p>Сообщение остаётся доступным, пока ошибка не исправлена или не закрыта.</p>
            </article>
          </div>
        </section>

        <p className={styles.footerNote}>
          Source of truth: <code className={styles.code}>frontend/app/design-tokens.css</code>. Legacy
          variables временно сохранены как compatibility aliases; новые компоненты должны использовать
          semantic roles напрямую.
        </p>
      </div>
    </main>
  );
}
