import { describe, expect, test } from 'vitest';
import {
  clampBudgetWindowYears,
  formatBudgetWindowYear,
  getBudgetWindowOptions,
  getDefaultBudgetWindowYears,
  getReportTimingDisplay,
  parseReportTiming,
  serializeReportTiming,
} from '@/utils/reportTiming';

describe('reportTiming', () => {
  test('formats a budget-window year range from a start year and window size', () => {
    expect(formatBudgetWindowYear('2026', 10)).toBe('2026-2035');
  });

  test('parses a single-year report timing', () => {
    expect(parseReportTiming('2028', 'us')).toEqual({
      analysisMode: 'single-year',
      startYear: '2028',
      endYear: '2028',
      windowSize: 1,
    });
  });

  test('parses a budget-window report timing', () => {
    expect(parseReportTiming('2026-2035', 'us')).toEqual({
      analysisMode: 'budget-window',
      startYear: '2026',
      endYear: '2035',
      windowSize: 10,
    });
  });

  test('serializes a budget-window timing', () => {
    expect(
      serializeReportTiming({
        analysisMode: 'budget-window',
        startYear: '2026',
        budgetWindowYears: '10',
      })
    ).toBe('2026-2035');
  });

  test('builds window options from available metadata years', () => {
    expect(
      getBudgetWindowOptions(
        '2029',
        [{ value: '2029' }, { value: '2030' }, { value: '2031' }, { value: '2032' }],
        'us'
      )
    ).toEqual(['2', '3', '4']);
  });

  test('clamps window size to an allowed option', () => {
    expect(clampBudgetWindowYears('10', ['2', '3', '4'], 'us')).toBe('4');
  });

  test('returns sensible defaults and timing labels', () => {
    expect(getDefaultBudgetWindowYears('uk')).toBe(5);
    expect(getReportTimingDisplay('2026-2035')).toEqual({
      label: 'Budget window',
      value: '2026-2035',
    });
  });
});
