"use client";

import { useEffect } from "react";

import { reportPendingLessonReturn } from "../lib/lesson-retention";

export function LessonRetentionReporter() {
  useEffect(() => {
    reportPendingLessonReturn();
  }, []);

  return null;
}
