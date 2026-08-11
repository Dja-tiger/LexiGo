import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const yaml = require("js-yaml") as { load: (source: string) => unknown };
const contractSource = readFileSync(path.join(process.cwd(), "..", "api", "openapi.yaml"), "utf8");

type OpenAPIContract = {
  paths?: Record<string, unknown>;
  components?: {
    schemas?: Record<string, {
      additionalProperties?: boolean;
      required?: string[];
      properties?: Record<string, unknown>;
    }>;
  };
};

describe("OpenAPI structural contract", () => {
  it("parses the complete YAML document and exposes product retention", () => {
    const contract = yaml.load(contractSource) as OpenAPIContract;

    expect(contract).toBeTruthy();
    expect(contract.paths?.["/api/v1/product/retention"]).toBeDefined();
    expect(contract.components?.schemas?.ProductRetentionEvent).toBeDefined();
  });

  it("keeps retention telemetry aggregate-only", () => {
    const contract = yaml.load(contractSource) as OpenAPIContract;
    const schema = contract.components?.schemas?.ProductRetentionEvent;
    const properties = Object.keys(schema?.properties ?? {});

    expect(schema?.additionalProperties).toBe(false);
    expect(schema?.required).toEqual([
      "appVersion",
      "event",
      "action",
      "delayBucket",
      "deviceClass",
      "browserFamily",
      "displayMode",
    ]);
    expect(properties).toEqual([
      "appVersion",
      "event",
      "action",
      "delayBucket",
      "deviceClass",
      "browserFamily",
      "displayMode",
    ]);
    expect(properties).not.toEqual(expect.arrayContaining([
      "userId",
      "sessionId",
      "lessonId",
      "contentId",
      "url",
      "query",
      "referrer",
      "cookie",
      "userAgent",
    ]));
  });
});
