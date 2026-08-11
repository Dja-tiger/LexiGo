import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const frontendDirectory = process.cwd();
const appDirectory = path.join(frontendDirectory, "app");
const componentsDirectory = path.join(frontendDirectory, "components");

const layoutSource = readFileSync(path.join(appDirectory, "layout.tsx"), "utf8");
const feedbackStyles = readFileSync(path.join(appDirectory, "feedback.css"), "utf8");
const centerSource = readFileSync(path.join(componentsDirectory, "feedback-center.tsx"), "utf8");
const bootstrapSource = readFileSync(path.join(componentsDirectory, "lexigo-bootstrapped-app.tsx"), "utf8");
const speechSource = readFileSync(path.join(componentsDirectory, "speech-player-button.tsx"), "utf8");
const calendarSource = readFileSync(path.join(componentsDirectory, "calendar-reminder-integration.tsx"), "utf8");

describe("shared feedback ownership", () => {
  it("mounts one persistent feedback center and loads its leaf presentation after state tokens", () => {
    expect(layoutSource).toContain('import { FeedbackCenter } from "@/components/feedback-center";');
    expect(layoutSource).toContain("<FeedbackCenter>");
    expect(layoutSource).toContain("</FeedbackCenter>");
    expect(layoutSource).toContain('import "./system-states.css";');
    expect(layoutSource).toContain('import "./feedback.css";');
    expect(layoutSource.indexOf('import "./system-states.css";'))
      .toBeLessThan(layoutSource.indexOf('import "./feedback.css";'));
  });

  it("keeps the center as the only live announcement owner for migrated transient failures", () => {
    expect(centerSource).toContain("role={item.role}");
    expect(centerSource).toContain("aria-live={item.live}");
    expect(centerSource).toContain('aria-atomic="true"');
    expect(speechSource).toContain('role={state === "error" ? undefined : "status"}');
    expect(speechSource).toContain('aria-live={state === "error" ? "off" : "polite"}');
    expect(calendarSource).toContain('className="lx-calendar-status" role="status" aria-live="off"');
    expect(calendarSource).not.toContain('className="lx-calendar-status" role="status">');
  });

  it("routes only confirmed account outcomes through shared success feedback", () => {
    expect(bootstrapSource).toContain('import { useFeedback } from "./feedback-center";');
    expect(bootstrapSource).toContain('title: "Вы вышли из аккаунта"');
    expect(bootstrapSource).toContain('title: "Аккаунт удалён"');
    expect(bootstrapSource).toContain('title: "Email изменён"');
    expect(bootstrapSource).not.toContain("accountNotice");
    expect(bootstrapSource).not.toContain('lx-session-notice success');
    expect(bootstrapSource).toContain('className={`lx-session-notice ${notice.kind}`} role="alert"');
  });

  it("keeps compact feedback clear of safe areas and bottom navigation", () => {
    expect(feedbackStyles).toContain("env(safe-area-inset-top)");
    expect(feedbackStyles).toContain("env(safe-area-inset-right)");
    expect(feedbackStyles).toContain("env(safe-area-inset-bottom)");
    expect(feedbackStyles).toContain("env(safe-area-inset-left)");
    expect(feedbackStyles).toContain("100dvh");
    expect(feedbackStyles).toContain("@media (max-width: 760px)");
    expect(feedbackStyles).toContain("- 164px");
  });
});
