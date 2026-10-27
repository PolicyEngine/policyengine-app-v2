import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@test-utils';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { v1ShapedVariable } from '@/api/publicApi/catalogVariables';
import { CountryProvider } from '@/contexts/CountryContext';
import { useV3Variables, useV3VariablesInBackground } from '@/hooks/useV3Variables';
import { catalogVariablesLoaded, clearMetadata, selectV2LoadId } from '@/reducers/metadataReducer';
import { store } from '@/store';
import {
  AGE_VARIABLE,
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

/** Variables a dropped response would have brought. */
const STALE_VARIABLES = { stale: v1ShapedVariable({ ...AGE_VARIABLE, name: 'stale' }) };

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
    expect(result.current.state).toBe('waiting');
    await waitFor(() => expect(result.current.state).toBe('ready'));
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
    await waitFor(() => expect(first.result.current.state).toBe('ready'));
    await waitFor(() => expect(second.result.current.state).toBe('ready'));
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
    await waitFor(() => expect(result.current.state).toBe('ready'));
    expect(requestsTo(fetchStub, VARIABLES_PATH)).toHaveLength(1);
  });

  test('given only the background load then the store fills, for readers without the hook', async () => {
    // When
    renderHook(() => useV3VariablesInBackground(), { wrapper: v3Wrapper(testQueryClient()) });

    // Then
    await waitFor(() =>
      expect(store.getState().metadata.variables.employment_income?.label).toBe('Employment income')
    );
    expect(requestsTo(fetchStub, VARIABLES_PATH)).toHaveLength(1);
  });

  test('given the page has moved to another country before its model catalog loads then nothing is requested', async () => {
    // Given
    const queryClient = testQueryClient();
    const ukWrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <CountryProvider value="uk">{children}</CountryProvider>
        </QueryClientProvider>
      </Provider>
    );

    // When
    renderHook(() => useV3VariablesInBackground(), { wrapper: ukWrapper });
    const reader = renderHook(() => useV3Variables(), { wrapper: ukWrapper });

    // Then
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(requestsTo(fetchStub, VARIABLES_PATH)).toHaveLength(0);
    expect(reader.result.current.state).toBe('waiting');
  });

  test('given the model catalog loads again then the variables are requested again', async () => {
    // Given
    const queryClient = testQueryClient();
    const first = renderHook(() => useV3Variables(), { wrapper: v3Wrapper(queryClient) });
    await waitFor(() => expect(first.result.current.state).toBe('ready'));
    first.unmount();
    await seedV2ModelCatalog();
    expect(store.getState().metadata.variables).toEqual({});

    // When
    const { result } = renderHook(() => useV3Variables(), { wrapper: v3Wrapper(queryClient) });

    // Then
    await waitFor(() => expect(result.current.state).toBe('ready'));
    expect(store.getState().metadata.variables.age.label).toBe('Age');
    expect(requestsTo(fetchStub, VARIABLES_PATH)).toHaveLength(2);
  });

  test('given a new model catalog load then only its variables stay cached', async () => {
    // Given
    const queryClient = testQueryClient();
    const first = renderHook(() => useV3VariablesInBackground(), {
      wrapper: v3Wrapper(queryClient),
    });
    await waitFor(() => expect(store.getState().metadata.v2VariablesLoadId).toBeDefined());
    first.unmount();
    await seedV2ModelCatalog();
    const currentLoad = selectV2LoadId(store.getState());

    // When
    renderHook(() => useV3VariablesInBackground(), { wrapper: v3Wrapper(queryClient) });

    // Then
    await waitFor(() => expect(store.getState().metadata.v2VariablesLoadId).toBe(currentLoad));
    const cached = queryClient.getQueryCache().findAll({ queryKey: ['v2-catalog-variables'] });
    expect(cached.map((query) => query.queryKey[3])).toEqual([currentLoad]);
  });

  test('given variables asked for under an earlier model catalog load then the store drops them', () => {
    // When
    store.dispatch(
      catalogVariablesLoaded({
        countryId: 'us',
        policyengineVersion: TEST_POLICYENGINE_VERSION,
        loadId: 'an-earlier-load',
        variables: STALE_VARIABLES,
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
    await waitFor(() => expect(result.current.state).toBe('failed'));
    expect(typeof result.current.retry).toBe('function');
  });

  test('given variables for another catalog version then the store drops them', () => {
    // When
    store.dispatch(
      catalogVariablesLoaded({
        countryId: 'us',
        policyengineVersion: '0.0.1',
        loadId: selectV2LoadId(store.getState())!,
        variables: STALE_VARIABLES,
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
        variables: STALE_VARIABLES,
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
    expect(result.current.state).toBe('waiting');
    expect(requestsTo(fetchStub, VARIABLES_PATH)).toHaveLength(0);
  });
});
