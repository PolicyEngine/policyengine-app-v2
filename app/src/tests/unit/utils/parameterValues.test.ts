import { describe, expect, it } from 'vitest';
import {
  currencySymbolForUnit,
  formatValue,
  getCurrentValue,
  isPercentageUnit,
  parseValueFromQuestion,
} from '@/utils/parameterValues';

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

describe('parseValueFromQuestion', () => {
  it.each([
    ['raise the child tax credit to $3,600', 'currency-USD', 3600],
    ['raise the personal allowance to £15,000', 'currency-GBP', 15000],
    ['cut the rate to 4.45%', '/1', 0.0445],
    ['set the limit to 3 children', 'child', 3],
    ['raise the CTC from $2,000 to $3,600', 'currency-USD', 3600],
  ])('given "%s" with unit %s then parses %s', (question, unit, expected) => {
    expect(parseValueFromQuestion(question, unit)).toBe(expected);
  });

  it.each([
    ['remove the two-child limit entirely', 'currency-USD'],
    ['cut the rate to 4.45%', 'currency-USD'],
    ['raise it to $3,600', '/1'],
  ])('given "%s" with unit %s then does not guess', (question, unit) => {
    expect(parseValueFromQuestion(question, unit)).toBeUndefined();
  });
});

describe('formatValue', () => {
  it.each([
    [2000, 'currency-USD', '$2,000'],
    [12570, 'currency-GBP', '£12,570'],
    [0.0445, '/1', '4.45%'],
    [true, null, 'true'],
    [false, null, 'false'],
    [undefined, null, '—'],
    ['text', null, 'text'],
    // UK parameters spell pounds three ways.
    [16000, 'GBP', '£16,000'],
    [1, 'currency_GBP', '£1'],
    [2000, 'USD', '$2,000'],
    // The sign goes before the symbol.
    [-500, 'currency-GBP', '−£500'],
    [-500, 'currency-USD', '−$500'],
    [0.5, 'marginal-rate', '50%'],
  ])('given %s with unit %s then renders %s', (value, unit, expected) => {
    expect(formatValue(value, unit as string | null)).toBe(expected);
  });
});

describe('currencySymbolForUnit', () => {
  it.each([
    ['currency-GBP', '£'],
    ['GBP', '£'],
    ['currency_GBP', '£'],
    ['currency-USD', '$'],
    ['/1', null],
    [null, null],
  ])('given unit %s then %s', (unit, expected) => {
    expect(currencySymbolForUnit(unit)).toBe(expected);
  });
});

describe('isPercentageUnit', () => {
  it('given a rate unit then true; money then false', () => {
    expect(isPercentageUnit('/1')).toBe(true);
    expect(isPercentageUnit('marginal-rate')).toBe(true);
    expect(isPercentageUnit('GBP')).toBe(false);
  });
});
