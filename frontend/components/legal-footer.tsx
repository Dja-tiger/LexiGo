"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function isFocusedRoute(pathname: string): boolean {
  return pathname.startsWith("/lesson/") || pathname.startsWith("/scenarios/");
}

export function LegalFooter() {
  const pathname = usePathname();
  if (isFocusedRoute(pathname)) return null;

  return (
    <footer className="lx-legal-footer" aria-label="Юридическая информация">
      <span>© 2026 LexiGo</span>
      <nav aria-label="Документы LexiGo">
        <Link href="/privacy" prefetch={false}>Конфиденциальность</Link>
        <Link href="/terms" prefetch={false}>Условия использования</Link>
      </nav>
    </footer>
  );
}
