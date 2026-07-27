import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const RESULTS_DIR = path.resolve("test-results");
const PERFORMANCE_REPORT = path.join(RESULTS_DIR, "performance-budget-report.json");
const ROUTE_BUNDLE_REPORT = path.join(RESULTS_DIR, "route-bundle-budget-report.json");

type RouteBundleResult = {
  route: string;
  initialRequests: number;
  javascriptBytes: number;
};

async function readJSON(filePath: string): Promise<Record<string, unknown> | null> {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as Record<string, unknown>;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

function routeBundleResults(report: Record<string, unknown>): RouteBundleResult[] {
  if (!Array.isArray(report.results)) return [];

  return report.results.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") return [];
    const result = candidate as Record<string, unknown>;
    if (
      typeof result.route !== "string"
      || typeof result.initialRequests !== "number"
      || !Number.isFinite(result.initialRequests)
      || typeof result.javascriptBytes !== "number"
      || !Number.isFinite(result.javascriptBytes)
    ) {
      return [];
    }

    return [{
      route: result.route,
      initialRequests: result.initialRequests,
      javascriptBytes: result.javascriptBytes,
    }];
  }).sort((left, right) => left.route.localeCompare(right.route));
}

export default async function mergePerformanceReports(): Promise<void> {
  const routeBundleBudget = await readJSON(ROUTE_BUNDLE_REPORT);
  if (!routeBundleBudget) return;

  for (const result of routeBundleResults(routeBundleBudget)) {
    process.stdout.write(`[route-bundle-budget] ${JSON.stringify(result)}\n`);
  }

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
