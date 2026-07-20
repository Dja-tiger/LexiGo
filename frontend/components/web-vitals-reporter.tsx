"use client";

import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { useEffect } from "react";

import {
  flushPerformanceQueue,
  installActionTimingObserver,
  reportWebVitalMetric,
  startLongTaskMonitoring,
  type WebVitalMetricLike,
} from "@/lib/performance-rum";

function handleWebVital(metric: WebVitalMetricLike): void {
  reportWebVitalMetric(metric);
}

export function WebVitalsReporter() {
  const pathname = usePathname();

  useReportWebVitals(handleWebVital);

  useEffect(() => startLongTaskMonitoring(pathname), [pathname]);

  useEffect(() => installActionTimingObserver(), []);

  useEffect(() => {
    const flushWhenHidden = () => {
      if (document.visibilityState === "hidden") flushPerformanceQueue();
    };
    const flushBeforePageExit = () => flushPerformanceQueue();

    document.addEventListener("visibilitychange", flushWhenHidden);
    window.addEventListener("pagehide", flushBeforePageExit);
    return () => {
      document.removeEventListener("visibilitychange", flushWhenHidden);
      window.removeEventListener("pagehide", flushBeforePageExit);
      flushPerformanceQueue();
    };
  }, []);

  return null;
}
