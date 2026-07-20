import type { Metadata, Viewport } from "next";
import { ApplicationErrorBoundary } from "@/components/application-error-boundary";
import { LegalFooter } from "@/components/legal-footer";
import { RoutedLexigoApp } from "@/components/routed-lexigo-app";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import "./globals.css";
import "./product-navigation.css";
import "./premium-ui.css";
import "./mobile-pwa-fixes.css";
import "./themed-vocabulary.css";
import "./catalog-enhancements.css";
import "./calendar-reminders.css";
import "./error-boundary.css";
import "./accessibility-focus.css";
import "./accessibility-navigation.css";
import "./adaptive-navigation.css";
import "./route-navigation.css";
import "./route-boundaries.css";
import "./legal.css";
import "./account-security.css";
import "./account-email.css";
import "./account-data.css";
import "./speech-player.css";
import "./service-worker-update.css";
import "./review-outbox.css";
import "./catalog-pagination.css";
import "./dictionary-catalog.css";

export const metadata: Metadata = {
  title: "LexiGo",
  description: "Персональный тренажёр технического английского",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: "LexiGo",
  },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/icon-180.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#050914",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <ApplicationErrorBoundary>
          <ServiceWorkerRegistration />
          <RoutedLexigoApp />
          {children}
          <LegalFooter />
        </ApplicationErrorBoundary>
      </body>
    </html>
  );
}
