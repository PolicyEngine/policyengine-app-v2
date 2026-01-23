/**
 * Tests for CongressionalDistrictDataContext
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import {
  CongressionalDistrictDataProvider,
  useCongressionalDistrictData,
} from '@/contexts/congressional-district/CongressionalDistrictDataContext';
import * as societyWideApi from '@/api/societyWideCalculation';
import { MOCK_ALABAMA_DISTRICT_DATA } from '@/tests/fixtures/contexts/congressional-district/congressionalDistrictMocks';

// Mock the API module
vi.mock('@/api/societyWideCalculation', () => ({
  fetchSocietyWideCalculation: vi.fn(),
}));

// Create a mock Redux store with metadata
const createMockStore = (regions: Array<{ name: string; label: string; type: string }> = []) => {
  return configureStore({
    reducer: {
      metadata: () => ({
        economyOptions: {
          region: regions,
        },
      }),
    },
  });
};

// Create mock regions for testing
const MOCK_REGIONS = [
  { name: 'us', label: 'United States', type: 'national' },
  { name: 'state/al', label: 'Alabama', type: 'state' },
  { name: 'state/ca', label: 'California', type: 'state' },
  { name: 'AL-01', label: "Alabama's 1st district", type: 'congressional_district' },
];

// Wrapper component for testing hooks
const createWrapper = (
  store: ReturnType<typeof createMockStore>,
  props: {
    reformPolicyId: string;
    baselinePolicyId: string;
    year: string;
    region?: string;
  }
) => {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <CongressionalDistrictDataProvider {...props}>
          {children}
        </CongressionalDistrictDataProvider>
      </Provider>
    );
  };
};

describe('CongressionalDistrictDataContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useCongressionalDistrictData hook', () => {
    test('given hook used outside provider then throws error', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // When/Then
      expect(() => {
        renderHook(() => useCongressionalDistrictData());
      }).toThrow('useCongressionalDistrictData must be used within a CongressionalDistrictDataProvider');

      consoleSpy.mockRestore();
    });

    test('given initial state then hasStarted is false', () => {
      // Given
      const store = createMockStore(MOCK_REGIONS);
      const wrapper = createWrapper(store, {
        reformPolicyId: '123',
        baselinePolicyId: '456',
        year: '2024',
        region: 'us',
      });

      // When
      const { result } = renderHook(() => useCongressionalDistrictData(), { wrapper });

      // Then
      expect(result.current.hasStarted).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isComplete).toBe(false);
    });

    test('given national report then isStateLevelReport is false', () => {
      // Given
      const store = createMockStore(MOCK_REGIONS);
      const wrapper = createWrapper(store, {
        reformPolicyId: '123',
        baselinePolicyId: '456',
        year: '2024',
        region: 'us',
      });

      // When
      const { result } = renderHook(() => useCongressionalDistrictData(), { wrapper });

      // Then
      expect(result.current.isStateLevelReport).toBe(false);
      expect(result.current.stateCode).toBeNull();
    });

    test('given state-level report then isStateLevelReport is true', () => {
      // Given - mock API to prevent auto-fetch from failing
      vi.mocked(societyWideApi.fetchSocietyWideCalculation).mockResolvedValue({
        status: 'ok',
        result: { congressional_district_impact: { districts: [] } } as any,
      });

      const store = createMockStore(MOCK_REGIONS);
      const wrapper = createWrapper(store, {
        reformPolicyId: '123',
        baselinePolicyId: '456',
        year: '2024',
        region: 'state/ca',
      });

      // When
      const { result } = renderHook(() => useCongressionalDistrictData(), { wrapper });

      // Then
      expect(result.current.isStateLevelReport).toBe(true);
      expect(result.current.stateCode).toBe('ca');
    });
  });

  describe('startFetch', () => {
    test('given startFetch called then initiates fetching for all states', async () => {
      // Given
      const mockFetch = vi.mocked(societyWideApi.fetchSocietyWideCalculation);
      mockFetch.mockResolvedValue({
        status: 'ok',
        result: {
          congressional_district_impact: {
            districts: MOCK_ALABAMA_DISTRICT_DATA.districts,
          },
        } as any,
      });

      const store = createMockStore(MOCK_REGIONS);
      const wrapper = createWrapper(store, {
        reformPolicyId: '123',
        baselinePolicyId: '456',
        year: '2024',
        region: 'us',
      });

      const { result } = renderHook(() => useCongressionalDistrictData(), { wrapper });

      // When
      act(() => {
        result.current.startFetch();
      });

      // Then
      expect(result.current.hasStarted).toBe(true);
      expect(result.current.isLoading).toBe(true);
    });

    test('given startFetch called twice then second call is ignored', async () => {
      // Given
      const mockFetch = vi.mocked(societyWideApi.fetchSocietyWideCalculation);
      mockFetch.mockResolvedValue({
        status: 'computing',
        queue_position: 1,
        average_time: 60,
        result: null,
      });

      const store = createMockStore(MOCK_REGIONS);
      const wrapper = createWrapper(store, {
        reformPolicyId: '123',
        baselinePolicyId: '456',
        year: '2024',
        region: 'us',
      });

      const { result } = renderHook(() => useCongressionalDistrictData(), { wrapper });

      // When
      act(() => {
        result.current.startFetch();
      });
      const callCountAfterFirst = mockFetch.mock.calls.length;

      act(() => {
        result.current.startFetch();
      });
      const callCountAfterSecond = mockFetch.mock.calls.length;

      // Then - no additional calls made
      expect(callCountAfterSecond).toBe(callCountAfterFirst);
    });
  });

  describe('state-level auto-fetch', () => {
    test('given state-level report then auto-starts fetching', async () => {
      // Given
      const mockFetch = vi.mocked(societyWideApi.fetchSocietyWideCalculation);
      mockFetch.mockResolvedValue({
        status: 'ok',
        result: {
          congressional_district_impact: {
            districts: MOCK_ALABAMA_DISTRICT_DATA.districts,
          },
        } as any,
      });

      const store = createMockStore(MOCK_REGIONS);
      const wrapper = createWrapper(store, {
        reformPolicyId: '123',
        baselinePolicyId: '456',
        year: '2024',
        region: 'state/al',
      });

      // When
      const { result } = renderHook(() => useCongressionalDistrictData(), { wrapper });

      // Then - should auto-start for state-level reports
      await waitFor(() => {
        expect(result.current.hasStarted).toBe(true);
      });
    });
  });

  describe('polling behavior', () => {
    test('given API returns ok status then completes state fetch', async () => {
      // Given
      const mockFetch = vi.mocked(societyWideApi.fetchSocietyWideCalculation);
      mockFetch.mockResolvedValue({
        status: 'ok',
        result: {
          congressional_district_impact: {
            districts: MOCK_ALABAMA_DISTRICT_DATA.districts,
          },
        } as any,
      });

      const store = createMockStore(MOCK_REGIONS);
      const wrapper = createWrapper(store, {
        reformPolicyId: '123',
        baselinePolicyId: '456',
        year: '2024',
        region: 'state/al',
      });

      // When
      const { result } = renderHook(() => useCongressionalDistrictData(), { wrapper });

      // Then
      await waitFor(() => {
        expect(result.current.isComplete).toBe(true);
        expect(result.current.completedCount).toBe(1);
      });
    });

    test('given API returns error status then marks state as errored', async () => {
      // Given
      const mockFetch = vi.mocked(societyWideApi.fetchSocietyWideCalculation);
      mockFetch.mockResolvedValue({
        status: 'error',
        error: 'Calculation failed',
        result: null,
      });

      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const store = createMockStore(MOCK_REGIONS);
      const wrapper = createWrapper(store, {
        reformPolicyId: '123',
        baselinePolicyId: '456',
        year: '2024',
        region: 'state/al',
      });

      // When
      const { result } = renderHook(() => useCongressionalDistrictData(), { wrapper });

      // Then
      await waitFor(() => {
        expect(result.current.isComplete).toBe(true);
        expect(result.current.errorCount).toBe(1);
      });

      consoleSpy.mockRestore();
    });

    test('given API call throws error then marks state as errored', async () => {
      // Given
      const mockFetch = vi.mocked(societyWideApi.fetchSocietyWideCalculation);
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const store = createMockStore(MOCK_REGIONS);
      const wrapper = createWrapper(store, {
        reformPolicyId: '123',
        baselinePolicyId: '456',
        year: '2024',
        region: 'state/al',
      });

      // When
      const { result } = renderHook(() => useCongressionalDistrictData(), { wrapper });

      // Then
      await waitFor(() => {
        expect(result.current.isComplete).toBe(true);
        expect(result.current.errorCount).toBe(1);
      });

      consoleSpy.mockRestore();
    });
  });

  describe('context value computation', () => {
    test('given completed fetch then stateResponses contains district data', async () => {
      // Given
      const mockFetch = vi.mocked(societyWideApi.fetchSocietyWideCalculation);
      mockFetch.mockResolvedValue({
        status: 'ok',
        result: {
          congressional_district_impact: {
            districts: MOCK_ALABAMA_DISTRICT_DATA.districts,
          },
        } as any,
      });

      const store = createMockStore(MOCK_REGIONS);
      const wrapper = createWrapper(store, {
        reformPolicyId: '123',
        baselinePolicyId: '456',
        year: '2024',
        region: 'state/al',
      });

      // When
      const { result } = renderHook(() => useCongressionalDistrictData(), { wrapper });

      // Then
      await waitFor(() => {
        expect(result.current.stateResponses.size).toBe(1);
        expect(result.current.totalDistrictsLoaded).toBe(MOCK_ALABAMA_DISTRICT_DATA.districts.length);
      });
    });

    test('given no states in metadata then totalStates is 0', () => {
      // Given - empty regions
      const store = createMockStore([]);
      const wrapper = createWrapper(store, {
        reformPolicyId: '123',
        baselinePolicyId: '456',
        year: '2024',
        region: 'us',
      });

      // When
      const { result } = renderHook(() => useCongressionalDistrictData(), { wrapper });

      // Then
      expect(result.current.totalStates).toBe(0);
    });
  });
});
