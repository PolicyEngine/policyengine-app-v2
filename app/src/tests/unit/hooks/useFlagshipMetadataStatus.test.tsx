import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { CountryProvider } from '@/contexts/CountryContext';
import { useFlagshipMetadataStatus } from '@/hooks/useFlagshipMetadataStatus';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import { seedDeductionMetadata } from '@/tests/fixtures/components/flagship/draftEditorFixtures';
import {
  METADATA_ERROR_MESSAGE,
  seedMetadataError,
  seedMetadataLoading,
} from '@/tests/fixtures/hooks/useFlagshipMetadataStatusMocks';

const mockFetchMetadata = vi.fn();

vi.mock('@/api/metadata', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/metadata')>()),
  fetchMetadata: (...args: unknown[]) => mockFetchMetadata(...args),
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <CountryProvider value="us">{children}</CountryProvider>
  </Provider>
);

describe('useFlagshipMetadataStatus', () => {
  beforeEach(() => {
    store.dispatch(clearMetadata());
    mockFetchMetadata.mockReset();
    // A retried fetch stays in flight, so the status it leaves can be read.
    mockFetchMetadata.mockReturnValue(new Promise(() => {}));
  });

  test('given a fetch in flight then the status is loading', () => {
    seedMetadataLoading();

    const { result } = renderHook(() => useFlagshipMetadataStatus(), { wrapper });

    expect(result.current.status).toBe('loading');
    expect(result.current.message).toBeNull();
  });

  test('given a failed fetch then the status is error, with its message', () => {
    seedMetadataError();

    const { result } = renderHook(() => useFlagshipMetadataStatus(), { wrapper });

    expect(result.current.status).toBe('error');
    expect(result.current.message).toBe(METADATA_ERROR_MESSAGE);
  });

  test('given the metadata arrived then the status is ready', () => {
    seedDeductionMetadata();

    const { result } = renderHook(() => useFlagshipMetadataStatus(), { wrapper });

    expect(result.current.status).toBe('ready');
  });

  test('given a failed fetch then retry asks for the country again', () => {
    // Given
    seedMetadataError();
    const { result } = renderHook(() => useFlagshipMetadataStatus(), { wrapper });

    // When
    act(() => {
      result.current.retry();
    });

    // Then
    expect(mockFetchMetadata).toHaveBeenCalledWith('us');
    expect(result.current.status).toBe('loading');
  });
});
