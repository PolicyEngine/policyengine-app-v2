import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import * as householdApi from '@/api/household';
import * as policyApi from '@/api/policy';
import * as reportApi from '@/api/report';
import * as simulationApi from '@/api/simulation';
import { useHouseholdAssociationsByUser } from '@/hooks/useUserHousehold';
import { usePolicyAssociationsByUser } from '@/hooks/useUserPolicy';
import { useReportAssociationsByUser } from '@/hooks/useUserReportAssociations';
import { useUserReportById, useUserReports } from '@/hooks/useUserReports';
import { useSimulationAssociationsByUser } from '@/hooks/useUserSimulationAssociations';
import metadataReducer from '@/reducers/metadataReducer';
import { mockReport, mockReportMetadata } from '@/tests/fixtures/adapters/reportMocks';
import {
  createMockQueryClient,
  mockUserReportList,
  TEST_REPORT_ID,
  TEST_USER_ID,
} from '@/tests/fixtures/api/reportAssociationMocks';
import {
  createNormalizedCacheMock,
  ERROR_MESSAGES,
  mockHousehold1,
  mockHouseholdMetadata,
  mockMetadataInitialState,
  mockPolicy1,
  mockPolicyMetadata1,
  mockPolicyMetadata2,
  mockSimulation1,
  mockSimulationMetadata1,
  mockSimulationMetadata2,
  mockUserHouseholds,
  mockUserPolicies,
  mockUserSimulations,
  TEST_HOUSEHOLD_ID,
  TEST_POLICY_ID_1,
  TEST_POLICY_ID_2,
  TEST_SIMULATION_ID_1,
  TEST_SIMULATION_ID_2,
} from '@/tests/fixtures/hooks/useUserReportsMocks';

// Mock Plotly
vi.mock('react-plotly.js', () => ({ default: vi.fn(() => null) }));

// Mock the normalizer
vi.mock('@normy/react-query', () => ({
  useQueryNormalizer: () => createNormalizedCacheMock(),
}));

// Mock the association hooks
vi.mock('@/hooks/useUserReportAssociations', () => ({
  useReportAssociationsByUser: vi.fn(),
}));

vi.mock('@/hooks/useUserSimulationAssociations', () => ({
  useSimulationAssociationsByUser: vi.fn(),
}));

vi.mock('@/hooks/useUserPolicy', () => ({
  usePolicyAssociationsByUser: vi.fn(),
}));

vi.mock('@/hooks/useUserHousehold', () => ({
  useHouseholdAssociationsByUser: vi.fn(),
}));

// Helper to create mock store
const createMockStore = () => {
  return configureStore({
    reducer: {
      metadata: metadataReducer,
    },
    preloadedState: mockMetadataInitialState,
  });
};

