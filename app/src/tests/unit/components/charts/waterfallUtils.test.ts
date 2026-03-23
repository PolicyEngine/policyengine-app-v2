import { describe, expect, it } from 'vitest';
import {
  computeWaterfallConnectors,
  computeWaterfallData,
  getWaterfallDomain,
  type WaterfallItem,
} from '@/components/charts/waterfallUtils';

const fmt = (v: number) => `$${v}`;

describe('computeWaterfallData', () => {
  it('stacks all-positive values upward from 0', () => {
    const items: WaterfallItem[] = [
      { name: 'A', value: 10 },
      { name: 'B', value: 5 },
      { name: 'C', value: 3 },
    ];

    const result = computeWaterfallData(items, fmt);

    expect(result).toHaveLength(3);

    // A: base=0, value=10, range=[0,10]
    expect(result[0]).toMatchObject({ base: 0, value: 10, range: [0, 10] });
    // B: base=10, value=5, range=[10,15]
    expect(result[1]).toMatchObject({ base: 10, value: 5, range: [10, 15] });
    // C: base=15, value=3, range=[15,18]
    expect(result[2]).toMatchObject({ base: 15, value: 3, range: [15, 18] });
  });

  it('stacks all-negative values downward from 0', () => {
    const items: WaterfallItem[] = [
      { name: 'A', value: -4 },
      { name: 'B', value: -6 },
    ];

    const result = computeWaterfallData(items, fmt);

    // A: start=0, end=-4, base=min(0,-4)=-4, value=-4, range=[-4,0]
    expect(result[0]).toMatchObject({ base: -4, value: -4, range: [-4, 0] });
    // B: start=-4, end=-10, base=min(-4,-10)=-10, value=-6, range=[-10,-4]
    expect(result[1]).toMatchObject({ base: -10, value: -6, range: [-10, -4] });
  });

  it('handles mixed positive and negative values with correct running total', () => {
    const items: WaterfallItem[] = [
      { name: 'Revenue', value: 10 },
      { name: 'Costs', value: -3 },
      { name: 'Bonus', value: 2 },
    ];

    const result = computeWaterfallData(items, fmt);

    // Revenue: base=0, value=10, range=[0,10]
    expect(result[0]).toMatchObject({ base: 0, value: 10, range: [0, 10] });
    // Costs: start=10, end=7, base=min(10,7)=7, value=-3, range=[7,10]
    expect(result[1]).toMatchObject({ base: 7, value: -3, range: [7, 10] });
    // Bonus: start=7, end=9, base=min(7,9)=7, value=2, range=[7,9]
    expect(result[2]).toMatchObject({ base: 7, value: 2, range: [7, 9] });
  });

  it('anchors total bar to zero', () => {
    const items: WaterfallItem[] = [
      { name: 'A', value: 10 },
      { name: 'B', value: -3 },
      { name: 'Total', value: 7, isTotal: true },
    ];

    const result = computeWaterfallData(items, fmt);

    const total = result[2];
    expect(total.isTotal).toBe(true);
    // Positive total: running=7, base=min(0,7)=0, value=7
    expect(total.base).toBe(0);
    expect(total.value).toBe(7);
    expect(total.range).toEqual([0, 7]);
  });

  it('anchors negative total bar correctly (from negative value to 0)', () => {
    const items: WaterfallItem[] = [
      { name: 'A', value: -5 },
      { name: 'Total', value: -5, isTotal: true },
    ];

    const result = computeWaterfallData(items, fmt);

    const total = result[1];
    // Negative total: running=-5, base=min(0,-5)=-5, value=-5
    expect(total.base).toBe(-5);
    expect(total.value).toBe(-5);
    expect(total.range).toEqual([-5, 0]);
  });

  it('handles a single value (no total)', () => {
    const items: WaterfallItem[] = [{ name: 'Only', value: 42 }];

    const result = computeWaterfallData(items, fmt);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: 'Only',
      base: 0,
      value: 42,
      label: '$42',
      isTotal: false,
    });
  });

  it('handles zero-value items', () => {
    const items: WaterfallItem[] = [
      { name: 'A', value: 5 },
      { name: 'Zero', value: 0 },
      { name: 'B', value: 3 },
    ];

    const result = computeWaterfallData(items, fmt);

    // Zero item: base=5, value=0 (zero height)
    expect(result[1]).toMatchObject({ base: 5, value: 0 });
    // B still starts at 5 (running total unchanged by zero)
    expect(result[2]).toMatchObject({ base: 5, value: 3 });
  });

  it('does not advance running total for total bars', () => {
    const items: WaterfallItem[] = [
      { name: 'A', value: 10 },
      { name: 'Subtotal', value: 10, isTotal: true },
      { name: 'B', value: 5 },
    ];

    const result = computeWaterfallData(items, fmt);

    // B should start from running total of 10 (not 20)
    expect(result[2]).toMatchObject({ base: 10, value: 5 });
  });

  it('formats labels using the provided formatter', () => {
    const items: WaterfallItem[] = [{ name: 'A', value: 100 }];
    const customFmt = (v: number) => `€${v.toFixed(2)}`;

    const result = computeWaterfallData(items, customFmt);

    expect(result[0].label).toBe('€100.00');
  });

  it('returns empty array for empty input', () => {
    expect(computeWaterfallData([], fmt)).toEqual([]);
  });

  it('computes base, value, and range for stacked bar rendering', () => {
    const items: WaterfallItem[] = [
      { name: 'A', value: 10 },
      { name: 'B', value: -3 },
      { name: 'Total', value: 7, isTotal: true },
    ];

    const result = computeWaterfallData(items, fmt);

    // A: base=0, value=10 (visible from 0 to 10)
    expect(result[0].base).toBe(0);
    expect(result[0].value).toBe(10);
    expect(result[0].range).toEqual([0, 10]);
    // B: base=7, value=-3 (visible from 7 to 10)
    expect(result[1].base).toBe(7);
    expect(result[1].value).toBe(-3);
    expect(result[1].range).toEqual([7, 10]);
    // Total: base=0, value=7 (visible from 0 to 7)
    expect(result[2].base).toBe(0);
    expect(result[2].value).toBe(7);
    expect(result[2].range).toEqual([0, 7]);
  });
});

