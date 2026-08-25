import { describe, expect, test } from 'vitest';
import {
  compareToBaseline,
  evaluateParameterSearch,
  type ParameterSearchEvalCase,
  type ParameterSearchEvalMetrics,
} from '@/libs/parameterSearchEval';

const CASES: ParameterSearchEvalCase[] = [
  { id: 'found-first', query: 'child tax credit', expectedPaths: ['gov.irs.credits.ctc.amount'] },
  { id: 'found-third', query: 'snap allotment', expectedPaths: ['gov.usda.snap.max_allotment'] },
  { id: 'missed', query: 'renters credit', expectedPaths: ['gov.states.ct.credits.renters'] },
];

/** Returns the ranked paths each query is set up to produce. */
const RESULTS: Record<string, string[]> = {
  'child tax credit': ['gov.irs.credits.ctc.amount', 'other.a', 'other.b'],
  'snap allotment': ['other.c', 'other.d', 'gov.usda.snap.max_allotment'],
  'renters credit': ['other.e', 'other.f'],
};

const run = (query: string, limit: number) => (RESULTS[query] ?? []).slice(0, limit);

describe('evaluateParameterSearch', () => {
  test('given ranked results then hit rate reflects the cutoff each case lands in', () => {
    const metrics = evaluateParameterSearch(run, CASES, { cutoffs: [1, 5] });

    // Only the rank-1 case counts at cutoff 1; the rank-3 case joins at 5.
    expect(metrics.hitRate['1']).toBeCloseTo(1 / 3);
    expect(metrics.hitRate['5']).toBeCloseTo(2 / 3);
    expect(metrics.cases).toBe(3);
  });

  test('given a case with no expected path in range then it is reported as a miss', () => {
    const metrics = evaluateParameterSearch(run, CASES);

    expect(metrics.misses).toHaveLength(1);
    expect(metrics.misses[0].id).toBe('missed');
  });

  test('given ranks 1 and 3 then MRR averages their reciprocals over all cases', () => {
    const metrics = evaluateParameterSearch(run, CASES);

    expect(metrics.mrr).toBeCloseTo((1 + 1 / 3) / 3);
    expect(metrics.medianRank).toBe(2);
  });

  test('given no cases then metrics are zero rather than NaN', () => {
    const metrics = evaluateParameterSearch(run, []);

    expect(metrics.mrr).toBe(0);
    expect(metrics.hitRate['10']).toBe(0);
    expect(metrics.medianRank).toBeNull();
  });

  test('given maxMisses then the miss list stays bounded', () => {
    const many = Array.from({ length: 5 }, (_, index) => ({
      id: `miss-${index}`,
      query: 'renters credit',
      expectedPaths: ['gov.states.ct.credits.renters'],
    }));

    expect(evaluateParameterSearch(run, many, { maxMisses: 2 }).misses).toHaveLength(2);
  });
});

const BASELINE: ParameterSearchEvalMetrics = {
  cases: 3,
  hitRate: { '10': 0.5 },
  mrr: 0.4,
  medianRank: 2,
  misses: [],
};

describe('compareToBaseline', () => {
  test('given a drop beyond tolerance then it counts as a regression', () => {
    const worse = { ...BASELINE, hitRate: { '10': 0.4 } };

    expect(compareToBaseline(worse, BASELINE).regressed).toBe(true);
  });

  test('given a drop inside tolerance then it is noise, not a regression', () => {
    const jitter = { ...BASELINE, hitRate: { '10': 0.49 } };

    expect(compareToBaseline(jitter, BASELINE).regressed).toBe(false);
  });

  test('given an improvement then it is reported with a signed delta', () => {
    const better = { ...BASELINE, hitRate: { '10': 0.6 }, mrr: 0.5 };
    const { regressed, lines } = compareToBaseline(better, BASELINE);

    expect(regressed).toBe(false);
    expect(lines.some((line) => line.includes('+0.100'))).toBe(true);
  });
});
