import type { LearningItem } from "./learning";

let learnHandoffActive = false;
let trackedKinds = new Set<LearningItem["kind"]>();
let resolvedNotice = "";
let resolutionGeneration = 0;

/**
 * Marks the one-way Learn-island handoff into the compatibility Active Lesson
 * graph. The handoff is deliberately in-memory: a reload remains governed by
 * the server-owned active lesson and the persisted result snapshot.
 */
export function markLearnLessonHandoff(): void {
  resolutionGeneration += 1;
  learnHandoffActive = true;
  trackedKinds = new Set();
  resolvedNotice = "";
}

/**
 * Reconstructs the mixed-lesson composition that the former monolith kept in
 * component state. Active Lesson renders every card before Result, so the
 * presentation boundary can recover whether the server fell back to one kind.
 */
export function trackLearnHandoffItem(kind: LearningItem["kind"]): void {
  if (!learnHandoffActive) return;
  trackedKinds.add(kind);
}

function retainNoticeForStrictRender(notice: string): string {
  resolvedNotice = notice;
  const generation = ++resolutionGeneration;
  queueMicrotask(() => {
    if (resolutionGeneration === generation && !learnHandoffActive) {
      resolvedNotice = "";
    }
  });
  return notice;
}

export function consumeLearnHandoffFallbackNotice(source: string): string {
  if (resolvedNotice) return resolvedNotice;
  if (!learnHandoffActive) return "";
  if (source !== "mixed") {
    learnHandoffActive = false;
    return "";
  }

  learnHandoffActive = false;
  if (trackedKinds.size === 1 && trackedKinds.has("phrase")) {
    return retainNoticeForStrictRender(
      "Слова для этого режима закончились. Смешанная практика продолжится доступными фразами.",
    );
  }
  if (trackedKinds.size === 1 && trackedKinds.has("word")) {
    return retainNoticeForStrictRender(
      "Фразы для этого режима закончились. Смешанная практика продолжится доступными словами.",
    );
  }

  return "";
}
