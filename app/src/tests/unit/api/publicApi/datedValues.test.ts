import { describe, expect, test } from 'vitest';
import { v1DatedValues } from '@/api/publicApi/datedValues';
import {
  REAL_SHAPE_PART_PARAMETER_VALUES,
  REAL_SHAPE_PARTS_PARAMETER,
} from '@/tests/fixtures/api/publicApi/catalogVariablesRealShape';

describe('v1DatedValues', () => {
  test('given dated values as the route sends them then each is keyed by the day it starts', () => {
    // When
    const values = v1DatedValues(REAL_SHAPE_PARTS_PARAMETER, REAL_SHAPE_PART_PARAMETER_VALUES);

    // Then
    expect(Object.keys(values)).toEqual(['2010-01-01', '2018-01-01', '2021-01-01', '2026-01-01']);
    expect(values['2018-01-01']).not.toContain('domestic_production_ald');
  });

  test("given a value in force since Python's earliest date then it is dated as v1 dated it", () => {
    // When
    const values = v1DatedValues('gov.example.rate', [
      { start_date: '0001-01-01T00:00:00', end_date: null, value: 0.1 },
    ]);

    // Then
    expect(values).toEqual({ '0000-01-01': 0.1 });
  });

  test('given no dated values then there are none', () => {
    expect(v1DatedValues('gov.example.rate', [])).toEqual({});
  });

  test('given a value that is not a parameter value then it fails, naming the parameter', () => {
    // Given
    const notAValue = new Date('2025-01-01') as unknown as number;

    // Then
    expect(() =>
      v1DatedValues('gov.example.rate', [
        { start_date: '2025-01-01T00:00:00', end_date: null, value: notAValue },
      ])
    ).toThrow(/gov\.example\.rate/);
  });
});
