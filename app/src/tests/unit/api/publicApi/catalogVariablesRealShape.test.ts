import { describe, expect, test, vi } from 'vitest';
import { fetchCatalogVariables, v1ShapedVariable } from '@/api/publicApi/catalogVariables';
import { createPublicApiClient } from '@/api/publicApi/client';
import { inputKind } from '@/components/household/VariablePickerDialog';
import {
  PRE_FORMAT_2_VARIABLES_RESULT,
  REAL_SHAPE_US_VARIABLES,
} from '@/tests/fixtures/api/publicApi/catalogVariablesRealShape';
import { jsonResponse } from '@/tests/fixtures/api/publicApi/publicApiFetchStub';
import { TEST_API_BASE } from '@/tests/fixtures/api/v2UserMocks';
import { getNormalizedVariableMetadata } from '@/utils/variableMetadata';

function realVariable(name: string) {
  const variable = REAL_SHAPE_US_VARIABLES.find((candidate) => candidate.name === name);
  if (!variable) {
    throw new Error(`No real-shape fixture for ${name}`);
  }
  return variable;
}

describe('v1ShapedVariable on records as the catalog publishes them', () => {
  test.each(['state_name', 'filing_status'])(
    'given the enum variable %s published with data type "str" then it reads as v1\'s Enum',
    (name) => {
      // When
      const shaped = v1ShapedVariable(realVariable(name));

      // Then
      expect(shaped.valueType).toBe('Enum');
      expect(shaped.possibleValues?.length).toBeGreaterThan(0);
      expect(getNormalizedVariableMetadata(shaped).valueType).toBe('Enum');
    }
  );

  test('given an enum input then the picker offers it as a choice from a list', () => {
    // When
    const stateName = getNormalizedVariableMetadata(v1ShapedVariable(realVariable('state_name')));

    // Then
    expect(inputKind(stateName as Parameters<typeof inputKind>[0])).toBe('One of a list');
  });

  test('given an enum variable then its default is the default value name, as on v1', () => {
    expect(v1ShapedVariable(realVariable('state_name')).defaultValue).toBe('CA');
  });

  test.each([
    ['age', 'float', 40],
    ['employment_income', 'float', 0],
    ['is_disabled', 'bool', false],
  ])('given %s then its value type and default read as v1 gave them', (name, type, value) => {
    const shaped = v1ShapedVariable(realVariable(name));

    expect(shaped.valueType).toBe(type);
    expect(shaped.defaultValue).toBe(value);
  });

  test('given a text or date variable then it has no default, as v1 gave none', () => {
    // Given
    const textVariable = { ...realVariable('age'), data_type: 'str', default_value: 'none' };
    const dateVariable = { ...realVariable('age'), data_type: 'date', default_value: '2000-01-01' };

    // Then
    expect(v1ShapedVariable(textVariable).defaultValue).toBeNull();
    expect(v1ShapedVariable(dateVariable).defaultValue).toBeNull();
  });

  test('given a catalog version published before catalog format 2 then loading its variables fails clearly', async () => {
    // Given
    const fetchMock = vi.fn(async () =>
      jsonResponse({ status: 'ok', message: null, result: PRE_FORMAT_2_VARIABLES_RESULT })
    );
    const client = createPublicApiClient({
      baseUrl: TEST_API_BASE,
      fetchImpl: fetchMock as unknown as typeof fetch,
    });

    // When
    const loading = fetchCatalogVariables('us', '6.7.5', client);

    // Then
    await expect(loading).rejects.toThrow(/published before catalog format 2/);
  });
});
