import { describe, expect, test } from 'vitest';
import { isNotFoundError, retryUnlessNotFound } from '@/libs/flagship/loadError';
import {
  REPORT_NOT_FOUND_ERROR,
  SIMULATION_UNAVAILABLE_ERROR,
} from '@/tests/fixtures/hooks/useFlagshipReportMocks';

describe('isNotFoundError', () => {
  test('given a 404 status then the record is not there', () => {
    expect(isNotFoundError(REPORT_NOT_FOUND_ERROR)).toBe(true);
  });

  test('given a 404 without a status text then the record is not there', () => {
    expect(isNotFoundError(new Error('Failed to fetch report 12: 404 '))).toBe(true);
  });

  test('given the API says not found then the record is not there', () => {
    expect(isNotFoundError(new Error('Report #12 not found'))).toBe(true);
  });

  test('given a server error then the request failed, not the record', () => {
    expect(isNotFoundError(SIMULATION_UNAVAILABLE_ERROR)).toBe(false);
  });

  test('given a record id that reads 404 then a server error is still a failure', () => {
    expect(
      isNotFoundError(new Error('Failed to fetch report 404: 500 Internal Server Error'))
    ).toBe(false);
  });

  test('given something that is not an error then it is not a missing record', () => {
    expect(isNotFoundError(undefined)).toBe(false);
  });
});

describe('retryUnlessNotFound', () => {
  test('given a missing record then it is not asked for again', () => {
    expect(retryUnlessNotFound(0, REPORT_NOT_FOUND_ERROR)).toBe(false);
  });

  test('given a failed request then it is asked for again a few times', () => {
    expect(retryUnlessNotFound(0, SIMULATION_UNAVAILABLE_ERROR)).toBe(true);
    expect(retryUnlessNotFound(2, SIMULATION_UNAVAILABLE_ERROR)).toBe(true);
    expect(retryUnlessNotFound(3, SIMULATION_UNAVAILABLE_ERROR)).toBe(false);
  });
});
