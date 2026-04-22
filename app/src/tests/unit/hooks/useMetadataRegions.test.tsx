import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, expect, test } from 'vitest';
import { useMetadataRegions } from '@/hooks/useMetadataRegions';
import metadataReducer from '@/reducers/metadataReducer';
import { US_REGION_TYPES } from '@/types/regionTypes';

describe('useMetadataRegions', () => {
  test('given metadata regions then it adapts them to app-level region records', () => {
    const store = configureStore({
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

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useMetadataRegions('us'), { wrapper });

    expect(result.current.isSuccess).toBe(true);
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
  });
});
