import { describe, expect, test } from 'vitest';
import { FOREVER } from '@/constants';
import {
  alreadyGrows,
  canGrow,
  defaultGrowth,
  grownIntervals,
  growthOf,
  growthOptions,
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

  test('given an indexed amount then it keeps growing by default; others hold', () => {
    const indexedValues = { ...INDEXED_VALUES, '2029-01-01': 17400 };
    const indexed = param('currency-USD', indexedValues);

    expect(defaultGrowth(indexed)).toBe('current_law');
    expect(defaultGrowth(SCHEDULED)).toBe('fixed');
    expect(defaultGrowth(param('/1', indexedValues))).toBe('fixed');
  });
});

describe('growthOptions', () => {
  test('given no money among the parameters then there is nothing to offer', () => {
    expect(growthOptions('us', [param('/1', {})], PARAMETERS)).toEqual([]);
  });

  test('given money then hold, and the indexes the metadata carries', () => {
    expect(growthOptions('us', [SCHEDULED], PARAMETERS).map((option) => option.label)).toEqual([
      'Stays at this value',
      'Grows with CPI-U',
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

  test('given a value not set yet then the parameter default applies', () => {
    expect(growthOf({ value: 16100, baselineValue: 16100 }, indexed)).toBe('current_law');
  });

  test('given a value set before growth existed then it stays the fixed value it holds', () => {
    expect(growthOf({ value: 18000, baselineValue: 16100 }, indexed)).toBe('fixed');
  });

  test('given a chosen growth then it holds', () => {
    expect(
      growthOf({ value: 18000, baselineValue: 16100, growth: 'gov.bls.cpi.cpi_u' }, indexed)
    ).toBe('gov.bls.cpi.cpi_u');
  });
});
