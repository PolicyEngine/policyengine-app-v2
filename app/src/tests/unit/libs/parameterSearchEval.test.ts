import { describe, expect, test } from 'vitest';
import {
  buildProgramEvalCases,
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

const PATHS = [
  ...Array.from({ length: 40 }, (_, index) => `gov.states.ca.tax.income.credits.item${index}`),
  'gov.usda.snap.max_allotment',
  'gov.usda.snap.income.deductions.earned',
  'gov.hhs.tanf.cash.amount',
];

describe('buildProgramEvalCases', () => {
  test('given a program with a distinct full name then both names become cases', () => {
    const { cases } = buildProgramEvalCases(
      [
        {
          id: 'snap',
          name: 'SNAP',
          full_name: 'Supplemental Nutrition Assistance Program',
          parameter_prefix: 'gov.usda.snap',
        },
      ],
      PATHS
    );

    expect(cases.map((testCase) => testCase.query)).toEqual([
      'SNAP',
      'Supplemental Nutrition Assistance Program',
    ]);
    expect(cases[0].expectedPrefixes).toEqual(['gov.usda.snap']);
  });

  test('given a full name identical to the name then only one case is built', () => {
    const { cases } = buildProgramEvalCases(
      [{ id: 'tanf', name: 'TANF', full_name: 'TANF', parameter_prefix: 'gov.hhs.tanf' }],
      PATHS
    );

    expect(cases).toHaveLength(1);
  });

  test('given a program with no parameters under its prefix then it is skipped as unmapped', () => {
    const { cases, skippedUnmapped } = buildProgramEvalCases(
      [
        { id: 'ssi-supplement', name: 'SSI state supplement', parameter_prefix: null },
        { id: 'ghost', name: 'Ghost program', parameter_prefix: 'gov.nowhere' },
      ],
      PATHS
    );

    expect(cases).toHaveLength(0);
    expect(skippedUnmapped).toEqual(['SSI state supplement', 'Ghost program']);
  });

  test('given a prefix covering most of the index then it is skipped as too broad', () => {
    const { cases, skippedBroad } = buildProgramEvalCases(
      [{ id: 'state-tax', name: 'State income taxes', parameter_prefix: 'gov.states' }],
      PATHS,
      { maxIndexShare: 0.5 }
    );

    expect(cases).toHaveLength(0);
    expect(skippedBroad).toEqual(['State income taxes']);
  });
});

describe('prefix-matched cases', () => {
  test('given a result inside an expected prefix then the case counts as a hit', () => {
    const metrics = evaluateParameterSearch(
      () => ['other.thing', 'gov.usda.snap.max_allotment'],
      [{ id: 'snap', query: 'SNAP', expectedPrefixes: ['gov.usda.snap'] }],
      { cutoffs: [5] }
    );

    expect(metrics.hitRate['5']).toBe(1);
    expect(metrics.mrr).toBeCloseTo(0.5);
  });

  test('given results only outside the prefix then the case misses', () => {
    const metrics = evaluateParameterSearch(
      () => ['gov.usda.snapshot.other'],
      [{ id: 'snap', query: 'SNAP', expectedPrefixes: ['gov.usda.snap'] }],
      { cutoffs: [5] }
    );

    expect(metrics.hitRate['5']).toBe(0);
    expect(metrics.misses[0].expectedPaths).toEqual(['gov.usda.snap']);
  });
});
