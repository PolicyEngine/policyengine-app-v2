import { describe, expect, it } from 'vitest';
import {
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

    // A: bottom=0, top=10
    expect(result[0]).toMatchObject({ barBottom: 0, barTop: 10 });
    // B: bottom=10, top=15
    expect(result[1]).toMatchObject({ barBottom: 10, barTop: 15 });
    // C: bottom=15, top=18
    expect(result[2]).toMatchObject({ barBottom: 15, barTop: 18 });
  });

  it('stacks all-negative values downward from 0', () => {
    const items: WaterfallItem[] = [
      { name: 'A', value: -4 },
      { name: 'B', value: -6 },
    ];

    const result = computeWaterfallData(items, fmt);

    // A: running=0, negative → bottom=-4, top=0
    expect(result[0]).toMatchObject({ barBottom: -4, barTop: 0 });
    // B: running=-4, negative → bottom=-10, top=-4
    expect(result[1]).toMatchObject({ barBottom: -10, barTop: -4 });
  });

  it('handles mixed positive and negative values with correct running total', () => {
    const items: WaterfallItem[] = [
      { name: 'Revenue', value: 10 },
      { name: 'Costs', value: -3 },
      { name: 'Bonus', value: 2 },
    ];

    const result = computeWaterfallData(items, fmt);

    // Revenue: bottom=0, top=10
    expect(result[0]).toMatchObject({ barBottom: 0, barTop: 10 });
    // Costs: running=10, negative → bottom=7, top=10
    expect(result[1]).toMatchObject({ barBottom: 7, barTop: 10 });
    // Bonus: running=7, positive → bottom=7, top=9
    expect(result[2]).toMatchObject({ barBottom: 7, barTop: 9 });
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
    // Positive total: bottom=0, top=7
    expect(total.barBottom).toBe(0);
    expect(total.barTop).toBe(7);
  });

  it('anchors negative total bar correctly (from negative value to 0)', () => {
    const items: WaterfallItem[] = [
      { name: 'A', value: -5 },
      { name: 'Total', value: -5, isTotal: true },
    ];

    const result = computeWaterfallData(items, fmt);

    const total = result[1];
    expect(total.barBottom).toBe(-5);
    expect(total.barTop).toBe(0);
  });

  it('handles a single value (no total)', () => {
    const items: WaterfallItem[] = [{ name: 'Only', value: 42 }];

    const result = computeWaterfallData(items, fmt);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: 'Only',
      barBottom: 0,
      barTop: 42,
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

    // Zero item: bottom=5, top=5 (zero height)
    expect(result[1]).toMatchObject({ barBottom: 5, barTop: 5, value: 0 });
    // B still starts at 5 (running total unchanged by zero)
    expect(result[2]).toMatchObject({ barBottom: 5, barTop: 8 });
  });

  it('does not advance running total for total bars', () => {
    const items: WaterfallItem[] = [
      { name: 'A', value: 10 },
      { name: 'Subtotal', value: 10, isTotal: true },
      { name: 'B', value: 5 },
    ];

    const result = computeWaterfallData(items, fmt);

    // B should start from running total of 10 (not 20)
    expect(result[2]).toMatchObject({ barBottom: 10, barTop: 15 });
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

  it('includes waterfallRange tuple [barBottom, barTop] for Recharts range bars', () => {
    const items: WaterfallItem[] = [
      { name: 'A', value: 10 },
      { name: 'B', value: -3 },
      { name: 'Total', value: 7, isTotal: true },
    ];

    const result = computeWaterfallData(items, fmt);

    // Recharts range bars require a data property (not a function) that is [low, high]
    expect(result[0].waterfallRange).toEqual([0, 10]);
    expect(result[1].waterfallRange).toEqual([7, 10]);
    expect(result[2].waterfallRange).toEqual([0, 7]);
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

    // Min barBottom is 0 (from A and Total), max barTop is 15 (from B's top = A's top = 10)
    // Actually: A bottom=0, top=10; B bottom=7, top=10; Total bottom=0, top=7
    // So range is 0..10, pad = 1.0
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

    // A: bottom=-5, top=0; B: bottom=-8, top=-5
    // Range: -8..0, pad=0.8
    expect(min).toBeLessThan(-8);
    expect(max).toBeGreaterThan(0);
  });

  it('always includes zero in the range', () => {
    const data = computeWaterfallData([{ name: 'A', value: 5 }], fmt);

    const [min, max] = getWaterfallDomain(data);

    // barBottom=0, barTop=5 → range 0..5, pad=0.5
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
