import { describe, expect, test } from 'vitest';
import {
  BENEFITS_PARAMETER_PATH,
  BENEFITS_PART_VALUES,
} from '@/tests/fixtures/api/publicApi/catalogVariablesMocks';
import { getParameterNamedParts } from '@/utils/householdValues';

/** The same parameter in v1's whole parameter list, with a different list. */
const V1_PARAMETERS = { [BENEFITS_PARAMETER_PATH]: { values: { '0000-01-01': ['wic'] } } };

describe('getParameterNamedParts', () => {
  test('given the day before a change then the earlier list applies', () => {
    // When
    const parts = getParameterNamedParts(
      BENEFITS_PARAMETER_PATH,
      '2025-12-31',
      {},
      BENEFITS_PART_VALUES
    );

    // Then
    expect(parts).toEqual(['snap']);
  });

  test('given the day a change starts then the new list applies', () => {
    // When
    const parts = getParameterNamedParts(
      BENEFITS_PARAMETER_PATH,
      '2026-01-01',
      {},
      BENEFITS_PART_VALUES
    );

    // Then
    expect(parts).toEqual(['snap', 'ssi']);
  });

  test('given part values and a parameter list then the part values take precedence', () => {
    // When
    const parts = getParameterNamedParts(
      BENEFITS_PARAMETER_PATH,
      '2025-01-01',
      V1_PARAMETERS,
      BENEFITS_PART_VALUES
    );

    // Then
    expect(parts).toEqual(['snap']);
  });

  test('given no part values then the parameter list is read, as on v1', () => {
    // When
    const parts = getParameterNamedParts(BENEFITS_PARAMETER_PATH, '2025-01-01', V1_PARAMETERS);

    // Then
    expect(parts).toEqual(['wic']);
  });

  test('given a parameter with no values or no entry then nothing is listed', () => {
    // When
    const withoutValues = getParameterNamedParts(
      BENEFITS_PARAMETER_PATH,
      '2025-01-01',
      {},
      {
        [BENEFITS_PARAMETER_PATH]: {},
      }
    );
    const withoutEntry = getParameterNamedParts('gov.unknown', '2025-01-01', {});

    // Then
    expect(withoutValues).toEqual([]);
    expect(withoutEntry).toEqual([]);
  });
});
