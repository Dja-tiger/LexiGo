import type { Metadata } from "next";
import Link from "next/link";

import { interfaceActionLabel } from "../lib/interface-copy";

const HOME_ACTION_LABEL = interfaceActionLabel("home");

export const metadata: Metadata = {
  title: "Страница не найдена · LexiGo",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="lx-route-boundary" role="main">
      <div className="lx-bootstrap-mark" aria-hidden="true">404</div>
      <h1>Такого раздела нет</h1>
      <span>Адрес устарел или был введён с ошибкой.</span>
      <Link className="lx-button primary" href="/" prefetch={false}>{HOME_ACTION_LABEL}</Link>
    </main>
  );
}
