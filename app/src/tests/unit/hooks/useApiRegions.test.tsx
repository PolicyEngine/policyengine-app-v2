import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchRegions } from '@/api/v2/regions';
import { useApiRegions } from '@/hooks/useApiRegions';
import { createMockRegionResponse } from '@/tests/fixtures/api/v2/shared';

vi.mock('@/api/v2/regions', () => ({
  fetchRegions: vi.fn(),
}));

describe('useApiRegions', () => {
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

    const { result } = renderHook(() => useApiRegions('us'), { wrapper });

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
        source: 'v2_api',
      }),
      expect.objectContaining({
        countryId: 'us',
        code: 'congressional_district/CA-01',
        label: "California's 1st congressional district",
        regionType: 'congressional_district',
        source: 'v2_api',
      }),
    ]);
  });
});
