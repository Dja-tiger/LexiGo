import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const interfaceCopySource = readFileSync(new URL("../lib/interface-copy.ts", import.meta.url), "utf8");
const asyncStateSource = readFileSync(new URL("./async-state.tsx", import.meta.url), "utf8");
const homeSource = readFileSync(new URL("./lexigo-home-app.tsx", import.meta.url), "utf8");
const learnSource = readFileSync(new URL("./lexigo-learn-app.tsx", import.meta.url), "utf8");
const activeLessonSource = readFileSync(new URL("./lexigo-active-lesson-app.tsx", import.meta.url), "utf8");
const compatibilitySource = readFileSync(new URL("./lexigo-premium-app.tsx", import.meta.url), "utf8");
const routeErrorSource = readFileSync(new URL("../app/error.tsx", import.meta.url), "utf8");
const globalErrorSource = readFileSync(new URL("../app/global-error.tsx", import.meta.url), "utf8");
const notFoundSource = readFileSync(new URL("../app/not-found.tsx", import.meta.url), "utf8");

describe("interface copy ownership", () => {
  it("keeps generic state and recovery labels in the canonical interface-copy owner", () => {
    expect(interfaceCopySource).toContain('const SYSTEM_STATE_EYEBROWS: Record<SystemStateKind, string>');
    expect(interfaceCopySource).toContain('const INTERFACE_ACTION_LABELS: Record<InterfaceAction, string>');
    expect(asyncStateSource).toContain("systemStateEyebrow(kind)");
    expect(asyncStateSource).toContain('interfaceActionLabel("retry")');
    expect(asyncStateSource).toContain('interfaceActionLabel("continueLesson")');
    expect(asyncStateSource).not.toContain('function stateEyebrow(');
    expect(routeErrorSource).toContain('interfaceActionLabel("retry")');
    expect(globalErrorSource).toContain('interfaceActionLabel("retry")');
    expect(globalErrorSource).toContain('interfaceActionLabel("home")');
    expect(notFoundSource).toContain('interfaceActionLabel("home")');
    expect(notFoundSource).not.toContain("Открыть главную");
  });

  it("keeps Home lesson source copy owned by interface-copy instead of a local label table", () => {
    expect(interfaceCopySource).toContain('const LESSON_SOURCE_LABELS: Record<LessonSourceLabelKey, string>');
    expect(homeSource).toContain("lessonSourceLabel(activeLesson.source)");
    expect(homeSource).not.toContain("function sourceLabel(");
    expect(homeSource).not.toContain('return "Путешествия"');
    expect(homeSource).not.toContain('return "Фразы"');
  });

  it("prevents known lesson-source labels from drifting across Learn, Active Lesson and compatibility fallback", () => {
    expect(learnSource).toMatch(/source:\s*"travel",\s*\n\s*label:\s*"Для путешествий"/);
    expect(learnSource).toMatch(/value:\s*"phrases",\s*label:\s*"Технические фразы"/);
    expect(activeLessonSource).toMatch(/travel:\s*"Для путешествий"/);
    expect(activeLessonSource).toMatch(/phrases:\s*"Технические фразы"/);
    expect(compatibilitySource).toContain('label: "Для путешествий"');
    expect(compatibilitySource).toContain('label: "Технические фразы"');

    for (const source of [learnSource, activeLessonSource, compatibilitySource]) {
      expect(source).not.toMatch(/(?:source|value|travel):[^\n]*"travel"[^\n]*"Путешествия"/);
      expect(source).not.toMatch(/(?:source|value|phrases):[^\n]*"phrases"[^\n]*"Фразы"/);
    }
  });

  it("preserves intentional course-facing English while keeping explanatory UI copy Russian", () => {
    expect(interfaceCopySource).toContain('"academic-technical-english": "Academic Technical English"');
    expect(learnSource).toContain('label: "Academic Technical English"');
    expect(learnSource).toContain("Академическая техническая лексика для документации, исследований и инженерной коммуникации");
  });
});
