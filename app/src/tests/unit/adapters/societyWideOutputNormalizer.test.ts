import { describe, expect, test } from 'vitest';
import { transformConstituencyAbsoluteChange } from '@/adapters/constituency/constituencyDataAdapter';
import { normalizeSocietyWideOutput } from '@/adapters/societyWideOutputNormalizer';
import {
  EXPECTED_BY_CONSTITUENCY,
  EXPECTED_BY_LOCAL_AUTHORITY,
  KEYED_SHAPE_UK_RESULT,
  LIST_SHAPE_CONSTITUENCY_IMPACT,
  LIST_SHAPE_UK_RESULT,
  UK_RESULT_OTHER_FIELDS,
} from '@/tests/fixtures/adapters/societyWideOutputNormalizerMocks';

describe('normalizeSocietyWideOutput', () => {
  test('given list-shape constituency impacts then keys them by constituency name', () => {
    // When
    const result = normalizeSocietyWideOutput(LIST_SHAPE_UK_RESULT) as any;

    // Then
    expect(result.constituency_impact).toEqual({ by_constituency: EXPECTED_BY_CONSTITUENCY });
  });

  test('given list-shape local authority impacts then keys them by local authority name', () => {
    // When
    const result = normalizeSocietyWideOutput(LIST_SHAPE_UK_RESULT) as any;

    // Then
    expect(result.local_authority_impact).toEqual({
      by_local_authority: EXPECTED_BY_LOCAL_AUTHORITY,
    });
  });

  test('given a list-shape result then keeps its other fields', () => {
    // When
    const result = normalizeSocietyWideOutput(LIST_SHAPE_UK_RESULT) as any;

    // Then
    expect(result.budget).toEqual(UK_RESULT_OTHER_FIELDS.budget);
    expect(result.model_version).toBe(UK_RESULT_OTHER_FIELDS.model_version);
  });

  test('given a normalized result then the map adapter reads every area', () => {
    // When
    const result = normalizeSocietyWideOutput(LIST_SHAPE_UK_RESULT) as any;
    const points = transformConstituencyAbsoluteChange(result.constituency_impact.by_constituency);

    // Then
    expect(points).toHaveLength(LIST_SHAPE_CONSTITUENCY_IMPACT.length);
    expect(points[0]).toEqual({
      id: 'Aldershot',
      label: 'Aldershot',
      value: 571.146162,
      x: 56,
      y: -40,
    });
  });

  test('given the keyed shape then returns the same result unchanged', () => {
    // When
    const result = normalizeSocietyWideOutput(KEYED_SHAPE_UK_RESULT);

    // Then
    expect(result).toBe(KEYED_SHAPE_UK_RESULT);
  });

  test('given only constituencies in the list shape then leaves local authorities as they are', () => {
    // Given
    const output = {
      constituency_impact: LIST_SHAPE_CONSTITUENCY_IMPACT,
      local_authority_impact: null,
    };

    // When
    const result = normalizeSocietyWideOutput(output) as any;

    // Then
    expect(result.constituency_impact.by_constituency).toEqual(EXPECTED_BY_CONSTITUENCY);
    expect(result.local_authority_impact).toBeNull();
  });

  test('given a row without a name then keys it by its code', () => {
    // Given
    const { constituency_name: _name, ...row } = LIST_SHAPE_CONSTITUENCY_IMPACT[0];

    // When
    const result = normalizeSocietyWideOutput({ constituency_impact: [row] }) as any;

    // Then
    expect(Object.keys(result.constituency_impact.by_constituency)).toEqual(['E14001063']);
  });

  test('given an empty list then returns no areas', () => {
    // When
    const result = normalizeSocietyWideOutput({ constituency_impact: [] }) as any;

    // Then
    expect(result.constituency_impact).toEqual({ by_constituency: {} });
  });

  test('given null, a US result, or a household output then returns it unchanged', () => {
    // Given
    const usResult = { constituency_impact: null, budget: {} };
    const householdOutput = { people: {} };

    // Then
    expect(normalizeSocietyWideOutput(null)).toBeNull();
    expect(normalizeSocietyWideOutput(usResult)).toBe(usResult);
    expect(normalizeSocietyWideOutput(householdOutput)).toBe(householdOutput);
  });
});
