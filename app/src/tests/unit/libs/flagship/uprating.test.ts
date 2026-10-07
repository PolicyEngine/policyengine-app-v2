import { describe, expect, test } from 'vitest';
import { FOREVER } from '@/constants';
import {
  alreadyGrows,
  canGrow,
  defaultRounding,
  grownIntervals,
  growthOf,
  growthOptions,
  growthTiming,
  roundValue,
} from '@/libs/flagship/uprating';
import { ParameterMetadata, ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';

const param = (unit: string, values: Record<string, number>) =>
  ({ parameter: 'gov.x', label: 'x', type: 'parameter', unit, values }) as ParameterMetadata;

const INDEXED_VALUES = { '2026-01-01': 16100, '2027-01-01': 16500, '2028-01-01': 16950 };
const INDEXED = param('currency-USD', INDEXED_VALUES);
const SCHEDULED = param('currency-USD', { '2025-01-01': 2000, '2028-01-01': 2500 });
const PARAMETERS: ParameterMetadataCollection = {
  'gov.bls.cpi.cpi_u': param('currency-USD', {
    '2026-01-01': 100,
    '2027-01-01': 103,
    '2028-01-01': 106.09,
  }),
};

describe('who can grow', () => {
  test('given money then yes; rates, switches, ages and counts no', () => {
    expect(canGrow(param('currency-USD', {}))).toBe(true);
    expect(canGrow(param('currency-GBP', {}))).toBe(true);
    for (const unit of ['/1', 'bool', 'year', 'child', 'person']) {
      expect(canGrow(param(unit, {}))).toBe(false);
    }
  });

  test('given projections for the years ahead then current law already grows it', () => {
    expect(alreadyGrows(INDEXED)).toBe(false); // two years ahead of 2026 is not enough
    expect(alreadyGrows(param('currency-USD', { ...INDEXED_VALUES, '2029-01-01': 17400 }))).toBe(
      true
    );
    expect(alreadyGrows(SCHEDULED)).toBe(false);
  });
});

describe('growthOptions', () => {
  test('given no money among the parameters then there is nothing to offer', () => {
    expect(growthOptions('us', [param('/1', {})], PARAMETERS)).toEqual([]);
  });

  test('given money then hold, and the indexes the metadata carries', () => {
    expect(growthOptions('us', [SCHEDULED], PARAMETERS).map((option) => option.label)).toEqual([
      'None',
      'CPI-U',
    ]);
  });
});

describe('grownIntervals', () => {
  test('given an index then each later year scales with it, the last held on', () => {
    expect(grownIntervals(1000, 2026, 2028, 'gov.bls.cpi.cpi_u', SCHEDULED, PARAMETERS)).toEqual([
      { startDate: '2026-01-01', endDate: '2026-12-31', value: 1000 },
      { startDate: '2027-01-01', endDate: '2027-12-31', value: 1030 },
      { startDate: '2028-01-01', endDate: FOREVER, value: 1061 },
    ]);
  });

  test('given current law then the new value follows its projected growth', () => {
    const intervals = grownIntervals(18000, 2026, 2028, 'current_law', INDEXED, PARAMETERS);

    expect(intervals.map((interval) => interval.value)).toEqual([18000, 18447, 18950]);
  });

  test('given fixed then one value from the year on', () => {
    expect(grownIntervals(18000, 2026, 2028, 'fixed', INDEXED, PARAMETERS)).toEqual([
      { startDate: '2026-01-01', endDate: FOREVER, value: 18000 },
    ]);
  });
});

describe('growthOf', () => {
  const indexed = param('currency-USD', { ...INDEXED_VALUES, '2029-01-01': 17400 });

  test("given a new value on an amount current law indexes then current law's rate", () => {
    expect(growthOf(undefined, indexed)).toBe('current_law');
    expect(growthOf({ value: 17400, baselineValue: 17400 }, indexed)).toBe('current_law');
  });

  test('given an amount current law holds then none', () => {
    expect(growthOf(undefined, SCHEDULED)).toBe('fixed');
  });

  test('given a value set before indexing existed then none, the fixed value it holds', () => {
    expect(growthOf({ value: 18000, baselineValue: 16100 }, indexed)).toBe('fixed');
  });

  test('given a chosen indexing then it holds; a rate is never indexed', () => {
    expect(growthOf({ growth: 'gov.bls.cpi.cpi_u', value: 1, baselineValue: 1 }, indexed)).toBe(
      'gov.bls.cpi.cpi_u'
    );
    expect(
      growthOf({ growth: 'gov.bls.cpi.cpi_u', value: 1, baselineValue: 1 }, param('/1', {}))
    ).toBe('fixed');
  });

  test("given an indexed amount then current law's rate is on offer", () => {
    expect(growthOptions('us', [indexed], PARAMETERS).map((option) => option.label)).toEqual([
      'None',
      "Current law's rate",
      'CPI-U',
    ]);
  });
});

describe('growth timing', () => {
  const CPI = 'gov.bls.cpi.cpi_u';

  test('given no choice then it moves the year after it is set, from that year', () => {
    expect(growthTiming(2026)).toEqual({ start: 2027, base: 2026 });
  });

  test('given a start before the value moves then it waits until the year after', () => {
    expect(growthTiming(2026, { start: 2025, base: 2020 })).toEqual({ start: 2027, base: 2020 });
    expect(growthTiming(2026, { start: 2028, base: 2030 })).toEqual({ start: 2028, base: 2027 });
  });

  test('given a later start then the amount holds until it', () => {
    const values = grownIntervals(1000, 2026, 2028, CPI, SCHEDULED, PARAMETERS, {
      start: 2028,
      base: 2026,
    }).map((interval) => interval.value);

    expect(values).toEqual([1000, 1000, 1061]);
  });

  test('given an earlier base year then the first growth carries the years since it', () => {
    const values = grownIntervals(1000, 2027, 2028, CPI, SCHEDULED, PARAMETERS, {
      start: 2028,
      base: 2026,
    }).map((interval) => interval.value);

    // 2028 is 106.09 over the 2026 base of 100: two years of growth at once.
    expect(values).toEqual([1000, 1061]);
  });
});

describe('rounding', () => {
  test('given a step and a direction then values land on its multiples', () => {
    expect(roundValue(17437, { roundTo: 50, round: 'down' })).toBe(17400);
    expect(roundValue(17437, { roundTo: 50, round: 'nearest' })).toBe(17450);
    expect(roundValue(17401, { roundTo: 50, round: 'up' })).toBe(17450);
    expect(roundValue(17400, { roundTo: 50, round: 'down' })).toBe(17400);
    expect(roundValue(12.346, { roundTo: 0.01, round: 'nearest' })).toBe(12.35);
  });

  test('given an amount current law indexes then the step its projections land on, rounded down', () => {
    const indexed = param('currency-USD', {
      '2026-01-01': 16100,
      '2027-01-01': 16550,
      '2028-01-01': 16950,
      '2029-01-01': 17400,
    });

    expect(defaultRounding(indexed)).toEqual({ roundTo: 50, round: 'down' });
  });

  test('given an amount current law holds then whole units, or cents for cents', () => {
    expect(defaultRounding(SCHEDULED, 2500)).toEqual({ roundTo: 1, round: 'nearest' });
    expect(defaultRounding(SCHEDULED, 2.75)).toEqual({ roundTo: 0.01, round: 'nearest' });
  });

  test('given a rounding then the grown years round, the amount itself does not', () => {
    const values = grownIntervals(
      1005,
      2026,
      2027,
      'gov.bls.cpi.cpi_u',
      SCHEDULED,
      PARAMETERS,
      growthTiming(2026),
      { roundTo: 100, round: 'down' }
    ).map((interval) => interval.value);

    expect(values).toEqual([1005, 1000]);
  });
});
