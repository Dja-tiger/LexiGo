"use client";

import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { useCallback, useEffect, useRef } from "react";

import { reportPendingLessonReturn } from "@/lib/lesson-retention";
import {
  flushPerformanceQueue,
  installActionTimingObserver,
  reportWebVitalMetric,
  startLongTaskMonitoring,
  type WebVitalMetricLike,
} from "@/lib/performance-rum";

function usesCurrentRoute(metric: WebVitalMetricLike): boolean {
  return metric.name === "Next.js-route-change-to-render" || metric.name === "Next.js-render";
}

export function WebVitalsReporter() {
  const pathname = usePathname();
  const initialPathname = useRef(pathname);
  const currentPathname = useRef(pathname);

  useEffect(() => {
    currentPathname.current = pathname;
  }, [pathname]);

  const handleWebVital = useCallback((metric: WebVitalMetricLike) => {
    reportWebVitalMetric(metric, usesCurrentRoute(metric) ? currentPathname.current : initialPathname.current);
  }, []);

  useReportWebVitals(handleWebVital);

  useEffect(() => startLongTaskMonitoring(pathname), [pathname]);

  useEffect(() => installActionTimingObserver(), []);

  useEffect(() => {
    reportPendingLessonReturn();
  }, []);

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
