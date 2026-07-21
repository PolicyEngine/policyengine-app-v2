import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { REGION_SURFACE_SOURCE } from '@/config/regionSource';
import { useRegions } from '@/hooks/useRegions';
import metadataReducer from '@/reducers/metadataReducer';
import { US_REGION_TYPES } from '@/types/regionTypes';

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

  function createStore() {
    return configureStore({
      reducer: {
        metadata: metadataReducer,
      },
      preloadedState: {
        metadata: {
          currentCountry: 'us',
          loading: false,
          error: null,
          progress: 100,
          variables: {},
          parameters: {},
          entities: {},
          variableModules: {},
          economyOptions: {
            region: [
              { name: 'state/ca', label: 'California', type: US_REGION_TYPES.STATE },
              {
                name: 'congressional_district/CA-01',
                label: "California's 1st congressional district",
                type: US_REGION_TYPES.CONGRESSIONAL_DISTRICT,
                state_abbreviation: 'CA',
                state_name: 'California',
              },
            ],
            time_period: [],
            datasets: [],
          },
          currentLawId: 0,
          basicInputs: [],
          modelledPolicies: { core: {}, filtered: {} },
          version: null,
          parameterTree: null,
        },
      },
    });
  }

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={createStore()}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Provider>
  );

  test('surfaces metadata-backed regions by default without loading api regions', async () => {
    const { result } = renderHook(() => useRegions('us'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(REGION_SURFACE_SOURCE).toBe('metadata');
    expect(result.current.surfaceSource).toBe('metadata');
    expect(result.current.data).toEqual([
      expect.objectContaining({
        countryId: 'us',
        code: 'state/ca',
        label: 'California',
        regionType: 'state',
        source: 'v1_metadata',
      }),
      expect.objectContaining({
        countryId: 'us',
        code: 'congressional_district/CA-01',
        label: "California's 1st congressional district",
        regionType: 'congressional_district',
        stateCode: 'CA',
        stateName: 'California',
        source: 'v1_metadata',
      }),
    ]);
    expect(result.current.metadataData).toEqual(result.current.data);
    // regions are surfaced from v1 metadata only; there is no v2 api data
    expect(result.current.apiData).toBeUndefined();
  });
});
