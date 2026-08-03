import { describe, expect, it } from 'vitest';
import { formatValue, getCurrentValue } from '@/utils/parameterValues';

describe('getCurrentValue', () => {
  it('given dated values then returns the latest not-in-the-future value', () => {
    expect(getCurrentValue({ '2020-01-01': 1000, '2025-01-01': 1500, '2099-01-01': 9999 })).toBe(
      1500
    );
  });

  it('given only future values then falls back to the earliest', () => {
    expect(getCurrentValue({ '2098-01-01': 5, '2099-01-01': 7 })).toBe(5);
  });

  it('given no values then returns undefined', () => {
    expect(getCurrentValue(undefined)).toBeUndefined();
    expect(getCurrentValue(null)).toBeUndefined();
  });
});

describe('formatValue', () => {
  it.each([
    [2000, 'currency-USD', '$2,000'],
    [12570, 'currency-GBP', '£12,570'],
    [0.0445, '/1', '4.45%'],
    [true, null, 'on'],
    [false, null, 'off'],
    [undefined, null, '—'],
    ['text', null, 'text'],
  ])('given %s with unit %s then renders %s', (value, unit, expected) => {
    expect(formatValue(value, unit as string | null)).toBe(expected);
  });
});
