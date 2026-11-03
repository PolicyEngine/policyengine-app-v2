import { describe, expect, test } from 'vitest';
import { fittedRateTicks } from '@/pages/report-output/marginal-tax-rates/MarginalTaxRatesSubPage';
import {
  householdChartLabelDx,
  householdChartLegendProps,
  RECHARTS_FONT_STYLE,
} from '@/utils/chartUtils';

describe('household variation chart tidying', () => {
  test('given no opt-in then the legend and axis title stay as v2 has them', () => {
    expect(householdChartLegendProps()).toEqual({ verticalAlign: 'top', align: 'left' });
    expect(householdChartLabelDx(-40)).toBe(-40);
  });

  test('given the opt-in then the legend sits top right, in the ticks size, with room under it', () => {
    const legend = householdChartLegendProps(true);

    expect(legend).toMatchObject({ verticalAlign: 'top', align: 'right' });
    expect(legend.wrapperStyle?.fontSize).toBe(RECHARTS_FONT_STYLE.fontSize);
    expect(legend.wrapperStyle?.paddingBottom).toBeGreaterThan(0);
    // The axis title moves toward the ticks.
    expect(householdChartLabelDx(-40, true)).toBeGreaterThan(-40);
  });
});

describe('fittedRateTicks', () => {
  test('given rates between 0% and 62% then the axis runs from 0% to just above them', () => {
    const ticks = fittedRateTicks([
      { baseline: 0, reform: 0 },
      { baseline: 0.28, reform: 0.28 },
      { baseline: 0.62, reform: 0.55 },
    ]);

    expect(ticks[0]).toBe(0);
    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(0.62);
    expect(ticks[ticks.length - 1]).toBeLessThanOrEqual(1);
  });

  test('given a negative rate then 0% stays in view and the axis reaches below it', () => {
    const ticks = fittedRateTicks([{ baseline: -0.5 }, { baseline: 0.3 }]);

    expect(ticks[0]).toBeLessThan(-0.5);
    expect(ticks).toContain(0);
    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(0.3);
  });

  test('given a rate clipped at 200% then the axis reaches it', () => {
    const ticks = fittedRateTicks([{ baseline: 0.2 }, { baseline: 2 }]);

    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(2);
  });

  test('given only 0% then the axis still has a range', () => {
    expect(fittedRateTicks([{ baseline: 0, reform: 0 }]).length).toBeGreaterThan(1);
  });
});
