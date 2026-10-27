import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@test-utils';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { CountryProvider } from '@/contexts/CountryContext';
import { useV3Variables, useV3VariablesInBackground } from '@/hooks/useV3Variables';
import { clearMetadata, selectV2LoadId } from '@/reducers/metadataReducer';
import { store } from '@/store';
import {
  BENEFITS_PARAMETER_PATH,
  catalogVariablesEnvelope,
  VARIABLES_PATH,
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
    expect(result.current.status).toBe('loading');
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
    // Both hooks have run their effects; nothing is fetching, and nothing was asked for.
    await waitFor(() => expect(queryClient.isFetching()).toBe(0));
    expect(requestsTo(fetchStub, VARIABLES_PATH)).toHaveLength(0);
    expect(reader.result.current.status).toBe('loading');
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

  test('given the current load cached then its entry outlives the old five-minute lifetime', async () => {
    // Given
    const queryClient = testQueryClient();
    renderHook(() => useV3VariablesInBackground(), { wrapper: v3Wrapper(queryClient) });

    // When
    await waitFor(() => expect(store.getState().metadata.v2VariablesLoadId).toBeDefined());

    // Then
    const [cached] = queryClient.getQueryCache().findAll({ queryKey: ['v2-catalog-variables'] });
    expect(cached.gcTime).toBe(Infinity);
  });

  test("given the store already holds this load's variables then a later page asks for nothing, even without the cached entry", async () => {
    // Given
    const queryClient = testQueryClient();
    const first = renderHook(() => useV3VariablesInBackground(), {
      wrapper: v3Wrapper(queryClient),
    });
    await waitFor(() => expect(store.getState().metadata.v2VariablesLoadId).toBeDefined());
    first.unmount();
    queryClient.removeQueries({ queryKey: ['v2-catalog-variables'] });

    // When
    renderHook(() => useV3VariablesInBackground(), { wrapper: v3Wrapper(queryClient) });
    const reader = renderHook(() => useV3Variables(), { wrapper: v3Wrapper(queryClient) });

    // Then
    expect(reader.result.current.status).toBe('ready');
    await waitFor(() => expect(queryClient.isFetching()).toBe(0));
    expect(requestsTo(fetchStub, VARIABLES_PATH)).toHaveLength(1);
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
    expect(typeof result.current.retry).toBe('function');
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