describe('getWaterfallDomain', () => {
  it('returns padded domain that includes all bar positions', () => {
    const data = computeWaterfallData(
      [
        { name: 'A', value: 10 },
        { name: 'B', value: -3 },
        { name: 'Total', value: 7, isTotal: true },
      ],
      fmt
    );

    const [min, max] = getWaterfallDomain(data);

    // Ranges: [0,10], [7,10], [0,7] → min=0, max=10, pad=1.0
    expect(min).toBeLessThan(0);
    expect(max).toBeGreaterThan(10);
  });

  it('includes negative bar positions', () => {
    const data = computeWaterfallData(
      [
        { name: 'A', value: -5 },
        { name: 'B', value: -3 },
      ],
      fmt
    );

    const [min, max] = getWaterfallDomain(data);

    // Ranges: [-5,0], [-8,-5] → min=-8, max=0, pad=0.8
    expect(min).toBeLessThan(-8);
    expect(max).toBeGreaterThan(0);
  });

  it('always includes zero in the range', () => {
    const data = computeWaterfallData([{ name: 'A', value: 5 }], fmt);

    const [min, max] = getWaterfallDomain(data);

    // Range: [0,5] → min=0, max=5, pad=0.5
    expect(min).toBeLessThanOrEqual(0);
    expect(max).toBeGreaterThanOrEqual(5);
  });

  it('returns small default padding for empty data', () => {
    const [min, max] = getWaterfallDomain([]);

    // min=0, max=0, pad defaults to 0.1
    expect(min).toBe(-0.1);
    expect(max).toBe(0.1);
  });
});

describe('computeWaterfallConnectors', () => {
  it('connects all-positive bars at running totals', () => {
    const data = computeWaterfallData(
      [
        { name: 'A', value: 10 },
        { name: 'B', value: 5 },
        { name: 'C', value: 3 },
      ],
      fmt
    );

    const connectors = computeWaterfallConnectors(data);

    expect(connectors).toHaveLength(2);
    // A→B at running total 10 (top of A: base=0 + value=10)
    expect(connectors[0]).toEqual({ y: 10, fromIndex: 0, toIndex: 1 });
    // B→C at running total 15 (top of B: base=10 + value=5)
    expect(connectors[1]).toEqual({ y: 15, fromIndex: 1, toIndex: 2 });
  });

  it('connects mixed positive/negative bars at correct Y values', () => {
    const data = computeWaterfallData(
      [
        { name: 'Revenue', value: 10 },
        { name: 'Costs', value: -3 },
        { name: 'Bonus', value: 2 },
      ],
      fmt
    );

    const connectors = computeWaterfallConnectors(data);

    expect(connectors).toHaveLength(2);
    // Revenue→Costs at 10 (positive: base + value = 0 + 10)
    expect(connectors[0]).toEqual({ y: 10, fromIndex: 0, toIndex: 1 });
    // Costs→Bonus at 7 (negative: base = 7)
    expect(connectors[1]).toEqual({ y: 7, fromIndex: 1, toIndex: 2 });
  });

  it('connects into total bars', () => {
    const data = computeWaterfallData(
      [
        { name: 'A', value: 10 },
        { name: 'B', value: -3 },
        { name: 'Total', value: 7, isTotal: true },
      ],
      fmt
    );

    const connectors = computeWaterfallConnectors(data);

    // A→B at 10, B→Total at 7
    expect(connectors).toHaveLength(2);
    expect(connectors[0]).toEqual({ y: 10, fromIndex: 0, toIndex: 1 });
    expect(connectors[1]).toEqual({ y: 7, fromIndex: 1, toIndex: 2 });
  });

  it('connects through a subtotal bar to the next step', () => {
    const data = computeWaterfallData(
      [
        { name: 'A', value: 10 },
        { name: 'Subtotal', value: 10, isTotal: true },
        { name: 'B', value: 5 },
      ],
      fmt
    );

    const connectors = computeWaterfallConnectors(data);

    // A→Subtotal at 10 (top of A), Subtotal→B at 10 (total's value)
    expect(connectors).toHaveLength(2);
    expect(connectors[0]).toEqual({ y: 10, fromIndex: 0, toIndex: 1 });
    expect(connectors[1]).toEqual({ y: 10, fromIndex: 1, toIndex: 2 });
  });

  it('returns empty array for single bar', () => {
    const data = computeWaterfallData([{ name: 'Only', value: 42 }], fmt);

    expect(computeWaterfallConnectors(data)).toEqual([]);
  });

  it('returns empty array for empty data', () => {
    expect(computeWaterfallConnectors([])).toEqual([]);
  });

  it('handles all-negative bars', () => {
    const data = computeWaterfallData(
      [
        { name: 'A', value: -4 },
        { name: 'B', value: -6 },
      ],
      fmt
    );

    const connectors = computeWaterfallConnectors(data);

    // A: base=-4, value=-4 → negative, connector at base = -4
    expect(connectors).toHaveLength(1);
    expect(connectors[0]).toEqual({ y: -4, fromIndex: 0, toIndex: 1 });
  });
});
