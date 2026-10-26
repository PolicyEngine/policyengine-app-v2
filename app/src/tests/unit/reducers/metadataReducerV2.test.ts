import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import metadataReducer, { fetchMetadataThunk, metadataRequest } from '@/reducers/metadataReducer';
import {
  TEST_POLICYENGINE_VERSION,
  TEST_TAX_BENEFIT_MODEL_ID,
} from '@/tests/fixtures/api/publicApi/modelCatalogMocks';

const mockFetchV1Metadata = vi.fn();
const mockFetchV2ModelCatalogMetadata = vi.fn();

vi.mock('@/api/metadata', () => ({
  fetchMetadata: (...args: unknown[]) => mockFetchV1Metadata(...args),
}));
vi.mock('@/api/publicApi/modelCatalog', () => ({
  fetchV2ModelCatalogMetadata: (...args: unknown[]) => mockFetchV2ModelCatalogMetadata(...args),
}));

function v2Payload() {
  return {
    status: 'ok',
    message: null,
    result: {
      variables: {},
      parameters: {},
      entities: { person: { key: 'person', plural: 'people', is_person: true } },
      variableModules: {},
      economy_options: { region: [], time_period: [], datasets: [] },
      current_law_id: 2,
      basicInputs: ['age'],
      modelled_policies: { core: {}, filtered: {} },
      version: TEST_POLICYENGINE_VERSION,
      v2Catalog: {
        policyengineVersion: TEST_POLICYENGINE_VERSION,
        taxBenefitModelId: TEST_TAX_BENEFIT_MODEL_ID,
      },
    },
  };
}

function testStore() {
  return configureStore({ reducer: { metadata: metadataReducer } });
}

describe('metadataReducer with the v2 routes', () => {
  beforeEach(() => {
    mockFetchV1Metadata.mockReset();
    mockFetchV2ModelCatalogMetadata.mockReset();
  });

  test('given a v1 request then the request is the country, as every caller passes it', () => {
    expect(metadataRequest('us', 'v1')).toBe('us');
    expect(metadataRequest('us', 'v2')).toEqual({ countryId: 'us', routes: 'v2' });
  });

  test('given a v2 request then the model catalog loads and nothing else', async () => {
    // Given
    mockFetchV2ModelCatalogMetadata.mockResolvedValue(v2Payload());
    const store = testStore();

    // When
    await store.dispatch(fetchMetadataThunk(metadataRequest('us', 'v2')));

    // Then
    expect(mockFetchV2ModelCatalogMetadata).toHaveBeenCalledWith('us');
    expect(mockFetchV1Metadata).not.toHaveBeenCalled();
    const state = store.getState().metadata;
    expect(state.routes).toBe('v2');
    expect(state.version).toBe(TEST_POLICYENGINE_VERSION);
    expect(state.basicInputs).toEqual(['age']);
    expect(state.parameters).toEqual({});
    expect(state.parameterTree).toBeNull();
    expect(state.v2Catalog).toEqual({
      policyengineVersion: TEST_POLICYENGINE_VERSION,
      taxBenefitModelId: TEST_TAX_BENEFIT_MODEL_ID,
    });
  });

  test('given a v2 request in flight then the state says which routes it comes from', () => {
    mockFetchV2ModelCatalogMetadata.mockReturnValue(new Promise(() => {}));
    const store = testStore();

    store.dispatch(fetchMetadataThunk(metadataRequest('us', 'v2')));

    expect(store.getState().metadata.loading).toBe(true);
    expect(store.getState().metadata.routes).toBe('v2');
  });

  test('given v1 metadata in flight then a v2 request for the same country still runs', async () => {
    // Given
    mockFetchV1Metadata.mockReturnValue(new Promise(() => {}));
    mockFetchV2ModelCatalogMetadata.mockResolvedValue(v2Payload());
    const store = testStore();
    store.dispatch(fetchMetadataThunk('us'));

    // When
    await store.dispatch(fetchMetadataThunk(metadataRequest('us', 'v2')));

    // Then
    expect(store.getState().metadata.routes).toBe('v2');
    expect(store.getState().metadata.version).toBe(TEST_POLICYENGINE_VERSION);
  });

  test('given a failed v2 request then the error is kept', async () => {
    mockFetchV2ModelCatalogMetadata.mockRejectedValue(new Error('The catalog is not published'));
    const store = testStore();

    await store.dispatch(fetchMetadataThunk(metadataRequest('us', 'v2')));

    expect(store.getState().metadata.error).toBe('The catalog is not published');
    expect(store.getState().metadata.loading).toBe(false);
  });
});
