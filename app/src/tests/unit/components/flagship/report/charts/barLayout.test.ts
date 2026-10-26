import { describe, expect, test } from 'vitest';
import {
  fitAxisTitle,
  fitFontSize,
  fitValueLabels,
  fixedPlotHeight,
  formatUnitAmount,
  getCategoryAxis,
  getDomainTicks,
  getLabelledDomain,
  getValueBarLayout,
  getWaterfallLayout,
  labelDirections,
  OUTSIDE_LABEL_SPACE,
  pickCurrencyUnit,
  tickDecimals,
  VALUE_LABEL_MIN_FONT_SIZE,
  wrapLabel,
  X_AXIS_HEIGHT,
  type CurrencyUnit,
} from '@/components/flagship/report/charts/barLayout';

/** A monospaced stand-in for the chart font: each character 0.6em wide. */
const measure = (text: string, fontSize: number) => text.length * fontSize * 0.6;

const MILLIONS: CurrencyUnit = { divisor: 1e6, suffix: 'm' };
const BILLIONS: CurrencyUnit = { divisor: 1e9, suffix: 'bn' };
const PLOT_HEIGHT = 200;

/** Report 4332's waterfall in millions: federal, state and local, net. */
const REPORT_4332_BARS = [
  { value: -296.465, range: [-296.465, 0] as [number, number] },
  { value: -34.515, range: [-330.981, -296.465] as [number, number] },
  { value: -330.981, range: [-330.981, 0] as [number, number] },
];

/** Pixels from a value down to the domain's bottom edge. */
const pixelsAboveBottom = (value: number, [low, high]: [number, number], height = PLOT_HEIGHT) =>
  ((value - low) / (high - low)) * height;

describe('pickCurrencyUnit', () => {
  test('given amounts under a billion then the unit is millions', () => {
    expect(pickCurrencyUnit([-296.5e6, -34.5e6, -331e6])).toEqual(MILLIONS);
  });

  test('given an amount of a billion or more then the unit is billions', () => {
    expect(pickCurrencyUnit([-0.4e9, 5.2e9])).toEqual(BILLIONS);
  });

  test('given trillions, thousands or less then the unit follows', () => {
    expect(pickCurrencyUnit([2.5e12]).suffix).toBe('tn');
    expect(pickCurrencyUnit([812e3]).suffix).toBe('k');
    expect(pickCurrencyUnit([450]).suffix).toBe('');
  });

  test('given a non-finite amount then it is ignored', () => {
    expect(pickCurrencyUnit([Number.NaN, 3e6])).toEqual(MILLIONS);
  });
});

describe('formatUnitAmount', () => {
  test('given a negative amount then the minus comes before the currency symbol', () => {
    expect(formatUnitAmount(-100, MILLIONS, '$')).toBe('−$100m');
  });

  test('given zero then it reads "$0" with no unit', () => {
    expect(formatUnitAmount(0, MILLIONS, '$')).toBe('$0');
    expect(formatUnitAmount(-0.00001, MILLIONS, '$', 2)).toBe('$0');
  });

  test('given decimals and thousands then both are written', () => {
    expect(formatUnitAmount(2.5, BILLIONS, '£', 1)).toBe('£2.5bn');
    expect(formatUnitAmount(-1000, MILLIONS, '$')).toBe('−$1,000m');
  });
});

describe('tickDecimals', () => {
  test('given whole ticks then no decimals', () => {
    expect(tickDecimals([-300, -200, -100, 0])).toBe(0);
  });

  test('given quarter steps then two decimals', () => {
    expect(tickDecimals([-0.75, -0.5, -0.25, 0])).toBe(2);
  });

  test('given floating-point noise then the clean count', () => {
    expect(tickDecimals([0, 0.1 + 0.2, 0.6])).toBe(1);
  });
});

describe('labelDirections', () => {
  test('given mixed signs then labels point away from zero', () => {
    expect(labelDirections([-1, 2, -3])).toEqual(['down', 'up', 'down']);
  });

  test('given zeros among negative changes then their labels point down too', () => {
    expect(labelDirections([-0.005, 0, -0.002])).toEqual(['down', 'down', 'down']);
  });

  test('given zeros among positive changes or no change at all then labels point up', () => {
    expect(labelDirections([0, 0.008])).toEqual(['up', 'up']);
    expect(labelDirections([0, 0])).toEqual(['up', 'up']);
  });
});

