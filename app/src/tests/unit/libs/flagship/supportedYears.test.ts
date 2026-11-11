import { describe, expect, test } from 'vitest';
import { windowSizeChoices, windowSizeWithin } from '@/libs/flagship/supportedYears';
import {
  UK_LAST_SUPPORTED_YEAR,
  UK_REPORT_START_YEAR,
} from '@/tests/fixtures/libs/flagship/calculationErrorMocks';
import {
  OFFERED_WINDOW_SIZES,
  REPORT_START_YEAR,
  US_LAST_SUPPORTED_YEAR,
} from '@/tests/fixtures/libs/flagship/supportedYearsMocks';

describe('windowSizeWithin', () => {
  test('given a window past the last supported year then it ends on that year', () => {
    expect(windowSizeWithin(10, UK_REPORT_START_YEAR, UK_LAST_SUPPORTED_YEAR)).toBe(7);
  });

  test('given a window that ends by the last supported year then it keeps its length', () => {
    expect(windowSizeWithin(10, REPORT_START_YEAR, US_LAST_SUPPORTED_YEAR)).toBe(10);
  });

  test('given no last year known yet then the window keeps its length', () => {
    expect(windowSizeWithin(10, UK_REPORT_START_YEAR, null)).toBe(10);
  });

  test('given a start after the last supported year then the start year alone is kept', () => {
    expect(windowSizeWithin(5, UK_LAST_SUPPORTED_YEAR + 1, UK_LAST_SUPPORTED_YEAR)).toBe(1);
  });
});

describe('windowSizeChoices', () => {
  test('given the UK model to 2032 then a window from 2026 runs at most seven years', () => {
    expect(
      windowSizeChoices(OFFERED_WINDOW_SIZES, UK_REPORT_START_YEAR, UK_LAST_SUPPORTED_YEAR)
    ).toEqual([1, 3, 5, 7]);
  });

  test('given the US model to 2035 then every window from 2026 is offered as it is', () => {
    expect(
      windowSizeChoices(OFFERED_WINDOW_SIZES, REPORT_START_YEAR, US_LAST_SUPPORTED_YEAR)
    ).toEqual(OFFERED_WINDOW_SIZES);
  });

  test('given windows that end on the same year then each length is offered once', () => {
    const yearBeforeLast = UK_LAST_SUPPORTED_YEAR - 1;

    expect(windowSizeChoices(OFFERED_WINDOW_SIZES, yearBeforeLast, UK_LAST_SUPPORTED_YEAR)).toEqual(
      [1, 2]
    );
  });

  test('given no last year known yet then every window is offered', () => {
    expect(windowSizeChoices(OFFERED_WINDOW_SIZES, UK_REPORT_START_YEAR, null)).toEqual(
      OFFERED_WINDOW_SIZES
    );
  });
});
