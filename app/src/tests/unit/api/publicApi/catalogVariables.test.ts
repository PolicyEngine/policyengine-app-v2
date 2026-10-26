import { describe, expect, test, vi } from 'vitest';
import { fetchCatalogVariables } from '@/api/publicApi/catalogVariables';
import { createPublicApiClient } from '@/api/publicApi/client';
import {
  ABSENT_PARTS_PARAMETER_PATH,
  BENEFITS_PARAMETER_PATH,
  catalogVariablesEnvelope,
} from '@/tests/fixtures/api/publicApi/catalogVariablesMocks';
import { TEST_POLICYENGINE_VERSION } from '@/tests/fixtures/api/publicApi/modelCatalogMocks';
import { jsonResponse } from '@/tests/fixtures/api/publicApi/publicApiFetchStub';
import { TEST_API_BASE } from '@/tests/fixtures/api/v2UserMocks';

function variablesClient() {
  const fetchMock = vi.fn(async () => jsonResponse(catalogVariablesEnvelope()));
  const client = createPublicApiClient({
    baseUrl: TEST_API_BASE,
    fetchImpl: fetchMock as unknown as typeof fetch,
  });
  return { client, fetchMock };
}

describe('fetchCatalogVariables', () => {
  test('given a catalog version then one request asks for all its variables', async () => {
    // Given
    const { client, fetchMock } = variablesClient();

    // When
    await fetchCatalogVariables('us', TEST_POLICYENGINE_VERSION, client);

    // Then
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = new URL((fetchMock.mock.calls[0] as unknown as [Request])[0].url);
    expect(url.pathname).toBe('/v2/model-catalog/variables');
    expect(url.searchParams.get('country_id')).toBe('us');
    expect(url.searchParams.get('policyengine_version')).toBe(TEST_POLICYENGINE_VERSION);
  });

  test('given catalog variables then each reads as v1 metadata described it', async () => {
    // Given
    const { client } = variablesClient();

    // When
    const { variables } = await fetchCatalogVariables('us', TEST_POLICYENGINE_VERSION, client);

    // Then
    expect(variables.employment_income).toEqual({
      name: 'employment_income',
      label: 'Employment income',
      entity: 'person',
      documentation: 'Wages and salaries',
      valueType: 'float',
      unit: 'currency-USD',
      definitionPeriod: 'year',
      defaultValue: 0,
      adds: null,
      subtracts: null,
      isInputVariable: true,
      hidden_input: false,
      moduleName: 'household.income.person.employment_income',
    });
    expect(variables.medicaid_rating_area).toMatchObject({
      isInputVariable: true,
      hidden_input: true,
    });
  });

  test('given units and periods then each reads as v1 gave them', async () => {
    // Given
    const { client } = variablesClient();

    // When
    const { variables } = await fetchCatalogVariables('us', TEST_POLICYENGINE_VERSION, client);

    // Then
    expect(variables.rent).toMatchObject({ unit: 'currency-USD', definitionPeriod: 'month' });
    expect(variables.marginal_tax_rate).toMatchObject({ unit: '/1', definitionPeriod: 'year' });
    expect(variables.age).toMatchObject({ unit: null, definitionPeriod: 'year' });
  });

  test('given a version published before catalog format 2 then the unit and period are null', async () => {
    // Given
    const { client } = variablesClient();

    // When
    const { variables } = await fetchCatalogVariables('us', TEST_POLICYENGINE_VERSION, client);

    // Then
    expect(variables.undescribed_income).toMatchObject({ unit: null, definitionPeriod: null });
  });

  test('given an enum variable then its values keep their labels and declared types', async () => {
    // Given
    const { client } = variablesClient();

    // When
    const { variables } = await fetchCatalogVariables('us', TEST_POLICYENGINE_VERSION, client);

    // Then
    expect(variables.filing_status.valueType).toBe('Enum');
    expect(variables.filing_status.defaultValue).toBe('SINGLE');
    expect(variables.filing_status.possibleValues).toEqual([
      { value: 'SINGLE', label: 'Single' },
      { value: 'JOINT', label: 2 },
    ]);
  });

  test('given parts named by a parameter then the path stands in for the list, as on v1', async () => {
    // Given
    const { client } = variablesClient();

    // When
    const { variables } = await fetchCatalogVariables('us', TEST_POLICYENGINE_VERSION, client);

    // Then
    expect(variables.household_benefits.adds).toBe(BENEFITS_PARAMETER_PATH);
    expect(variables.countable_income.adds).toEqual(['employment_income']);
    expect(variables.countable_income.subtracts).toBe(ABSENT_PARTS_PARAMETER_PATH);
  });

  test('given part parameter values then they are dated as v1 dated parameter values', async () => {
    // Given
    const { client } = variablesClient();

    // When
    const { partParameterValues } = await fetchCatalogVariables(
      'us',
      TEST_POLICYENGINE_VERSION,
      client
    );

    // Then
    expect(partParameterValues[BENEFITS_PARAMETER_PATH]).toEqual({
      '0000-01-01': ['snap'],
      '2026-01-01': ['snap', 'ssi'],
    });
    expect(partParameterValues[ABSENT_PARTS_PARAMETER_PATH]).toEqual({});
  });

  test('given a variable without a label then it reads as its name', async () => {
    // Given
    const fetchMock = vi.fn(async () =>
      jsonResponse(
        catalogVariablesEnvelope({
          policyengine_version: TEST_POLICYENGINE_VERSION,
          catalog_format: 2,
          variables: [
            {
              id: 'variable-unlabelled',
              name: 'unlabelled_variable',
              label: null,
              entity: 'person',
              description: null,
              data_type: 'float',
              possible_values: null,
              default_value: 0,
              adds: null,
              subtracts: null,
            },
          ],
          part_parameter_values: {},
        })
      )
    );
    const client = createPublicApiClient({
      baseUrl: TEST_API_BASE,
      fetchImpl: fetchMock as unknown as typeof fetch,
    });

    // When
    const { variables } = await fetchCatalogVariables('us', TEST_POLICYENGINE_VERSION, client);

    // Then
    expect(variables.unlabelled_variable).toMatchObject({
      label: 'unlabelled_variable',
      isInputVariable: false,
      hidden_input: false,
      moduleName: null,
    });
  });
});
