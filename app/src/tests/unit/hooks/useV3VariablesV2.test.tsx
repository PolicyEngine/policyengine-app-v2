import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useV3Variables, useV3VariablesInBackground } from '@/hooks/useV3Variables';
import { catalogVariablesLoaded, clearMetadata, selectV2LoadId } from '@/reducers/metadataReducer';
import { store } from '@/store';
import {
  BENEFITS_PARAMETER_PATH,
  catalogVariablesEnvelope,
} from '@/tests/fixtures/api/publicApi/catalogVariablesMocks';
import { TEST_POLICYENGINE_VERSION } from '@/tests/fixtures/api/publicApi/modelCatalogMocks';
import {
  jsonResponse,
  requestsTo,
  stubPublicApiFetch,
} from '@/tests/fixtures/api/publicApi/publicApiFetchStub';
import {
  seedV2ModelCatalog,
  testQueryClient,
  v3Wrapper,
} from '@/tests/fixtures/hooks/v3MetadataWrapper';

/** v3 after the switch: V3_API_ROUTES is 'v2'. */
vi.mock('@/libs/flagship/v3ApiRoutes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/v3ApiRoutes')>()),
  V3_API_ROUTES: 'v2',
}));

const VARIABLES_PATH = '/v2/model-catalog/variables';

describe('useV3Variables with v3 on the v2 routes', () => {
  let fetchStub: ReturnType<typeof stubPublicApiFetch>;

  beforeEach(async () => {
    fetchStub = stubPublicApiFetch({
      [VARIABLES_PATH]: () => jsonResponse(catalogVariablesEnvelope()),
    });
    await seedV2ModelCatalog();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('given the model catalog only then the variables load once, into the store', async () => {
    // When
    const { result } = renderHook(() => useV3Variables(), { wrapper: v3Wrapper() });

    // Then
    expect(result.current).toMatchObject({ status: 'loading', waiting: true });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    const requests = requestsTo(fetchStub, VARIABLES_PATH);
    expect(requests).toHaveLength(1);
    expect(requests[0].searchParams.get('policyengine_version')).toBe(TEST_POLICYENGINE_VERSION);
    const metadata = store.getState().metadata;
    expect(metadata.variables.employment_income.label).toBe('Employment income');
    expect(metadata.v2PartParameterValues?.[BENEFITS_PARAMETER_PATH]).toEqual({
      '0000-01-01': ['snap'],
      '2026-01-01': ['snap', 'ssi'],
    });
  });

  test('given several readers then one request serves them all', async () => {
    // Given
    const queryClient = testQueryClient();

    // When
    const first = renderHook(() => useV3Variables(), { wrapper: v3Wrapper(queryClient) });
    const second = renderHook(() => useV3Variables(), { wrapper: v3Wrapper(queryClient) });

    // Then
    await waitFor(() => expect(first.result.current.status).toBe('ready'));
    await waitFor(() => expect(second.result.current.status).toBe('ready'));
    expect(requestsTo(fetchStub, VARIABLES_PATH)).toHaveLength(1);
  });

  test('given a page that rendered then the variables start loading in the background', async () => {
    // Given
    const queryClient = testQueryClient();

    // When
    renderHook(() => useV3VariablesInBackground(), { wrapper: v3Wrapper(queryClient) });

    // Then
    await waitFor(() => expect(requestsTo(fetchStub, VARIABLES_PATH)).toHaveLength(1));
    const { result } = renderHook(() => useV3Variables(), { wrapper: v3Wrapper(queryClient) });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(requestsTo(fetchStub, VARIABLES_PATH)).toHaveLength(1);
  });

  test('given the model catalog loads again then the variables are requested again', async () => {
    // Given
    const queryClient = testQueryClient();
    const first = renderHook(() => useV3Variables(), { wrapper: v3Wrapper(queryClient) });
    await waitFor(() => expect(first.result.current.status).toBe('ready'));
    first.unmount();
    await seedV2ModelCatalog();
    expect(store.getState().metadata.variables).toEqual({});

    // When
    const { result } = renderHook(() => useV3Variables(), { wrapper: v3Wrapper(queryClient) });

    // Then
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(store.getState().metadata.variables.age.label).toBe('Age');
    expect(requestsTo(fetchStub, VARIABLES_PATH)).toHaveLength(2);
  });

  test('given variables asked for under an earlier model catalog load then the store drops them', () => {
    // When
    store.dispatch(
      catalogVariablesLoaded({
        countryId: 'us',
        policyengineVersion: TEST_POLICYENGINE_VERSION,
        loadId: 'an-earlier-load',
        variables: { stale: { name: 'stale' } },
        partParameterValues: {},
      })
    );

    // Then
    expect(store.getState().metadata.variables).toEqual({});
  });

  test('given the variables route fails then the status says so and can retry', async () => {
    // Given
    vi.unstubAllGlobals();
    stubPublicApiFetch({
      [VARIABLES_PATH]: () => jsonResponse({ status: 'error', message: 'unavailable' }, 503),
    });

    // When
    const { result } = renderHook(() => useV3Variables(), { wrapper: v3Wrapper() });

    // Then
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.waiting).toBe(false);
    expect(typeof result.current.retry).toBe('function');
  });

  test('given variables for another catalog version then the store drops them', () => {
    // When
    store.dispatch(
      catalogVariablesLoaded({
        countryId: 'us',
        policyengineVersion: '0.0.1',
        loadId: selectV2LoadId(store.getState())!,
        variables: { stale: { name: 'stale' } },
        partParameterValues: {},
      })
    );

    // Then
    const metadata = store.getState().metadata;
    expect(metadata.variables).toEqual({});
    expect(metadata.v2VariablesLoadId).toBeUndefined();
  });

  test('given variables for another country then the store drops them', () => {
    // When
    store.dispatch(
      catalogVariablesLoaded({
        countryId: 'uk',
        policyengineVersion: TEST_POLICYENGINE_VERSION,
        loadId: selectV2LoadId(store.getState())!,
        variables: { stale: { name: 'stale' } },
        partParameterValues: {},
      })
    );

    // Then
    expect(store.getState().metadata.variables).toEqual({});
  });
});

describe('useV3Variables before the model catalog has loaded', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('given no catalog version yet then nothing is requested and the status waits', () => {
    // Given
    const fetchStub = stubPublicApiFetch();
    store.dispatch(clearMetadata());

    // When
    const { result } = renderHook(() => useV3Variables(), { wrapper: v3Wrapper() });

    // Then
    expect(result.current.status).toBe('loading');
    expect(requestsTo(fetchStub, VARIABLES_PATH)).toHaveLength(0);
  });
});