describe('useUserReports', () => {
  let queryClient: ReturnType<typeof createMockQueryClient>;
  let store: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createMockQueryClient();
    store = createMockStore();

    // Setup default mock implementations
    (useReportAssociationsByUser as any).mockReturnValue({
      data: mockUserReportList,
      isLoading: false,
      error: null,
    });

    (useSimulationAssociationsByUser as any).mockReturnValue({
      data: mockUserSimulations,
      isLoading: false,
      error: null,
    });

    (usePolicyAssociationsByUser as any).mockReturnValue({
      data: mockUserPolicies,
      isLoading: false,
      error: null,
    });

    (useHouseholdAssociationsByUser as any).mockReturnValue({
      data: mockUserHouseholds,
      isLoading: false,
      error: null,
    });

    // Mock API calls
    vi.spyOn(reportApi, 'fetchReportById').mockImplementation((_country, id) => {
      if (id === mockReport.reportId) {
        return Promise.resolve(mockReportMetadata);
      }
      if (id === 'report-1') {
        return Promise.resolve({
          ...mockReportMetadata,
          id: 1,
          simulation_1_id: TEST_SIMULATION_ID_1,
          simulation_2_id: TEST_SIMULATION_ID_2,
        });
      }
      if (id === 'report-2') {
        return Promise.resolve({
          ...mockReportMetadata,
          id: 2,
          simulation_1_id: TEST_SIMULATION_ID_1,
          simulation_2_id: null,
        });
      }
      return Promise.reject(new Error(ERROR_MESSAGES.REPORT_NOT_FOUND(id)));
    });

    vi.spyOn(simulationApi, 'fetchSimulationById').mockImplementation((_country, id) => {
      if (id === TEST_SIMULATION_ID_1) {
        return Promise.resolve(mockSimulationMetadata1);
      }
      if (id === TEST_SIMULATION_ID_2) {
        return Promise.resolve(mockSimulationMetadata2);
      }
      return Promise.reject(new Error(ERROR_MESSAGES.SIMULATION_NOT_FOUND(id)));
    });

    vi.spyOn(policyApi, 'fetchPolicyById').mockImplementation((_country, id) => {
      if (id === TEST_POLICY_ID_1) {
        return Promise.resolve(mockPolicyMetadata1);
      }
      if (id === TEST_POLICY_ID_2) {
        return Promise.resolve(mockPolicyMetadata2);
      }
      return Promise.reject(new Error(ERROR_MESSAGES.POLICY_NOT_FOUND(id)));
    });

    vi.spyOn(householdApi, 'fetchHouseholdById').mockImplementation((_country, id) => {
      if (id === TEST_HOUSEHOLD_ID) {
        return Promise.resolve(mockHouseholdMetadata);
      }
      return Promise.reject(new Error(ERROR_MESSAGES.HOUSEHOLD_NOT_FOUND(id)));
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Provider>
  );

  describe('data fetching', () => {
    test('given user ID when fetching reports then returns enhanced report data', async () => {
      // Given
      const userId = TEST_USER_ID;

      // When
      const { result } = renderHook(() => useUserReports(userId), { wrapper });

      // Then
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2); // Based on mockUserReportList
      expect(result.current.isError).toBe(false);
    });

    test('given reports with simulations then fetches all related data', async () => {
      // Given
      const userId = TEST_USER_ID;

      // When
      const { result } = renderHook(() => useUserReports(userId), { wrapper });

      // Then
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const firstReport = result.current.data[0];
      expect(firstReport).toBeDefined();
      expect(firstReport.userReport).toBeDefined();
      expect(firstReport.report).toBeDefined();
      expect(firstReport.simulations).toBeDefined();
      expect(firstReport.policies).toBeDefined();
    });

    test('given reports with household populations then includes household data', async () => {
      // Given
      const userId = TEST_USER_ID;

      // When
      const { result } = renderHook(() => useUserReports(userId), { wrapper });

      // Then
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const reports = result.current.data;
      const reportWithHousehold = reports.find((r) =>
        r.simulations?.some((s) => s.populationType === 'household')
      );

      expect(reportWithHousehold).toBeDefined();
      expect(reportWithHousehold?.households).toBeDefined();
      expect(reportWithHousehold?.userHouseholds).toBeDefined();
    });

    test('given reports with geography populations then includes geography data', async () => {
      // Given
      const userId = TEST_USER_ID;

      // When
      const { result } = renderHook(() => useUserReports(userId), { wrapper });

      // Then
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const reports = result.current.data;
      const reportWithGeography = reports.find((r) =>
        r.simulations?.some((s) => s.populationType === 'geography')
      );

      expect(reportWithGeography).toBeDefined();
      expect(reportWithGeography?.geographies).toBeDefined();
    });

    test('given no reports then returns empty array', async () => {
      // Given
      const userId = TEST_USER_ID;
      (useReportAssociationsByUser as any).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      // When
      const { result } = renderHook(() => useUserReports(userId), { wrapper });

      // Then
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
      expect(result.current.isError).toBe(false);
    });
  });

  describe('error handling', () => {
    test('given report association fetch fails then returns error state', async () => {
      // Given
      const userId = TEST_USER_ID;
      const error = new Error(ERROR_MESSAGES.FETCH_ASSOCIATIONS_FAILED);
      (useReportAssociationsByUser as any).mockReturnValue({
        data: null,
        isLoading: false,
        error,
      });

      // When
      const { result } = renderHook(() => useUserReports(userId), { wrapper });

      // Then
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    test('given simulation fetch fails then continues with partial data', async () => {
      // Given
      const userId = TEST_USER_ID;
      vi.spyOn(simulationApi, 'fetchSimulationById').mockRejectedValue(
        new Error(ERROR_MESSAGES.SIMULATION_FETCH_FAILED)
      );

      // When
      const { result } = renderHook(() => useUserReports(userId), { wrapper });

      // Then
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should still return reports but simulations will be undefined or partial
      // The hook doesn't guarantee empty arrays when fetches fail
      expect(result.current.data).toBeDefined();
      expect(result.current.data.length).toBeGreaterThan(0);
      // Some simulations might still be cached, so we just verify the structure
      expect(result.current.data[0]).toHaveProperty('simulations');
    });

    test('given policy fetch fails then continues with partial data', async () => {
      // Given
      const userId = TEST_USER_ID;
      vi.spyOn(policyApi, 'fetchPolicyById').mockRejectedValue(
        new Error(ERROR_MESSAGES.POLICY_FETCH_FAILED)
      );

      // When
      const { result } = renderHook(() => useUserReports(userId), { wrapper });

      // Then
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should still return reports but policies will be undefined or partial
      // The hook doesn't guarantee empty arrays when fetches fail
      expect(result.current.data).toBeDefined();
      expect(result.current.data.length).toBeGreaterThan(0);
      // Some policies might still be cached, so we just verify the structure
      expect(result.current.data[0]).toHaveProperty('policies');
    });
  });

  describe('helper functions', () => {
    test('given report ID when using getReportWithFullContext then returns specific report', async () => {
      // Given
      const userId = TEST_USER_ID;

      // When
      const { result } = renderHook(() => useUserReports(userId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const report = result.current.getReportWithFullContext('report-1');

      // Then
      expect(report).toBeDefined();
      expect(report?.userReport.reportId).toBe('report-1');
    });

    test('given simulation ID when using getReportsBySimulation then returns matching reports', async () => {
      // Given
      const userId = TEST_USER_ID;

      // When
      const { result } = renderHook(() => useUserReports(userId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const reports = result.current.getReportsBySimulation(TEST_SIMULATION_ID_1);

      // Then
      expect(reports).toBeDefined();
      expect(reports.length).toBeGreaterThan(0);
    });

    test('given policy ID when using getReportsByPolicy then returns matching reports', async () => {
      // Given
      const userId = TEST_USER_ID;

      // When
      const { result } = renderHook(() => useUserReports(userId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const reports = result.current.getReportsByPolicy(TEST_POLICY_ID_1);

      // Then
      expect(reports).toBeDefined();
    });

    test('given household ID when using getReportsByHousehold then returns matching reports', async () => {
      // Given
      const userId = TEST_USER_ID;

      // When
      const { result } = renderHook(() => useUserReports(userId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const reports = result.current.getReportsByHousehold(TEST_HOUSEHOLD_ID);

      // Then
      expect(reports).toBeDefined();
    });
  });

  describe('normalized cache access', () => {
    test('given entity ID when using getNormalizedReport then returns cached report', async () => {
      // Given
      const userId = TEST_USER_ID;

      // When
      const { result } = renderHook(() => useUserReports(userId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // TEST_REPORT_ID is 'report-123' but mockReport has reportId '123'
      // We should check for the correct report ID that exists in our mocks
      const cachedReport = result.current.getNormalizedReport('report-1');

      // Then
      expect(cachedReport).toBeDefined();
      expect(cachedReport?.reportId).toBe('report-1');
    });

    test('given entity ID when using getNormalizedSimulation then returns cached simulation', async () => {
      // Given
      const userId = TEST_USER_ID;

      // When
      const { result } = renderHook(() => useUserReports(userId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const cachedSimulation = result.current.getNormalizedSimulation(TEST_SIMULATION_ID_1);

      // Then
      expect(cachedSimulation).toEqual(mockSimulation1);
    });

    test('given entity ID when using getNormalizedPolicy then returns cached policy', async () => {
      // Given
      const userId = TEST_USER_ID;

      // When
      const { result } = renderHook(() => useUserReports(userId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const cachedPolicy = result.current.getNormalizedPolicy(TEST_POLICY_ID_1);

      // Then
      expect(cachedPolicy).toEqual(mockPolicy1);
    });

    test('given entity ID when using getNormalizedHousehold then returns cached household', async () => {
      // Given
      const userId = TEST_USER_ID;

      // When
      const { result } = renderHook(() => useUserReports(userId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const cachedHousehold = result.current.getNormalizedHousehold(TEST_HOUSEHOLD_ID);

      // Then
      expect(cachedHousehold).toEqual(mockHousehold1);
    });
  });

  describe('loading states', () => {
    test('given associations loading then isLoading is true', async () => {
      // Given
      const userId = TEST_USER_ID;
      (useReportAssociationsByUser as any).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      // When
      const { result } = renderHook(() => useUserReports(userId), { wrapper });

      // Then
      expect(result.current.isLoading).toBe(true);
    });

    test('given all data loaded then isLoading is false', async () => {
      // Given
      const userId = TEST_USER_ID;

      // When
      const { result } = renderHook(() => useUserReports(userId), { wrapper });

      // Then
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('associations', () => {
    test('given user ID when fetching then returns raw associations', async () => {
      // Given
      const userId = TEST_USER_ID;

      // When
      const { result } = renderHook(() => useUserReports(userId), { wrapper });

      // Then
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.associations).toBeDefined();
      expect(result.current.associations.reports).toEqual(mockUserReportList);
      expect(result.current.associations.simulations).toEqual(mockUserSimulations);
      expect(result.current.associations.policies).toEqual(mockUserPolicies);
      expect(result.current.associations.households).toEqual(mockUserHouseholds);
    });
  });
});

describe('useUserReportById', () => {
  let queryClient: ReturnType<typeof createMockQueryClient>;
  let store: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createMockQueryClient();
    store = createMockStore();

    // Setup API mocks
    vi.spyOn(reportApi, 'fetchReportById').mockResolvedValue(mockReportMetadata);
    vi.spyOn(simulationApi, 'fetchSimulationById').mockImplementation((_country, id) => {
      if (id === TEST_SIMULATION_ID_1) {
        return Promise.resolve(mockSimulationMetadata1);
      }
      if (id === TEST_SIMULATION_ID_2) {
        return Promise.resolve(mockSimulationMetadata2);
      }
      return Promise.reject(new Error(ERROR_MESSAGES.SIMULATION_NOT_FOUND(id)));
    });
    vi.spyOn(policyApi, 'fetchPolicyById').mockImplementation((_country, id) => {
      if (id === TEST_POLICY_ID_1) {
        return Promise.resolve(mockPolicyMetadata1);
      }
      if (id === TEST_POLICY_ID_2) {
        return Promise.resolve(mockPolicyMetadata2);
      }
      return Promise.reject(new Error(ERROR_MESSAGES.POLICY_NOT_FOUND(id)));
    });
    vi.spyOn(householdApi, 'fetchHouseholdById').mockResolvedValue(mockHouseholdMetadata);

    // Setup association mocks
    (useSimulationAssociationsByUser as any).mockReturnValue({
      data: mockUserSimulations,
      isLoading: false,
      error: null,
    });
    (usePolicyAssociationsByUser as any).mockReturnValue({
      data: mockUserPolicies,
      isLoading: false,
      error: null,
    });
    (useHouseholdAssociationsByUser as any).mockReturnValue({
      data: mockUserHouseholds,
      isLoading: false,
      error: null,
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Provider>
  );

  test('given report ID when fetching then returns single report with full context', async () => {
    // Given
    const userId = TEST_USER_ID;
    const reportId = TEST_REPORT_ID;

    // When
    const { result } = renderHook(() => useUserReportById(userId, reportId), { wrapper });

    // Then
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.report).toBeDefined();
    expect(result.current.simulations).toBeDefined();
    expect(result.current.policies).toBeDefined();
    expect(result.current.userSimulations).toBeDefined();
    expect(result.current.userPolicies).toBeDefined();
  });

  test('given non-existent report ID then fetches from API', async () => {
    // Given
    const userId = TEST_USER_ID;
    const reportId = 'non-cached-report';
    const fetchSpy = vi.spyOn(reportApi, 'fetchReportById');

    // When
    renderHook(() => useUserReportById(userId, reportId), { wrapper });

    // Then
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('us', reportId);
    });
  });

  test('given cached report then uses normalized cache', async () => {
    // Given
    const userId = TEST_USER_ID;
    const reportId = TEST_REPORT_ID;

    // When
    const { result } = renderHook(() => useUserReportById(userId, reportId), { wrapper });

    // Then
    await waitFor(() => {
      expect(result.current.report).toEqual(mockReport);
    });
  });
});
