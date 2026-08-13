import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("pronunciation recorder source contract", () => {
  const source = readFileSync(new URL("./pronunciation-recorder.ts", import.meta.url), "utf8");

  it("does not add network or persistent storage dependencies", () => {
    for (const token of ["fetch(", "XMLHttpRequest", "localStorage", "sessionStorage", "indexedDB", "sendBeacon"]) {
      expect(source).not.toContain(token);
    }
  });

  it("uses explicit audio-only acquisition and bounded formats", () => {
    expect(source).toContain("async startRecording()");
    expect(source).toContain("await this.dependencies.getUserMedia!");
    expect(source).toContain("{ audio: true, video: false }");
    expect(source).toContain('"audio/webm;codecs=opus"');
    expect(source).toContain('"audio/mp4"');
    expect(source).not.toContain('"video/');
  });
});
