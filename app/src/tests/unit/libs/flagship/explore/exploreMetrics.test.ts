import { describe, expect, test } from 'vitest';
import {
  EXPLORE_METRICS,
  exploreMetric,
  formatCount,
  unitPlural,
} from '@/libs/flagship/explore/exploreMetrics';

describe('formatCount', () => {
  test('given millions then it shows one or two decimals', () => {
    expect(formatCount(18_400_000)).toBe('18.4M');
    expect(formatCount(6_704_328)).toBe('6.70M');
  });

  test('given thousands then it shows whole thousands', () => {
    expect(formatCount(849_438)).toBe('849k');
  });

  test('given fewer than a thousand then it shows the number', () => {
    expect(formatCount(412)).toBe('412');
  });
});

describe('benefit measures', () => {
  test('given SNAP then it counts households and says so', () => {
    const snap = exploreMetric('receipt_snap');

    expect(snap.recipients).toEqual({ key: 'recipients_snap', unit: 'household' });
    expect(snap.valueLabel).toBe('of households receive SNAP');
  });

  test('given the EITC then it counts tax units that claim it', () => {
    const eitc = exploreMetric('receipt_eitc');

    expect(eitc.recipients?.unit).toBe('tax unit');
    expect(eitc.valueLabel).toBe('of tax units claim the EITC');
  });

  test('given free school meals then it counts families', () => {
    const meals = exploreMetric('receipt_school_meals');

    expect(meals.valueLabel).toBe('of families receive free school meals');
  });

  test('given Medicaid then it counts people', () => {
    expect(unitPlural(exploreMetric('receipt_medicaid').recipients!.unit)).toBe('people');
  });

  test('given every benefit measure then each has a recipients figure', () => {
    const benefits = EXPLORE_METRICS.filter((metric) => metric.theme === 'benefits');

    expect(benefits.every((metric) => metric.recipients?.key.startsWith('recipients_'))).toBe(true);
  });
});