describe('getLabelledDomain', () => {
  test('given only negative values then the domain tops out at zero', () => {
    const domain = getLabelledDomain([-331, 0], [{ value: -331, direction: 'down' }], PLOT_HEIGHT);

    expect(domain[1]).toBe(0);
  });

  test('given an outside label at the lowest value then exactly its room is left below', () => {
    const domain = getLabelledDomain([-331, 0], [{ value: -331, direction: 'down' }], PLOT_HEIGHT);

    expect(pixelsAboveBottom(-331, domain)).toBeCloseTo(OUTSIDE_LABEL_SPACE, 6);
  });

  test('given mixed values then each side leaves room for its label', () => {
    const domain = getLabelledDomain(
      [-3.4, 2.1],
      [
        { value: 2.1, direction: 'up' },
        { value: -3.4, direction: 'down' },
      ],
      PLOT_HEIGHT
    );

    expect(pixelsAboveBottom(-3.4, domain)).toBeCloseTo(OUTSIDE_LABEL_SPACE, 6);
    expect(PLOT_HEIGHT - pixelsAboveBottom(2.1, domain)).toBeCloseTo(OUTSIDE_LABEL_SPACE, 6);
  });

  test('given no outside labels then the domain hugs the data with a few pixels', () => {
    const domain = getLabelledDomain([0, 100], [], PLOT_HEIGHT);

    expect(domain[0]).toBe(0);
    expect(PLOT_HEIGHT - pixelsAboveBottom(100, domain)).toBeLessThan(OUTSIDE_LABEL_SPACE / 2);
  });

  test('given no change at all then zero sits mid-plot', () => {
    expect(getLabelledDomain([0, 0], [{ value: 0, direction: 'up' }], PLOT_HEIGHT)).toEqual([
      -1, 1,
    ]);
  });

  test('given a tiny plot then the domain stays finite and still shows the bars', () => {
    const [low, high] = getLabelledDomain([-1, 1], [{ value: -1, direction: 'down' }], 20);

    expect(Number.isFinite(low)).toBe(true);
    expect(1 / (high - low)).toBeGreaterThan(0.3);
  });
});

describe('getDomainTicks', () => {
  test('given report 4332 in millions then ticks stop at the data and include no positive tick', () => {
    const domain = getLabelledDomain([-331, 0], [{ value: -331, direction: 'down' }], PLOT_HEIGHT);

    expect(getDomainTicks(domain, [-331, 0], PLOT_HEIGHT)).toEqual([-300, -200, -100, 0]);
  });

  test('given a tick close to the bottom edge then it is dropped so no gridline sits on the category labels', () => {
    const domain: [number, number] = [-0.305, 0];

    const ticks = getDomainTicks(domain, [-0.29, 0], PLOT_HEIGHT);

    expect(ticks).not.toContain(-0.3);
    expect(ticks).toContain(0);
  });

  test('given only positive values then no negative tick', () => {
    const domain = getLabelledDomain([0, 12], [{ value: 12, direction: 'up' }], PLOT_HEIGHT);

    expect(Math.min(...getDomainTicks(domain, [0, 12], PLOT_HEIGHT))).toBe(0);
  });

  test('given no change then the only tick is zero', () => {
    expect(getDomainTicks([-1, 1], [0, 0], PLOT_HEIGHT)).toEqual([0]);
  });
});

describe('getWaterfallLayout', () => {
  test('given report 4332 then the small middle bar gets an outside label below and the others inside', () => {
    const { placements } = getWaterfallLayout(REPORT_4332_BARS, PLOT_HEIGHT);

    expect(placements).toEqual(['inside', 'down', 'inside']);
  });

  test('given report 4332 then there is room for the outside label and no room above zero', () => {
    const { domain, ticks } = getWaterfallLayout(REPORT_4332_BARS, PLOT_HEIGHT);

    expect(domain[1]).toBe(0);
    expect(pixelsAboveBottom(-330.981, domain)).toBeGreaterThanOrEqual(OUTSIDE_LABEL_SPACE - 1e-6);
    expect(ticks).toEqual([-300, -200, -100, 0]);
  });

  test('given only tall bars then every label sits inside and the domain hugs the data', () => {
    const bars = [
      { value: 5, range: [0, 5] as [number, number] },
      { value: 5, range: [0, 5] as [number, number] },
    ];

    const { domain, placements } = getWaterfallLayout(bars, PLOT_HEIGHT);

    expect(placements).toEqual(['inside', 'inside']);
    expect(PLOT_HEIGHT - pixelsAboveBottom(5, domain)).toBeLessThan(OUTSIDE_LABEL_SPACE / 2);
  });

  test('given a small positive step then its label points up with room above', () => {
    const bars = [
      { value: 100, range: [0, 100] as [number, number] },
      { value: 2, range: [100, 102] as [number, number] },
      { value: 102, range: [0, 102] as [number, number] },
    ];

    const { domain, placements } = getWaterfallLayout(bars, PLOT_HEIGHT);

    expect(placements[1]).toBe('up');
    expect(PLOT_HEIGHT - pixelsAboveBottom(102, domain)).toBeGreaterThanOrEqual(
      OUTSIDE_LABEL_SPACE - 1e-6
    );
  });
});

