import { describe, expect, test } from 'vitest';
import {
  convertDateRangeMapToValueIntervals,
  convertJsonToReportOutput,
  convertParametersToPolicyJson,
} from '@/adapters/conversionHelpers';

const TEST_DATE_RANGE = '2024-01-01.2024-12-31';
const TEST_START_DATE = '2024-01-01';
const TEST_END_DATE = '2024-12-31';

describe('convertDateRangeMapToValueIntervals', () => {
  test('given valid date range map then returns value intervals', () => {
    const input = { [TEST_DATE_RANGE]: 1000 };
    const result = convertDateRangeMapToValueIntervals(input);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      startDate: TEST_START_DATE,
      endDate: TEST_END_DATE,
      value: 1000,
    });
  });

  test('given multiple date ranges then returns all intervals', () => {
    const input = {
      '2024-01-01.2024-06-30': 500,
      '2024-07-01.2024-12-31': 1000,
    };
    const result = convertDateRangeMapToValueIntervals(input);
    expect(result).toHaveLength(2);
  });

  test('given invalid date range format then throws', () => {
    const input = { 'invalid-format': 1000 };
    expect(() => convertDateRangeMapToValueIntervals(input)).toThrow('Invalid date range format');
  });

  test('given empty string date range then throws', () => {
    const input = { '.': 1000 };
    // split('.') on '.' returns ['', '']
    // empty strings are falsy, so should throw
    expect(() => convertDateRangeMapToValueIntervals(input)).toThrow('Invalid date range format');
  });

  test('given empty map then returns empty array', () => {
    const result = convertDateRangeMapToValueIntervals({});
    expect(result).toEqual([]);
  });
});

describe('convertParametersToPolicyJson', () => {
  test('given single parameter with one value then converts to policy JSON', () => {
    const input = [
      {
        name: 'param1',
        values: [{ startDate: TEST_START_DATE, endDate: TEST_END_DATE, value: 1000 }],
      },
    ];
    const result = convertParametersToPolicyJson(input as any);
    expect(result).toEqual({
      param1: { [TEST_DATE_RANGE]: 1000 },
    });
  });

  test('given parameter with multiple values then merges all', () => {
    const input = [
      {
        name: 'param1',
        values: [
          { startDate: '2024-01-01', endDate: '2024-06-30', value: 500 },
          { startDate: '2024-07-01', endDate: '2024-12-31', value: 1000 },
        ],
      },
    ];
    const result = convertParametersToPolicyJson(input as any);
    expect(result.param1).toEqual({
      '2024-01-01.2024-06-30': 500,
      '2024-07-01.2024-12-31': 1000,
    });
  });

  test('given multiple parameters then converts each', () => {
    const input = [
      {
        name: 'param1',
        values: [{ startDate: TEST_START_DATE, endDate: TEST_END_DATE, value: 100 }],
      },
      {
        name: 'param2',
        values: [{ startDate: TEST_START_DATE, endDate: TEST_END_DATE, value: 200 }],
      },
    ];
    const result = convertParametersToPolicyJson(input as any);
    expect(Object.keys(result)).toHaveLength(2);
    expect(result.param1).toEqual({ [TEST_DATE_RANGE]: 100 });
    expect(result.param2).toEqual({ [TEST_DATE_RANGE]: 200 });
  });

  test('given empty array then returns empty object', () => {
    const result = convertParametersToPolicyJson([]);
    expect(result).toEqual({});
  });
});

describe('convertJsonToReportOutput', () => {
  test('given null then returns null', () => {
    const result = convertJsonToReportOutput(null);
    expect(result).toBeNull();
  });

  test('given valid JSON string then parses to object', () => {
    const data = { budget: { revenue: 1000 } };
    const result = convertJsonToReportOutput(JSON.stringify(data));
    expect(result).toEqual(data);
  });

  test('given invalid JSON then throws', () => {
    expect(() => convertJsonToReportOutput('not-json')).toThrow();
  });
});
