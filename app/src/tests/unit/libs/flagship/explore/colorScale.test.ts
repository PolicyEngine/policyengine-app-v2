import { describe, expect, test } from 'vitest';
import {
  colorScale,
  levelScale,
  NO_DATA_COLOR,
  SCALE_COLORS,
} from '@/libs/flagship/explore/colorScale';
import { BASELINE_FIXTURE } from '@/tests/fixtures/libs/flagship/explore/baselineFixtures';

describe('colorScale', () => {
  test('given the smallest and largest values then they take the end colors', () => {
    const scale = colorScale([1, 2, 3, 4]);

    expect(scale.color(1)).toBe(SCALE_COLORS[0]);
    expect(scale.color(4)).toBe(SCALE_COLORS[SCALE_COLORS.length - 1]);
  });

  test('given no value then the no-data color is used', () => {
    expect(colorScale([1, 2]).color(undefined)).toBe(NO_DATA_COLOR);
  });

  test('given equal values then the middle color is used', () => {
    expect(colorScale([5, 5]).color(5)).toBe(SCALE_COLORS[3]);
  });

  test('given the district level then the scale spans every district, not one state', () => {
    const scale = levelScale(BASELINE_FIXTURE, 'poverty', 'district');

    expect(scale.min).toBe(0.09);
    expect(scale.max).toBe(0.15);
  });
});