describe('fitValueLabels', () => {
  const base = {
    directions: ['up', 'up', 'up'] as const,
    domain: [0, 1.25] as [number, number],
    plotHeight: PLOT_HEIGHT,
    measure,
  };

  test('given room then every label shows at full size', () => {
    const result = fitValueLabels({
      ...base,
      directions: [...base.directions],
      texts: ['+0.1%', '+0.5%', '+1.0%'],
      values: [0.1, 0.5, 1],
      plotWidth: 600,
    });

    expect(result).toEqual({ fontSize: 12, visible: [true, true, true] });
  });

  test('given neighbours at the same height then the font shrinks until they clear', () => {
    const result = fitValueLabels({
      ...base,
      directions: [...base.directions],
      texts: ['+0.0%', '+0.0%', '+0.0%'],
      values: [0, 0, 0],
      plotWidth: 3 * 32,
    });

    expect(result.fontSize).toBeLessThan(12);
    expect(result.visible).toEqual([true, true, true]);
  });

  test('given no room even at the smallest font then the larger changes keep their labels', () => {
    const result = fitValueLabels({
      ...base,
      directions: [...base.directions],
      texts: ['+0.1%', '+0.2%', '+0.1%'],
      values: [0.1, 0.2, 0.1],
      plotWidth: 3 * 20,
    });

    expect(result.visible[1]).toBe(true);
    expect(result.visible.filter(Boolean).length).toBeLessThan(3);
  });
});

describe('getValueBarLayout', () => {
  test('given report 4332 poverty changes by age then labels point down and fit below the lowest bar', () => {
    const values = [-0.00456, -0.00158, 0, -0.00223];

    const layout = getValueBarLayout(
      values,
      ['-0.5%', '-0.2%', '0.0%', '-0.2%'],
      { width: 300, height: PLOT_HEIGHT },
      measure
    );

    expect(layout.directions).toEqual(['down', 'down', 'down', 'down']);
    expect(layout.domain[1]).toBe(0);
    expect(pixelsAboveBottom(-0.00456, layout.domain)).toBeCloseTo(OUTSIDE_LABEL_SPACE, 6);
    expect(layout.labelVisible).toEqual([true, true, true, true]);
  });

  test('given a rate change that divides to NaN then it lays out as no change', () => {
    const layout = getValueBarLayout(
      [Number.NaN, -0.01],
      ['', '-1.0%'],
      { width: 300, height: PLOT_HEIGHT },
      measure
    );

    expect(layout.domain.every(Number.isFinite)).toBe(true);
    expect(layout.directions).toEqual(['down', 'down']);
  });
});

describe('text fitting', () => {
  test('given room for a full-size font then fitFontSize returns it', () => {
    expect(fitFontSize('−$34.5m', 100, { measure })).toBe(12);
  });

  test('given too little room for any font then fitFontSize returns null', () => {
    expect(fitFontSize('−$34.5m', 10, { measure })).toBeNull();
  });

  test('given a short plot then fitAxisTitle falls back to a shorter title', () => {
    expect(
      fitAxisTitle(
        ['Relative change in poverty rate', 'Poverty change (%)', 'Change (%)'],
        100,
        measure
      )
    ).toBe('Change (%)');
  });

  test('given a plot too short for every title then fitAxisTitle shows none', () => {
    expect(fitAxisTitle(['Change (%)'], 40, measure)).toBeUndefined();
  });

  test('given a fixed-height chart then the plot is what margins and the x-axis leave', () => {
    expect(fixedPlotHeight(280, { top: 12, bottom: 20 })).toBe(218);
  });
});

describe('category axis', () => {
  const FONT = { fontFamily: 'Inter', fontSize: 12, fill: '#6B7280' };

  test('given words that fit a slot together then wrapLabel keeps them on one line', () => {
    expect(wrapLabel('Top 1% share', 100, 12, measure)).toEqual(['Top 1% share']);
  });

  test('given a narrow slot then wrapLabel breaks between words', () => {
    expect(wrapLabel('State and local income tax revenues', 80, 12, measure)).toEqual([
      'State and',
      'local',
      'income tax',
      'revenues',
    ]);
  });

  test('given a wide plot then the axis keeps the chart font and Recharts’ height', () => {
    const axis = getCategoryAxis(['Male', 'Female', 'All'], 600, FONT, measure);

    expect(axis.tick).toEqual({ ...FONT, width: 196 });
    expect(axis.height).toBe(X_AXIS_HEIGHT);
  });

  test('given a word wider than its slot then the font shrinks until it fits', () => {
    // Five slots of 48px: "Hispanic" is 57.6px at 12px and 48px at 10px.
    const axis = getCategoryAxis(
      ['Black', 'Other', 'White', 'Hispanic', 'All'],
      260,
      FONT,
      measure
    );

    expect(axis.tick.fontSize).toBe(10);
  });

  test('given a word too wide for the smallest font then the font stops at that size', () => {
    const axis = getCategoryAxis(['Supercalifragilistic', 'All'], 60, FONT, measure);

    expect(axis.tick.fontSize).toBe(VALUE_LABEL_MIN_FONT_SIZE);
  });

  test('given labels that wrap then the axis grows to hold the most lines', () => {
    const axis = getCategoryAxis(
      ['Federal tax revenues', 'State and local income tax revenues', 'Net impact'],
      252,
      FONT,
      measure
    );

    // Slots of 80px: the state label wraps to four lines of 12px.
    expect(axis.tick.width).toBe(80);
    expect(axis.height).toBe(8 + 4 * 12 + 2);
  });
});
