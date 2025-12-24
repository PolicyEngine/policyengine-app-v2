import React from 'react';
import { QueryNormalizerProvider } from '@normy/react-query';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchHouseholdById } from '@/api/household';
import { fetchPolicyById } from '@/api/policy';
// Import mocked modules
import { fetchReportById } from '@/api/report';
import { fetchSimulationById } from '@/api/simulation';
import { useSharedReportData } from '@/hooks/useSharedReportData';
import { ShareData } from '@/utils/shareUtils';

// Mock API functions
vi.mock('@/api/report', () => ({
  fetchReportById: vi.fn(),
}));

vi.mock('@/api/simulation', () => ({
  fetchSimulationById: vi.fn(),
}));

vi.mock('@/api/policy', () => ({
  fetchPolicyById: vi.fn(),
}));

vi.mock('@/api/household', () => ({
  fetchHouseholdById: vi.fn(),
}));

// Test fixtures
const MOCK_SHARE_DATA: ShareData = {
  reportId: '308',
  countryId: 'us',
  year: '2024',
  simulationIds: ['sim-1'],
  policyIds: ['policy-1'],
  householdId: null,
  geographyId: 'us',
  userReportId: 'sur-test123',
};

const MOCK_HOUSEHOLD_SHARE_DATA: ShareData = {
  reportId: '309',
  countryId: 'uk',
  year: '2025',
  simulationIds: ['sim-2'],
  policyIds: ['policy-2'],
  householdId: 'hh-1',
  geographyId: null,
  userReportId: 'sur-test456',
};

// Mock metadata - cast to any for test simplicity
const MOCK_REPORT_METADATA: any = {
  id: 308,
  country_id: 'us',
  year: '2024',
  simulation_ids: ['1'],
  simulation_1_id: '1',
  simulation_2_id: null,
  status: 'complete',
  api_version: '1.0.0',
  output: null,
};

const MOCK_SIMULATION_METADATA: any = {
  id: 1,
  country_id: 'us',
  year: '2024',
  population_type: 'geography',
  population_id: 'us',
  policy_id: 1,
  api_version: '1.0.0',
};

const MOCK_POLICY_METADATA: any = {
  id: '1',
  country_id: 'us',
  label: 'Test Policy',
  policy_json: {},
  api_version: '1.0.0',
  policy_hash: 'abc123',
};

const MOCK_HOUSEHOLD_METADATA: any = {
  id: 'hh-1',
  country_id: 'uk',
  label: 'Test Household',
  household_json: {},
  api_version: '1.0.0',
  household_hash: 'def456',
};

// Helper to create mock store with metadata
const createMockStore = () => {
  const metadataReducer = (
    state = {
      currentCountry: 'us',
      economyOptions: {
        region: [{ name: 'us', label: 'US Nationwide' }],
        time_period: [],
        datasets: [],
      },
    }
  ) => state;

  return configureStore({
    reducer: { metadata: metadataReducer },
  });
};

// Helper to create query client
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

// Wrapper component
const createWrapper = (queryClient: QueryClient, store: ReturnType<typeof createMockStore>) => {
  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <QueryNormalizerProvider queryClient={queryClient}>{children}</QueryNormalizerProvider>
      </QueryClientProvider>
    </Provider>
  );
};

describe('useSharedReportData', () => {
  let queryClient: QueryClient;
  let store: ReturnType<typeof createMockStore>;
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createQueryClient();
    store = createMockStore();
    wrapper = createWrapper(queryClient, store);
  });

  test('given null shareData then returns empty results without fetching', async () => {
    // When
    const { result } = renderHook(() => useSharedReportData(null), { wrapper });

    // Then
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.report).toBeUndefined();
    expect(result.current.simulations).toEqual([]);
    expect(result.current.policies).toEqual([]);
    expect(fetchReportById).not.toHaveBeenCalled();
  });

  test('given enabled=false then does not fetch data', async () => {
    // When
    const { result } = renderHook(() => useSharedReportData(MOCK_SHARE_DATA, { enabled: false }), {
      wrapper,
    });

    // Then
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetchReportById).not.toHaveBeenCalled();
    expect(fetchSimulationById).not.toHaveBeenCalled();
  });

  test('given valid society-wide shareData then fetches report and simulations', async () => {
    // Given
    vi.mocked(fetchReportById).mockResolvedValue(MOCK_REPORT_METADATA);
    vi.mocked(fetchSimulationById).mockResolvedValue(MOCK_SIMULATION_METADATA);
    vi.mocked(fetchPolicyById).mockResolvedValue(MOCK_POLICY_METADATA);

    // When
    const { result } = renderHook(() => useSharedReportData(MOCK_SHARE_DATA), { wrapper });

    // Then
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetchReportById).toHaveBeenCalledWith('us', '308');
    expect(fetchSimulationById).toHaveBeenCalledWith('us', 'sim-1');
    expect(fetchPolicyById).toHaveBeenCalledWith('us', 'policy-1');
    expect(fetchHouseholdById).not.toHaveBeenCalled();
  });

  test('given valid shareData with geographyId then builds geography object', async () => {
    // Given
    vi.mocked(fetchReportById).mockResolvedValue(MOCK_REPORT_METADATA);
    vi.mocked(fetchSimulationById).mockResolvedValue(MOCK_SIMULATION_METADATA);
    vi.mocked(fetchPolicyById).mockResolvedValue(MOCK_POLICY_METADATA);

    // When
    const { result } = renderHook(() => useSharedReportData(MOCK_SHARE_DATA), { wrapper });

    // Then
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.geographies).toHaveLength(1);
    expect(result.current.geographies[0]).toMatchObject({
      id: 'us',
      countryId: 'us',
      scope: 'national',
    });
  });

  test('given shareData with householdId then fetches household', async () => {
    // Given
    vi.mocked(fetchReportById).mockResolvedValue({ ...MOCK_REPORT_METADATA, country_id: 'uk' });
    vi.mocked(fetchSimulationById).mockResolvedValue({
      ...MOCK_SIMULATION_METADATA,
      population_type: 'household',
    });
    vi.mocked(fetchPolicyById).mockResolvedValue(MOCK_POLICY_METADATA);
    vi.mocked(fetchHouseholdById).mockResolvedValue(MOCK_HOUSEHOLD_METADATA);

    // When
    const { result } = renderHook(() => useSharedReportData(MOCK_HOUSEHOLD_SHARE_DATA), {
      wrapper,
    });

    // Then
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetchHouseholdById).toHaveBeenCalledWith('uk', 'hh-1');
  });

  test('given API error then returns error state', async () => {
    // Given
    const mockError = new Error('Failed to fetch report');
    vi.mocked(fetchReportById).mockRejectedValue(mockError);

    // When
    const { result } = renderHook(() => useSharedReportData(MOCK_SHARE_DATA), { wrapper });

    // Then
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
  });
});
