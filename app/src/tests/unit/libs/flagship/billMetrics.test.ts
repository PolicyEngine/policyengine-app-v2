import { describe, expect, test } from 'vitest';
import { isAlreadyCurrentLaw, lawValuesFrom, storedBillMetrics } from '@/libs/flagship/billMetrics';
import { TRACKED_BILL } from '@/tests/fixtures/libs/flagship/trackedBillMocks';

describe('storedBillMetrics', () => {
  test('given full stored impacts then returns the overview metrics in report form', () => {
    expect(storedBillMetrics(TRACKED_BILL, 'us')).toEqual([
      { value: '$225.5bn', label: 'Annual revenue loss' },
      { value: '43.5%', label: 'Households gaining' },
      { value: '39.9% decrease', label: 'Child poverty · relative change' },
    ]);
  });

  test('given only headline impacts then falls back to overall poverty', () => {
    expect(
      storedBillMetrics({ impacts: { revenue: -74_200_000, povertyPercentChange: 0 } }, 'us')
    ).toEqual([
      { value: '$74.2m', label: 'Annual revenue loss' },
      { value: 'No change', label: 'Poverty · relative change' },
    ]);
  });

  test('given a state bill then its stored revenue reads as state revenue', () => {
    expect(storedBillMetrics({ state: 'UT', impacts: { revenue: -74_200_000 } }, 'us')).toEqual([
      { value: '$74.2m', label: 'Annual state revenue loss' },
    ]);
  });

  test('given no stored impacts then returns no metrics', () => {
    expect(storedBillMetrics({}, 'us')).toEqual([]);
  });
});

describe('lawValuesFrom', () => {
  test('given dated values then returns the value in effect and every later change', () => {
    const values = { '2020-01-01': 0.05, '2025-01-01': 0.045, '2027-01-01': 0.04 };
    expect(lawValuesFrom(values, '2026-01-01')).toEqual([0.045, 0.04]);
    expect(lawValuesFrom(values, '2019-01-01')).toEqual([0.05, 0.045, 0.04]);
    expect(lawValuesFrom(undefined, '2026-01-01')).toEqual([]);
  });
});

describe('isAlreadyCurrentLaw', () => {
  test('given every provision matches current law throughout then the bill is already law', () => {
    expect(
      isAlreadyCurrentLaw([
        { value: 0.0445, lawValues: [0.0445] },
        { value: '250', lawValues: [250, 250] },
        { value: true, lawValues: [true] },
      ])
    ).toBe(true);
  });

  test('given any provision changes current law then the bill is not yet law', () => {
    expect(
      isAlreadyCurrentLaw([
        { value: 0.0445, lawValues: [0.0445] },
        { value: 5000, lawValues: [2200] },
      ])
    ).toBe(false);
  });

  test('given a bill that freezes a scheduled change then it is not already law', () => {
    expect(isAlreadyCurrentLaw([{ value: 0.0445, lawValues: [0.0445, 0.04] }])).toBe(false);
  });

  test('given no provisions or unknown current law then the bill is not treated as law', () => {
    expect(isAlreadyCurrentLaw([])).toBe(false);
    expect(isAlreadyCurrentLaw([{ value: 0.0445, lawValues: [] }])).toBe(false);
    expect(isAlreadyCurrentLaw([{ value: false, lawValues: [undefined] }])).toBe(false);
  });
});
