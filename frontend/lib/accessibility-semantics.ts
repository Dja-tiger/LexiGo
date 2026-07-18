export type RovingNavigationAxis = "horizontal" | "vertical" | "both";

export type RovingNavigationKey =
  | "ArrowLeft"
  | "ArrowRight"
  | "ArrowUp"
  | "ArrowDown"
  | "Home"
  | "End";

function normalizedIndex(index: number, itemCount: number): number {
  if (!Number.isInteger(index) || index < 0 || index >= itemCount) return 0;
  return index;
}

export function rovingTargetIndex(
  currentIndex: number,
  itemCount: number,
  key: string,
  axis: RovingNavigationAxis = "both",
): number | null {
  if (!Number.isInteger(itemCount) || itemCount <= 0) return null;
  const current = normalizedIndex(currentIndex, itemCount);

  if (key === "Home") return 0;
  if (key === "End") return itemCount - 1;

  const horizontal = axis === "horizontal" || axis === "both";
  const vertical = axis === "vertical" || axis === "both";
  const previous = (horizontal && key === "ArrowLeft") || (vertical && key === "ArrowUp");
  const next = (horizontal && key === "ArrowRight") || (vertical && key === "ArrowDown");

  if (previous) return (current - 1 + itemCount) % itemCount;
  if (next) return (current + 1) % itemCount;
  return null;
}

export function normalizeProgressValue(value: number, min = 0, max = 100): number {
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) && max > safeMin ? max : safeMin + 1;
  if (!Number.isFinite(value)) return safeMin;
  return Math.min(safeMax, Math.max(safeMin, value));
}
