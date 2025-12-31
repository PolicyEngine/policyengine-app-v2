import { QueryClient } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchHouseholdById } from '@/api/household';
import { fetchPolicyById } from '@/api/policy';
import { fetchReportById } from '@/api/report';
import { fetchSimulationById } from '@/api/simulation';
import { useSharedReportData } from '@/hooks/useSharedReportData';
import {
  createMockStore,
  createQueryClient,
  createWrapper,
  MOCK_HOUSEHOLD_METADATA,
  MOCK_HOUSEHOLD_SHARE_DATA,
  MOCK_POLICY_METADATA,
  MOCK_REPORT_METADATA,
  MOCK_SHARE_DATA,
  MOCK_SIMULATION_METADATA,
} from '@/tests/fixtures/hooks/useSharedReportDataMocks';

// Mock useCurrentCountry hook (required by useFetchReportIngredients)
vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: vi.fn(() => 'us'),
}));

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
    expect(result.current.userReport).toBeUndefined();
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

    // Fetches report using reportId from userReport
    expect(fetchReportById).toHaveBeenCalledWith('us', '308');
    expect(fetchHouseholdById).not.toHaveBeenCalled();
  });

  test('given valid shareData then returns user associations from ShareData', async () => {
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

    // User associations are returned from ShareData (expanded with userId: 'shared')
    expect(result.current.userReport).toMatchObject({
      id: 'sur-test123',
      reportId: '308',
      countryId: 'us',
      label: 'Test Report',
      userId: 'shared',
    });
    expect(result.current.userSimulations).toHaveLength(1);
    expect(result.current.userSimulations[0]).toMatchObject({
      simulationId: 'sim-1',
      label: 'Baseline Sim',
      userId: 'shared',
    });
    expect(result.current.userPolicies).toHaveLength(1);
    expect(result.current.userPolicies[0]).toMatchObject({
      policyId: 'policy-1',
      label: 'Test Policy',
      userId: 'shared',
    });
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

    // User geography from ShareData
    expect(result.current.userGeographies).toHaveLength(1);
    expect(result.current.userGeographies[0]).toMatchObject({
      geographyId: 'us',
      label: 'United States',
      userId: 'shared',
    });
  });

  test('given shareData with householdId then fetches household', async () => {
    // Given
    vi.mocked(fetchReportById).mockResolvedValue({ ...MOCK_REPORT_METADATA, country_id: 'uk' });
    vi.mocked(fetchSimulationById).mockResolvedValue({
      ...MOCK_SIMULATION_METADATA,
      population_type: 'household',
      population_id: 'hh-1',
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

    // User household from ShareData
    expect(result.current.userHouseholds).toHaveLength(1);
    expect(result.current.userHouseholds[0]).toMatchObject({
      householdId: 'hh-1',
      label: 'My Household',
      userId: 'shared',
    });
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
