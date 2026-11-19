import { describe, expect, test } from 'vitest';
import { EXPLORE_METRICS, exploreMetric } from '@/libs/flagship/explore/exploreMetrics';
import { leversFor } from '@/libs/flagship/explore/reformLevers';

describe('leversFor', () => {
  test('given child poverty then the Child Tax Credit comes first', () => {
    expect(leversFor(exploreMetric('child_poverty'))[0].title).toBe('Raise the Child Tax Credit');
  });

  test('given a measure without rules of its own then it offers its theme rules', () => {
    expect(leversFor(exploreMetric('gini'))).toBe(leversFor(exploreMetric('top_10_share')));
  });

  test('given any measure then each rule has words for the parameter search', () => {
    for (const metric of EXPLORE_METRICS) {
      const levers = leversFor(metric);

      expect(levers.length).toBeGreaterThan(0);
      expect(levers.every((lever) => lever.search.length > 0)).toBe(true);
    }
  });
});
