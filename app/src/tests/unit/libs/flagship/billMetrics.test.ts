import { describe, expect, test } from 'vitest';
import { isAlreadyCurrentLaw, storedBillMetrics } from '@/libs/flagship/billMetrics';
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

  test('given no stored impacts then returns no metrics', () => {
    expect(storedBillMetrics({}, 'us')).toEqual([]);
  });
});

describe('isAlreadyCurrentLaw', () => {
  test('given every provision matches current law then the bill is already law', () => {
    expect(
      isAlreadyCurrentLaw([
        { value: 0.0445, baselineValue: 0.0445 },
        { value: '250', baselineValue: 250 },
        { value: true, baselineValue: true },
      ])
    ).toBe(true);
  });

  test('given any provision changes current law then the bill is not yet law', () => {
    expect(
      isAlreadyCurrentLaw([
        { value: 0.0445, baselineValue: 0.0445 },
        { value: 5000, baselineValue: 2200 },
      ])
    ).toBe(false);
  });

  test('given no provisions or unknown current values then the bill is not treated as law', () => {
    expect(isAlreadyCurrentLaw([])).toBe(false);
    expect(isAlreadyCurrentLaw([{ value: undefined, baselineValue: undefined }])).toBe(false);
    expect(isAlreadyCurrentLaw([{ value: false, baselineValue: undefined }])).toBe(false);
  });
});
