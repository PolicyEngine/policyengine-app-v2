import { describe, expect, test } from 'vitest';
import { enteredValuePeriod, enteredValuePeriodLabel, periodLabel } from '@/utils/variablePeriod';

describe('periodLabel', () => {
  test('given the model periods then each has its label', () => {
    expect(periodLabel('year')).toBe('Annually');
    expect(periodLabel('month')).toBe('Monthly');
    expect(periodLabel('week')).toBe('Weekly');
    expect(periodLabel('day')).toBe('Daily');
  });

  test('given another period then it reads "Per" the period', () => {
    expect(periodLabel('quarter')).toBe('Per quarter');
  });

  test('given eternity or no period then there is no label', () => {
    expect(periodLabel('eternity')).toBeNull();
    expect(periodLabel(undefined)).toBeNull();
    expect(periodLabel(null)).toBeNull();
    expect(periodLabel('')).toBeNull();
  });
});

describe('enteredValuePeriod', () => {
  test('given money defined per year then it is entered for the year', () => {
    expect(enteredValuePeriod({ unit: 'currency-USD', definitionPeriod: 'year' })).toBe('year');
    expect(enteredValuePeriod({ unit: 'currency-GBP', definitionPeriod: 'year' })).toBe('year');
  });

  test('given money defined per month then it is still entered for the year', () => {
    // The builder sends one value for the tax year; core divides it across the months.
    expect(enteredValuePeriod({ unit: 'currency-USD', definitionPeriod: 'month' })).toBe('year');
  });

  test('given money defined per week or per day then it is entered for that period', () => {
    expect(enteredValuePeriod({ unit: 'currency-USD', definitionPeriod: 'week' })).toBe('week');
    expect(enteredValuePeriod({ unit: 'currency-USD', definitionPeriod: 'day' })).toBe('day');
  });

  test('given an input that is not money then no period applies', () => {
    expect(enteredValuePeriod({ unit: null, definitionPeriod: 'year' })).toBeNull();
    expect(enteredValuePeriod({ unit: '/1', definitionPeriod: 'month' })).toBeNull();
    expect(enteredValuePeriod({ unit: 'hour', definitionPeriod: 'year' })).toBeNull();
  });

  test('given money the model marks as a stock (a balance or value) then no period applies', () => {
    // Bank account assets or a home's value is an amount at one point in time, not a yearly total.
    expect(
      enteredValuePeriod({ unit: 'currency-USD', definitionPeriod: 'year', quantityType: 'stock' })
    ).toBeNull();
    expect(
      enteredValuePeriod({ unit: 'currency-GBP', definitionPeriod: 'month', quantityType: 'stock' })
    ).toBeNull();
  });

  test('given money the model marks as a flow then it is entered for the year', () => {
    expect(
      enteredValuePeriod({ unit: 'currency-USD', definitionPeriod: 'year', quantityType: 'flow' })
    ).toBe('year');
  });

  test('given money with no period, or for all time, then no period applies', () => {
    expect(enteredValuePeriod({ unit: 'currency-USD' })).toBeNull();
    expect(enteredValuePeriod({ unit: 'currency-USD', definitionPeriod: 'eternity' })).toBeNull();
  });
});

describe('enteredValuePeriodLabel', () => {
  test('given rent defined per year then it reads "Annually"', () => {
    expect(enteredValuePeriodLabel({ unit: 'currency-USD', definitionPeriod: 'year' })).toBe(
      'Annually'
    );
  });

  test('given money defined per month then it reads "Annually"', () => {
    expect(enteredValuePeriodLabel({ unit: 'currency-USD', definitionPeriod: 'month' })).toBe(
      'Annually'
    );
  });

  test('given a yes or no input then there is no label', () => {
    expect(enteredValuePeriodLabel({ unit: null, definitionPeriod: 'month' })).toBeNull();
  });
});
