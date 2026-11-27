import { describe, expect, test } from 'vitest';
import {
  EXPLORE_METRICS,
  exploreMetric,
  formatCount,
  isShownAt,
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

  test('given school meals then it counts school-age children', () => {
    const meals = exploreMetric('receipt_school_meals');

    expect(meals.valueLabel).toBe(
      'of school-age children receive free or reduced-price school meals'
    );
  });

  test('given Medicaid then it counts people', () => {
    expect(unitPlural(exploreMetric('receipt_medicaid').recipients!.unit)).toBe('people');
  });

  test('given every benefit measure then each has a recipients figure', () => {
    const benefits = EXPLORE_METRICS.filter((metric) => metric.theme === 'benefits');

    expect(benefits.every((metric) => metric.recipients?.key.startsWith('recipients_'))).toBe(true);
  });
});

describe('isShownAt', () => {
  test('given senior poverty then no level shows it, and it says why', () => {
    const seniors = exploreMetric('senior_poverty');

    expect(isShownAt(seniors, 'nation')).toBe(false);
    expect(isShownAt(seniors, 'state')).toBe(false);
    expect(seniors.hiddenReason).toMatch(/Under review/);
  });

  test('given a program whose state counts are far from the agency then only the nation shows it', () => {
    for (const key of ['receipt_tanf', 'receipt_wic', 'receipt_ssi', 'receipt_aca_ptc']) {
      const metric = exploreMetric(key);

      expect(isShownAt(metric, 'nation')).toBe(true);
      expect(isShownAt(metric, 'state')).toBe(false);
      expect(metric.hiddenReason).toBeTruthy();
    }
  });

  test('given the top 1% share then only the nation shows it', () => {
    expect(isShownAt(exploreMetric('top_1_share'), 'state')).toBe(false);
  });

  test('given poverty then both levels show it', () => {
    expect(isShownAt(exploreMetric('poverty'), 'nation')).toBe(true);
    expect(isShownAt(exploreMetric('poverty'), 'state')).toBe(true);
  });
});
