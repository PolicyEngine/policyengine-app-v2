import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useEnsureV3Parameters, useLoadV3Parameters } from '@/hooks/useV3Parameters';
import { clearMetadata, fetchMetadataThunk, metadataRequest } from '@/reducers/metadataReducer';
import { store } from '@/store';
import {
  catalogParametersResult,
  STANDARD_DEDUCTION_SINGLE_ID,
  UNKNOWN_PARAMETER,
} from '@/tests/fixtures/api/publicApi/catalogParametersMocks';
import {
  jsonResponse,
  requestsTo,
  stubPublicApiFetch,
} from '@/tests/fixtures/api/publicApi/publicApiFetchStub';
import {
  STANDARD_DEDUCTION_JOINT,
  STANDARD_DEDUCTION_SINGLE,
} from '@/tests/fixtures/api/publicApi/searchFileMocks';
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

const PARAMETERS_PATH = '/v2/model-catalog/parameters';

function answerCatalogParameters(url: URL) {
  return jsonResponse({
    status: 'ok',
    message: null,
    result: catalogParametersResult(url.searchParams.getAll('name')),
  });
}

describe('useEnsureV3Parameters with v3 on the v2 routes', () => {
  let fetchStub: ReturnType<typeof stubPublicApiFetch>;

  beforeEach(async () => {
    fetchStub = stubPublicApiFetch({ [PARAMETERS_PATH]: answerCatalogParameters });
    await seedV2ModelCatalog();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('given parameters not yet loaded then they load in one request, values and all', async () => {
    // When
    const { result } = renderHook(
      () => useEnsureV3Parameters([STANDARD_DEDUCTION_SINGLE, STANDARD_DEDUCTION_JOINT]),
      { wrapper: v3Wrapper() }
    );

    // Then
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(requestsTo(fetchStub, PARAMETERS_PATH)).toHaveLength(1);
    const { parameters, v2ParameterIds } = store.getState().metadata;
    expect(parameters[STANDARD_DEDUCTION_SINGLE].values).toEqual({
      '0000-01-01': 12000,
      '2025-01-01': 15000,
    });
    expect(parameters['gov.irs.deductions.standard'].label).toBe('Standard deduction');
    expect(v2ParameterIds?.[STANDARD_DEDUCTION_SINGLE]).toBe(STANDARD_DEDUCTION_SINGLE_ID);
  });

  test('given parameters already loaded then nothing is asked for again', async () => {
    // Given
    const first = renderHook(() => useEnsureV3Parameters([STANDARD_DEDUCTION_SINGLE]), {
      wrapper: v3Wrapper(),
    });
    await waitFor(() => expect(first.result.current.status).toBe('ready'));

    // When
    const { result } = renderHook(() => useEnsureV3Parameters([STANDARD_DEDUCTION_SINGLE]), {
      wrapper: v3Wrapper(),
    });

    // Then
    expect(result.current.status).toBe('ready');
    expect(requestsTo(fetchStub, PARAMETERS_PATH)).toHaveLength(1);
  });

  test('given a name the catalog version does not have then it counts as loaded, once', async () => {
    const { result, rerender } = renderHook(() => useEnsureV3Parameters([UNKNOWN_PARAMETER]), {
      wrapper: v3Wrapper(),
    });

    await waitFor(() => expect(result.current.status).toBe('ready'));
    rerender();
    expect(store.getState().metadata.v2MissingParameterNames).toContain(UNKNOWN_PARAMETER);
    expect(requestsTo(fetchStub, PARAMETERS_PATH)).toHaveLength(1);
  });

  test('given no names then it is ready at once', () => {
    const { result } = renderHook(() => useEnsureV3Parameters([]), { wrapper: v3Wrapper() });

    expect(result.current.status).toBe('ready');
    expect(requestsTo(fetchStub, PARAMETERS_PATH)).toHaveLength(0);
  });

  test('given a failed request then the status says so and retry asks again', async () => {
    // Given
    let attempts = 0;
    fetchStub = stubPublicApiFetch({
      [PARAMETERS_PATH]: (url) => {
        attempts += 1;
        return attempts === 1
          ? jsonResponse({ status: 'error', message: 'Unavailable' }, 503)
          : answerCatalogParameters(url);
      },
    });
    const { result } = renderHook(() => useEnsureV3Parameters([STANDARD_DEDUCTION_SINGLE]), {
      wrapper: v3Wrapper(),
    });
    await waitFor(() => expect(result.current.status).toBe('error'));

    // When
    act(() => {
      result.current.retry();
    });

    // Then
    await waitFor(() => expect(result.current.status).toBe('ready'));
  });
});

describe('useLoadV3Parameters with v3 on the v2 routes', () => {
  let fetchStub: ReturnType<typeof stubPublicApiFetch>;

  beforeEach(async () => {
    fetchStub = stubPublicApiFetch({ [PARAMETERS_PATH]: answerCatalogParameters });
    await seedV2ModelCatalog();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('given names then the returned load resolves once they are in the store', async () => {
    // Given
    const { result } = renderHook(() => useLoadV3Parameters(), { wrapper: v3Wrapper() });

    // When
    await act(async () => {
      await result.current([STANDARD_DEDUCTION_SINGLE]);
    });

    // Then
    expect(store.getState().metadata.parameters[STANDARD_DEDUCTION_SINGLE]?.values).toBeDefined();
  });

  test('given names already loaded then the load answers null, so the caller acts at once', async () => {
    const { result } = renderHook(() => useLoadV3Parameters(), { wrapper: v3Wrapper() });
    await act(async () => {
      await result.current([STANDARD_DEDUCTION_SINGLE]);
    });

    expect(result.current([STANDARD_DEDUCTION_SINGLE])).toBeNull();
    expect(requestsTo(fetchStub, PARAMETERS_PATH)).toHaveLength(1);
  });
});

describe('useEnsureV3Parameters after the metadata reloads', () => {
  let fetchStub: ReturnType<typeof stubPublicApiFetch>;

  beforeEach(async () => {
    fetchStub = stubPublicApiFetch({ [PARAMETERS_PATH]: answerCatalogParameters });
    await seedV2ModelCatalog();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('given the store was emptied by a new metadata load then the parameters are asked for again', async () => {
    // Given — one query client for the session, as the app has
    const queryClient = testQueryClient();
    const first = renderHook(() => useEnsureV3Parameters([STANDARD_DEDUCTION_SINGLE]), {
      wrapper: v3Wrapper(queryClient),
    });
    await waitFor(() => expect(first.result.current.status).toBe('ready'));
    first.unmount();

    // When — another page loads v1's metadata, then v3's again
    store.dispatch(clearMetadata());
    await store.dispatch(fetchMetadataThunk(metadataRequest('us', 'v2')));
    const second = renderHook(() => useEnsureV3Parameters([STANDARD_DEDUCTION_SINGLE]), {
      wrapper: v3Wrapper(queryClient),
    });

    // Then
    await waitFor(() => expect(second.result.current.status).toBe('ready'));
    expect(requestsTo(fetchStub, PARAMETERS_PATH)).toHaveLength(2);
    expect(store.getState().metadata.parameters[STANDARD_DEDUCTION_SINGLE]?.values).toBeDefined();
  });

  test('given the store was emptied then the load function asks again too', async () => {
    const queryClient = testQueryClient();
    const { result } = renderHook(() => useLoadV3Parameters(), { wrapper: v3Wrapper(queryClient) });
    await act(async () => {
      await result.current([STANDARD_DEDUCTION_SINGLE]);
    });

    store.dispatch(clearMetadata());
    await store.dispatch(fetchMetadataThunk(metadataRequest('us', 'v2')));
    await act(async () => {
      await result.current([STANDARD_DEDUCTION_SINGLE]);
    });

    expect(requestsTo(fetchStub, PARAMETERS_PATH)).toHaveLength(2);
    expect(store.getState().metadata.v2ParameterIds?.[STANDARD_DEDUCTION_SINGLE]).toBe(
      STANDARD_DEDUCTION_SINGLE_ID
    );
  });
});
