import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { ApplicationErrorBoundary } from "@/components/application-error-boundary";
import { LegalFooter } from "@/components/legal-footer";
import { RoutedLexigoApp } from "@/components/routed-lexigo-app";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { WebVitalsReporter } from "@/components/web-vitals-reporter";
import { createBuildVersionGuardScript } from "@/lib/build-version-guard";
import "./globals.css";
import "./design-tokens.css";
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
import "./adaptive-layout.css";
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
import "./information-architecture.css";
import "./calendar-reminder-entry.css";
import "./compact-home.css";
import "./adaptive-knowledge-coach-home.css";
import "./adaptive-knowledge-coach-accessibility.css";
import "./adaptive-lesson-composer.css";
import "./adaptive-lesson-composer-accessibility.css";
import "./active-lesson.css";
import "./lesson-result.css";
import "./progress-evidence.css";
import "./progress-evidence-accessibility.css";
import "./progress-evidence-layout.css";

const BUILD_ID = process.env.NEXT_PUBLIC_APP_BUILD_ID ?? "local";
const BUILD_VERSION_GUARD = createBuildVersionGuardScript(BUILD_ID);

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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f7f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0b211b" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="ru" data-lexigo-build={BUILD_ID}>
      <head>
        <script
          id="lexigo-build-version-guard"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: BUILD_VERSION_GUARD }}
        />
      </head>
      <body>
        <ApplicationErrorBoundary>
          <WebVitalsReporter />
          <ServiceWorkerRegistration />
          <RoutedLexigoApp />
          {children}
          <LegalFooter />
        </ApplicationErrorBoundary>
      </body>
    </html>
  );
}
