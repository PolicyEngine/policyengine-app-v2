import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useV3SearchCatalog } from '@/hooks/useV3SearchCatalog';
import { TEST_POLICYENGINE_VERSION } from '@/tests/fixtures/api/publicApi/modelCatalogMocks';
import {
  jsonResponse,
  requestsTo,
  stubPublicApiFetch,
} from '@/tests/fixtures/api/publicApi/publicApiFetchStub';
import {
  STANDARD_DEDUCTION_SINGLE,
  US_SEARCH_FILE,
} from '@/tests/fixtures/api/publicApi/searchFileMocks';
import { seedV2ModelCatalog, v3Wrapper } from '@/tests/fixtures/hooks/v3MetadataWrapper';

/** v3 after the switch: V3_API_ROUTES is 'v2'. */
vi.mock('@/libs/flagship/v3ApiRoutes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/v3ApiRoutes')>()),
  V3_API_ROUTES: 'v2',
}));

const SEARCH_FILE_PATH = '/v2/parameters/search-file';

describe('useV3SearchCatalog with v3 on the v2 routes', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('given the search file is published', () => {
    let fetchStub: ReturnType<typeof stubPublicApiFetch>;
    beforeEach(async () => {
      fetchStub = stubPublicApiFetch({ [SEARCH_FILE_PATH]: () => jsonResponse(US_SEARCH_FILE) });
      await seedV2ModelCatalog();
    });

    test('then the file loads once, for the catalog version', async () => {
      const { result } = renderHook(() => useV3SearchCatalog(), { wrapper: v3Wrapper() });

      expect(result.current.status).toBe('loading');
      await waitFor(() => expect(result.current.status).toBe('ready'));
      const requests = requestsTo(fetchStub, SEARCH_FILE_PATH);
      expect(requests).toHaveLength(1);
      expect(requests[0].searchParams.get('policyengine_version')).toBe(TEST_POLICYENGINE_VERSION);
      expect(result.current.addablePaths.has(STANDARD_DEDUCTION_SINGLE)).toBe(true);
      expect(result.current.labelFor('gov.irs.deductions.standard')).toBe('Standard deduction');
    });
  });

  describe('given the file has not arrived', () => {
    beforeEach(async () => {
      stubPublicApiFetch({ [SEARCH_FILE_PATH]: () => new Promise<Response>(() => {}) });
      await seedV2ModelCatalog();
    });

    test('then nothing is offered yet', () => {
      const { result } = renderHook(() => useV3SearchCatalog(), { wrapper: v3Wrapper() });

      expect(result.current.status).toBe('loading');
      expect(result.current.entries).toEqual([]);
      expect(result.current.addablePaths.size).toBe(0);
    });
  });

  describe('given the file fails once', () => {
    let fetchStub: ReturnType<typeof stubPublicApiFetch>;
    beforeEach(async () => {
      let attempts = 0;
      fetchStub = stubPublicApiFetch({
        [SEARCH_FILE_PATH]: () => {
          attempts += 1;
          return attempts === 1
            ? jsonResponse({ status: 'error', message: 'No search file' }, 503)
            : jsonResponse(US_SEARCH_FILE);
        },
      });
      await seedV2ModelCatalog();
    });

    test('then the status says so and retry asks again', async () => {
      // Given
      const { result } = renderHook(() => useV3SearchCatalog(), { wrapper: v3Wrapper() });
      await waitFor(() => expect(result.current.status).toBe('error'));

      // When
      act(() => {
        result.current.retry();
      });

      // Then
      await waitFor(() => expect(result.current.status).toBe('ready'));
      expect(requestsTo(fetchStub, SEARCH_FILE_PATH)).toHaveLength(2);
    });
  });
});
