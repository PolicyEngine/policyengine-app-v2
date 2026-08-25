/**
 * Derived ranking priors for parameter search — no curated lists.
 *
 * Structural prior: read off the path shape (depth, bracket indices).
 * Usage prior: accumulated from live data — parameters that appear in
 * real analyses (the tracker's bill feed today; user telemetry later)
 * rank ahead of never-used siblings.
 */

let usageCounts = new Map<string, number>();

/** Accumulate usage from a live source (e.g. tracker bill provisions). */
export function registerUsagePaths(paths: string[]): void {
  for (const path of paths) {
    usageCounts.set(path, (usageCounts.get(path) ?? 0) + 1);
  }
}

export function resetUsagePaths(): void {
  usageCounts = new Map();
}

export function getUsageCount(path: string): number {
  return usageCounts.get(path) ?? 0;
}

/**
 * Multiplier applied to a fuzzy match score (lower is better): deep and
 * bracketed paths drift down, parameters used in real analyses float up.
 */
export function priorFactor(path: string): number {
  // Gentle structural nudges: enough to break ties between lexically
  // similar entries, not enough to override a clearly better match.
  const depth = path.split('.').length;
  const depthPenalty = 0.02 * Math.max(0, depth - 6);
  const bracketPenalty = path.includes('[') ? 0.06 : 0;
  // Real-world usage is a strong signal: a parameter that appears in
  // actual analyses outranks structural penalties outright.
  const usage = getUsageCount(path);
  const usageBoost = usage > 0 ? Math.min(0.45, 0.3 + 0.05 * Math.log1p(usage)) : 0;
  return 1 + depthPenalty + bracketPenalty - usageBoost;
}
