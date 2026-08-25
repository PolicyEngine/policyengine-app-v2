/**
 * Offline scoring for parameter search.
 *
 * Ground truth comes from analyses that already happened: every bill the
 * legislative tracker has scored names the parameters an analyst chose,
 * so "does search surface those parameters for that bill?" is a question
 * with a real answer. The cases are a fixture (see
 * scripts/refresh-parameter-search-cases.ts); this module only scores.
 *
 * The metric is hit rate rather than full recall: a case names every
 * parameter its reform touched, but a searcher only needs to land on one
 * of them to be on the right page of the tree.
 */

export interface ParameterSearchEvalCase {
  /** Stable id, e.g. the tracker's bill id. */
  id: string;
  /** What a searcher would plausibly type — a bill title and summary. */
  query: string;
  /** Parameter paths the analysis actually used. */
  expectedPaths: string[];
}

export interface ParameterSearchEvalMiss {
  id: string;
  query: string;
  expectedPaths: string[];
}

export interface ParameterSearchEvalMetrics {
  cases: number;
  /** Share of cases with an expected path in the top N, keyed by N. */
  hitRate: Record<string, number>;
  /** Mean reciprocal rank of the first expected path (0 when never found). */
  mrr: number;
  /** Rank of the first expected path, median across cases that found one. */
  medianRank: number | null;
  /** Cases where no expected path appeared within the deepest cutoff. */
  misses: ParameterSearchEvalMiss[];
}

/** Runs one query and returns result paths, best first. */
export type ParameterSearchRunner = (query: string, limit: number) => string[];

export interface ParameterSearchEvalOptions {
  /** Cutoffs to report hit rate at; the largest also bounds the search. */
  cutoffs?: number[];
  /** Cap on reported misses, so a bad run stays readable. */
  maxMisses?: number;
}

function median(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

export function evaluateParameterSearch(
  run: ParameterSearchRunner,
  cases: ParameterSearchEvalCase[],
  options: ParameterSearchEvalOptions = {}
): ParameterSearchEvalMetrics {
  const cutoffs = [...(options.cutoffs ?? [5, 10, 20])].sort((a, b) => a - b);
  const deepest = cutoffs[cutoffs.length - 1];
  const maxMisses = options.maxMisses ?? 10;

  const hits: Record<string, number> = Object.fromEntries(cutoffs.map((n) => [String(n), 0]));
  const foundRanks: number[] = [];
  const misses: ParameterSearchEvalMiss[] = [];
  let reciprocalTotal = 0;

  for (const testCase of cases) {
    const expected = new Set(testCase.expectedPaths);
    const results = run(testCase.query, deepest);
    const zeroBased = results.findIndex((path) => expected.has(path));
    if (zeroBased < 0) {
      if (misses.length < maxMisses) {
        misses.push({
          id: testCase.id,
          query: testCase.query,
          expectedPaths: testCase.expectedPaths,
        });
      }
      continue;
    }
    const rank = zeroBased + 1;
    foundRanks.push(rank);
    reciprocalTotal += 1 / rank;
    for (const cutoff of cutoffs) {
      if (rank <= cutoff) {
        hits[String(cutoff)] += 1;
      }
    }
  }

  const total = cases.length;
  return {
    cases: total,
    hitRate: Object.fromEntries(
      cutoffs.map((n) => [String(n), total === 0 ? 0 : hits[String(n)] / total])
    ),
    mrr: total === 0 ? 0 : reciprocalTotal / total,
    medianRank: median(foundRanks),
    misses,
  };
}

/**
 * Compares a run against a recorded baseline. Search ranking moves in
 * small increments, so a tolerance keeps noise from failing a build
 * while a real regression still trips it.
 */
export interface ParameterSearchEvalComparison {
  regressed: boolean;
  lines: string[];
}

export function compareToBaseline(
  current: ParameterSearchEvalMetrics,
  baseline: ParameterSearchEvalMetrics,
  tolerance = 0.02
): ParameterSearchEvalComparison {
  const lines: string[] = [];
  let regressed = false;

  const report = (label: string, now: number, before: number) => {
    const delta = now - before;
    const sign = delta >= 0 ? '+' : '';
    lines.push(
      `${label}: ${now.toFixed(3)} (baseline ${before.toFixed(3)}, ${sign}${delta.toFixed(3)})`
    );
    if (delta < -tolerance) {
      regressed = true;
    }
  };

  for (const cutoff of Object.keys(current.hitRate)) {
    const before = baseline.hitRate[cutoff];
    if (before !== undefined) {
      report(`hit rate @${cutoff}`, current.hitRate[cutoff], before);
    }
  }
  report('MRR', current.mrr, baseline.mrr);
  return { regressed, lines };
}
