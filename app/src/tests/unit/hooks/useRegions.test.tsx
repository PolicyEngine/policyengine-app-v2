import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchRegions } from '@/api/v2/regions';
import { useRegions } from '@/hooks/useRegions';
import { createMockRegionResponse } from '@/tests/fixtures/api/v2/shared';

vi.mock('@/api/v2/regions', () => ({
  fetchRegions: vi.fn(),
}));

describe('useRegions', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  test('given v2 region metadata then it returns canonical region records', async () => {
    // Given
    vi.mocked(fetchRegions).mockResolvedValue([
      createMockRegionResponse(),
      {
        ...createMockRegionResponse(),
        id: 'region-2',
        code: 'congressional_district/CA-01',
        label: "California's 1st congressional district",
        region_type: 'congressional_district',
      },
    ]);

    // When
    const { result } = renderHook(() => useRegions('us'), { wrapper });

    // Then
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(fetchRegions).toHaveBeenCalledWith('us');
    expect(result.current.data).toEqual([
      expect.objectContaining({
        countryId: 'us',
        code: 'state/ca',
        label: 'California',
        regionType: 'state',
        stateCode: 'CA',
        stateName: 'California',
      }),
      expect.objectContaining({
        countryId: 'us',
        code: 'congressional_district/CA-01',
        label: "California's 1st congressional district",
        regionType: 'congressional_district',
      }),
    ]);
  });
});
