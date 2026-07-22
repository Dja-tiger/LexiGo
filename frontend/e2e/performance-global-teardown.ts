import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const RESULTS_DIR = path.resolve("test-results");
const PERFORMANCE_REPORT = path.join(RESULTS_DIR, "performance-budget-report.json");
const ROUTE_BUNDLE_REPORT = path.join(RESULTS_DIR, "route-bundle-budget-report.json");

async function readJSON(filePath: string): Promise<Record<string, unknown> | null> {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as Record<string, unknown>;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export default async function mergePerformanceReports(): Promise<void> {
  const routeBundleBudget = await readJSON(ROUTE_BUNDLE_REPORT);
  if (!routeBundleBudget) return;

  const performanceBudget = await readJSON(PERFORMANCE_REPORT);
  const merged = performanceBudget
    ? { ...performanceBudget, routeBundleBudget }
    : {
        generatedAt: new Date().toISOString(),
        routeBundleBudget,
      };

  await mkdir(RESULTS_DIR, { recursive: true });
  await writeFile(PERFORMANCE_REPORT, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
}
