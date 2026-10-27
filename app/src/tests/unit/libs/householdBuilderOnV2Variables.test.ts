import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchCatalogVariables } from '@/api/publicApi/catalogVariables';
import { createPublicApiClient } from '@/api/publicApi/client';
import { inputKind } from '@/components/household/VariablePickerDialog';
import { getBasicInputFields } from '@/libs/metadataUtils';
import { catalogVariablesLoaded, clearMetadata, selectV2LoadId } from '@/reducers/metadataReducer';
import { store } from '@/store';
import { catalogVariablesEnvelope } from '@/tests/fixtures/api/publicApi/catalogVariablesMocks';
import { TEST_POLICYENGINE_VERSION } from '@/tests/fixtures/api/publicApi/modelCatalogMocks';
import {
  jsonResponse,
  stubPublicApiFetch,
} from '@/tests/fixtures/api/publicApi/publicApiFetchStub';
import { TEST_API_BASE } from '@/tests/fixtures/api/v2UserMocks';
import { seedV2ModelCatalog } from '@/tests/fixtures/hooks/v3MetadataWrapper';
import { formatVariableValue } from '@/utils/householdValues';
import { getInputVariables } from '@/utils/VariableResolver';

/**
 * The household builder reads its default fields (`basic_inputs`) and
 * entities from `/v2/model-catalog`, and its variable picker reads the
 * variables `/v2/model-catalog/variables` loads, both through the metadata
 * store, as it read v1's whole metadata.
 */
describe('The household builder on the v2 routes', () => {
  beforeEach(async () => {
    stubPublicApiFetch();
    await seedV2ModelCatalog();
    const fetchMock = vi.fn(async () => jsonResponse(catalogVariablesEnvelope()));
    const loaded = await fetchCatalogVariables(
      'us',
      TEST_POLICYENGINE_VERSION,
      createPublicApiClient({
        baseUrl: TEST_API_BASE,
        fetchImpl: fetchMock as unknown as typeof fetch,
      })
    );
    store.dispatch(
      catalogVariablesLoaded({
        countryId: 'us',
        policyengineVersion: TEST_POLICYENGINE_VERSION,
        loadId: selectV2LoadId(store.getState())!,
        ...loaded,
      })
    );
  });

  afterEach(() => {
    store.dispatch(clearMetadata());
    vi.unstubAllGlobals();
  });

  test('given the model catalog and its variables then the default fields sit under their entities', () => {
    // When
    const fields = getBasicInputFields(store.getState());

    // Then
    expect(fields.person).toEqual(['age', 'employment_income']);
    expect(fields.household).toEqual([]);
  });

  test('given v2 variables then the picker offers entered variables and hides hidden inputs', () => {
    // When
    const names = getInputVariables(store.getState().metadata).map((variable) => variable.name);

    // Then
    expect(names).toEqual(expect.arrayContaining(['age', 'employment_income', 'filing_status']));
    expect(names).not.toContain('medicaid_rating_area');
    expect(names).not.toContain('snap');
  });

  test('given an enum variable then the picker reads its value labels', () => {
    // When
    const filingStatus = getInputVariables(store.getState().metadata).find(
      (variable) => variable.name === 'filing_status'
    );

    // Then
    expect(filingStatus?.possibleValues).toEqual([
      { value: 'SINGLE', label: 'Single' },
      { value: 'JOINT', label: 2 },
    ]);
  });

  test('given units and periods then the picker describes each input as on v1', () => {
    // Given
    const inputs = new Map(
      getInputVariables(store.getState().metadata).map((variable) => [variable.name, variable])
    );

    // Then
    expect(inputKind(inputs.get('employment_income')!)).toBe('Dollars per year');
    expect(inputKind(inputs.get('rent')!)).toBe('Dollars per month');
    expect(inputKind(inputs.get('age')!)).toBe('Number');
  });

  test('given no unit or period then the picker describes the input as v1 does a variable without them', () => {
    // Given
    const undescribed = getInputVariables(store.getState().metadata).find(
      (variable) => variable.name === 'undescribed_income'
    );

    // Then
    expect(inputKind(undescribed!)).toBe('Number');
  });

  test('given units then the breakdown formats currencies and rates as on v1', () => {
    // Given
    const { variables } = store.getState().metadata;

    // Then
    expect(formatVariableValue(variables.employment_income, 30000)).toBe('$30,000');
    expect(formatVariableValue(variables.marginal_tax_rate, 0.25)).toBe('25%');
    expect(formatVariableValue(variables.undescribed_income, 1200)).toBe('1,200');
  });
});
