import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { CountryProvider } from '@/contexts/CountryContext';
import { useFlagshipMetadataStatus } from '@/hooks/useFlagshipMetadataStatus';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import { seedDeductionMetadata } from '@/tests/fixtures/components/flagship/draftEditorFixtures';
import { seedMetadataError } from '@/tests/fixtures/hooks/useFlagshipMetadataStatusMocks';

/** v3 after the switch: V3_API_ROUTES is 'v2'. */
vi.mock('@/libs/flagship/v3ApiRoutes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/v3ApiRoutes')>()),
  V3_API_ROUTES: 'v2',
}));

const mockFetchV1Metadata = vi.fn();
const mockFetchV2ModelCatalog = vi.fn();

vi.mock('@/api/metadata', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/metadata')>()),
  fetchMetadata: (...args: unknown[]) => mockFetchV1Metadata(...args),
}));

vi.mock('@/api/publicApi/modelCatalog', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/publicApi/modelCatalog')>()),
  fetchV2ModelCatalogMetadata: (...args: unknown[]) => mockFetchV2ModelCatalog(...args),
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <CountryProvider value="us">{children}</CountryProvider>
  </Provider>
);

describe('useFlagshipMetadataStatus with v3 on the v2 routes', () => {
  beforeEach(() => {
    store.dispatch(clearMetadata());
    mockFetchV1Metadata.mockReset();
    mockFetchV2ModelCatalog.mockReset();
    mockFetchV2ModelCatalog.mockReturnValue(new Promise(() => {}));
  });

  test('given metadata from the v1 route then v3 is not ready yet', () => {
    // Given: the legacy calculator loaded v1 metadata before the user opened v3
    seedDeductionMetadata();

    // When
    const { result } = renderHook(() => useFlagshipMetadataStatus(), { wrapper });

    // Then
    expect(result.current.status).toBe('loading');
  });

  test('given a failed fetch then retry asks the v2 routes', () => {
    // Given
    seedMetadataError();
    const { result } = renderHook(() => useFlagshipMetadataStatus(), { wrapper });

    // When
    act(() => {
      result.current.retry();
    });

    // Then
    expect(mockFetchV2ModelCatalog).toHaveBeenCalledWith('us');
    expect(mockFetchV1Metadata).not.toHaveBeenCalled();
    expect(result.current.status).toBe('loading');
  });
});
